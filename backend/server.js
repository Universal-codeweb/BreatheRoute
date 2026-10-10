// backend/server.js
// ------------------------------------------------------------------
// BreatheRoute Express Backend Server
//
// Provides three REST endpoints:
//   POST /routes    — find walking/cycling routes via OSRM, enrich with AQI
//   GET  /aqi       — return the AQI grid for map overlay
//   POST /explain   — generate a text explanation comparing two routes
//
// Uses OSRM public demo for routing and a simulated AQI grid
// seeded around the configured map center (Salem, TN by default).
// ------------------------------------------------------------------

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ------------------------------------------------------------------
// Configuration
// ------------------------------------------------------------------
const MAP_CENTER_LNG = parseFloat(process.env.MAP_CENTER_LNG || '78.07');
const MAP_CENTER_LAT = parseFloat(process.env.MAP_CENTER_LAT || '11.10');

// ------------------------------------------------------------------
// Scoring weights per health profile
// ------------------------------------------------------------------
const PROFILE_SCORING_WEIGHTS = {
  general: { aqi: 0.60, traffic: 0.25, duration: 0.15 },
  asthma:  { aqi: 0.80, traffic: 0.10, duration: 0.10 },
  elderly: { aqi: 0.70, traffic: 0.15, duration: 0.15 },
  child:   { aqi: 0.75, traffic: 0.15, duration: 0.10 },
};

const PROFILES = ['general', 'asthma', 'elderly', 'child'];
const MODES = ['walking', 'cycling'];

// ------------------------------------------------------------------
// AQI Grid Generator — Simulates realistic city AQI readings
// ------------------------------------------------------------------
function generateAqiGrid(centerLng, centerLat) {
  const cells = [];
  const gridSize = 12;
  const cellSpacing = 0.008; // ~0.8 km per cell

  // Seed a deterministic-ish pattern based on position
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const lng = centerLng - (gridSize / 2) * cellSpacing + col * cellSpacing;
      const lat = centerLat - (gridSize / 2) * cellSpacing + row * cellSpacing;

      // Simulate AQI: center tends to be higher (urban core), edges lower
      const distFromCenter = Math.sqrt(
        Math.pow(col - gridSize / 2, 2) + Math.pow(row - gridSize / 2, 2)
      );
      const baseAqi = 30 + Math.round(distFromCenter * 8);
      // Add deterministic variation based on position
      const variation = Math.round(
        Math.sin(lng * 1000) * 15 + Math.cos(lat * 1000) * 10
      );
      const aqi = Math.max(10, Math.min(200, baseAqi + variation));

      // Traffic correlates somewhat with AQI
      const traffic = Math.max(5, Math.min(95, aqi * 0.6 + Math.round(Math.sin(col * row) * 15)));

      let level;
      if (aqi <= 50) level = 'clean';
      else if (aqi <= 100) level = 'moderate';
      else if (aqi <= 150) level = 'high';
      else level = 'poor';

      const west = lng - cellSpacing / 2;
      const east = lng + cellSpacing / 2;
      const south = lat - cellSpacing / 2;
      const north = lat + cellSpacing / 2;

      cells.push({
        id: `cell-${row}-${col}`,
        lat: Number(lat.toFixed(5)),
        lng: Number(lng.toFixed(5)),
        aqi,
        traffic,
        level,
        bounds: [
          Number(west.toFixed(5)),
          Number(south.toFixed(5)),
          Number(east.toFixed(5)),
          Number(north.toFixed(5)),
        ],
      });
    }
  }

  return cells;
}

// Pre-compute the grid at startup
const aqiGrid = generateAqiGrid(MAP_CENTER_LNG, MAP_CENTER_LAT);

// ------------------------------------------------------------------
// Haversine distance in meters
// ------------------------------------------------------------------
function haversineMeters(point1, point2) {
  const R = 6371000;
  const rad = Math.PI / 180;
  const lat1 = point1[1] * rad;
  const lat2 = point2[1] * rad;
  const dLat = (point2[1] - point1[1]) * rad;
  const dLng = (point2[0] - point1[0]) * rad;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(Math.max(0, Math.min(1, a))));
}

// ------------------------------------------------------------------
// Sample points along a polyline at regular intervals
// ------------------------------------------------------------------
function samplePoints(coords, spacingMeters = 100) {
  if (!coords || coords.length === 0) return [];
  const sampled = [[coords[0][0], coords[0][1]]];
  let distSinceLast = 0;

  for (let i = 1; i < coords.length; i++) {
    const start = coords[i - 1];
    const end = coords[i];
    const segDist = haversineMeters(start, end);
    if (segDist === 0) continue;

    let distAlong = 0;
    while (distSinceLast + (segDist - distAlong) >= spacingMeters) {
      const needed = spacingMeters - distSinceLast;
      distAlong += needed;
      const frac = distAlong / segDist;
      sampled.push([
        start[0] + (end[0] - start[0]) * frac,
        start[1] + (end[1] - start[1]) * frac,
      ]);
      distSinceLast = 0;
    }
    distSinceLast += segDist - distAlong;
  }

  const last = coords[coords.length - 1];
  const lastSamp = sampled[sampled.length - 1];
  if (lastSamp[0] !== last[0] || lastSamp[1] !== last[1]) {
    sampled.push([last[0], last[1]]);
  }
  return sampled;
}

// ------------------------------------------------------------------
// Look up AQI for a sample point from the grid
// ------------------------------------------------------------------
function lookupAqi(point) {
  let nearest = null;
  let nearestDist = Infinity;

  for (const cell of aqiGrid) {
    const dist = haversineMeters(point, [cell.lng, cell.lat]);
    if (dist < nearestDist) {
      nearest = cell;
      nearestDist = dist;
    }
  }

  if (nearest && nearestDist <= 500) {
    return { aqi: nearest.aqi, traffic: nearest.traffic, level: nearest.level };
  }
  return { aqi: 70, traffic: 30, level: 'moderate' };
}

// ------------------------------------------------------------------
// Fetch routes from OSRM public API
// ------------------------------------------------------------------
async function fetchOsrmRoutes(origin, destination, mode) {
  // OSRM profile: foot for walking, bike for cycling
  const profile = mode === 'cycling' ? 'bike' : 'foot';
  const url =
    `https://router.project-osrm.org/route/v1/${profile}/` +
    `${origin.lng},${origin.lat};${destination.lng},${destination.lat}` +
    `?overview=full&geometries=geojson&alternatives=true&steps=true`;

  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`OSRM returned status ${resp.status}`);
  }
  const data = await resp.json();
  if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
    throw new Error('No route found between these locations.');
  }
  return data.routes;
}

// ------------------------------------------------------------------
// Classify AQI level
// ------------------------------------------------------------------
function aqiLevel(aqi) {
  if (aqi <= 50) return 'clean';
  if (aqi <= 100) return 'moderate';
  if (aqi <= 150) return 'high';
  return 'poor';
}

// ------------------------------------------------------------------
// Build a route label
// ------------------------------------------------------------------
function routeLabel(index, totalRoutes) {
  if (totalRoutes <= 1) return 'Main Route';
  const labels = ['Primary Route', 'Alternative Route A', 'Alternative Route B', 'Alternative Route C'];
  return labels[index] || `Route ${index + 1}`;
}

// ------------------------------------------------------------------
// Determine health label
// ------------------------------------------------------------------
function healthLabel(avgAqi, traffic) {
  if (avgAqi <= 40 && traffic < 30) return 'Excellent for health';
  if (avgAqi <= 60) return 'Good air quality';
  if (avgAqi <= 100) return 'Moderate exposure';
  if (avgAqi <= 150) return 'Elevated pollution';
  return 'Unhealthy air';
}

// ------------------------------------------------------------------
// Determine traffic label
// ------------------------------------------------------------------
function trafficLabel(traffic) {
  if (traffic < 20) return 'Very Low';
  if (traffic < 40) return 'Low';
  if (traffic < 60) return 'Moderate';
  if (traffic < 80) return 'Heavy';
  return 'Very Heavy';
}

// ------------------------------------------------------------------
// Score routes based on profile weights
// ------------------------------------------------------------------
function scoreRoutes(routes, profile) {
  const weights = PROFILE_SCORING_WEIGHTS[profile];
  const fastestDuration = Math.min(...routes.map((r) => r.durationMin));

  return routes.map((route) => {
    const aqiScore = Math.max(0, Math.min(100, 100 - (route.avgAqi / 500) * 100));
    const trafficScore = Math.max(0, Math.min(100, 100 - route.avgTraffic));
    const durationScore =
      route.durationMin > 0
        ? Math.max(0, Math.min(100, (fastestDuration / route.durationMin) * 100))
        : 100;

    const score = Number(
      (aqiScore * weights.aqi + trafficScore * weights.traffic + durationScore * weights.duration).toFixed(2)
    );

    return {
      ...route,
      score,
      scoreBreakdown: {
        aqiScore: Number(aqiScore.toFixed(2)),
        trafficScore: Number(trafficScore.toFixed(2)),
        durationScore: Number(durationScore.toFixed(2)),
        weights,
      },
    };
  });
}

// ==================================================================
// ENDPOINT: POST /routes
// ==================================================================
app.post('/routes', async (req, res) => {
  try {
    const { origin, destination, mode, profile } = req.body;

    // Validate inputs
    if (!origin || !origin.lat || !origin.lng) {
      return res.status(400).json({ error: 'origin must contain valid lat and lng.' });
    }
    if (!destination || !destination.lat || !destination.lng) {
      return res.status(400).json({ error: 'destination must contain valid lat and lng.' });
    }
    if (!MODES.includes(mode)) {
      return res.status(400).json({ error: 'mode must be walking or cycling.' });
    }
    if (!PROFILES.includes(profile)) {
      return res.status(400).json({ error: 'profile must be general, asthma, elderly, or child.' });
    }

    // Fetch routes from OSRM
    const osrmRoutes = await fetchOsrmRoutes(origin, destination, mode);

    // Process each route
    const processedRoutes = osrmRoutes.map((osrmRoute, index) => {
      const coords = osrmRoute.geometry.coordinates; // [lng, lat] pairs
      const distanceKm = Number((osrmRoute.distance / 1000).toFixed(3));
      const durationMin = Number((osrmRoute.duration / 60).toFixed(2));

      // Sample points for AQI lookup
      const sampled = samplePoints(coords, 100);

      // Look up AQI for each sampled point
      const lookups = sampled.map((pt) => lookupAqi(pt));
      const avgAqi = Number(
        (lookups.reduce((s, l) => s + l.aqi, 0) / lookups.length).toFixed(2)
      );
      const avgTraffic = Number(
        (lookups.reduce((s, l) => s + l.traffic, 0) / lookups.length).toFixed(2)
      );

      // Build segments from OSRM steps
      const segments = [];
      const legs = osrmRoute.legs || [];
      for (const leg of legs) {
        for (const step of leg.steps || []) {
          if (step.geometry && step.geometry.coordinates && step.geometry.coordinates.length >= 2) {
            const segCoords = step.geometry.coordinates;
            const segSampled = samplePoints(segCoords, 50);
            const segLookups = segSampled.map((pt) => lookupAqi(pt));
            const segAqi = Number(
              (segLookups.reduce((s, l) => s + l.aqi, 0) / segLookups.length).toFixed(1)
            );
            const segLevel = aqiLevel(segAqi);

            segments.push({
              name: step.name || 'Unnamed road',
              instruction: step.maneuver?.type
                ? `${step.maneuver.type}${step.name ? ' onto ' + step.name : ''}`
                : step.name || 'Continue',
              distance: Number((step.distance / 1000).toFixed(3)),
              duration: Number((step.duration / 60).toFixed(2)),
              coords: segCoords,
              aqi: segAqi,
              level: segLevel,
            });
          }
        }
      }

      return {
        id: `r${index + 1}`,
        label: routeLabel(index, osrmRoutes.length),
        distanceKm,
        durationMin,
        coords,
        avgAqi,
        avgTraffic,
        aqiLevel: aqiLevel(avgAqi),
        traffic: trafficLabel(avgTraffic),
        healthLabel: healthLabel(avgAqi, avgTraffic),
        reason: '',
        segments,
        sampledPoints: sampled,
      };
    });

    // Score all routes
    const scoredRoutes = scoreRoutes(processedRoutes, profile);

    // Find recommended (highest score) and fastest
    const recommendedRoute = scoredRoutes.reduce((best, r) =>
      r.score > best.score ? r : best
    );
    const fastestRoute = scoredRoutes.reduce((fast, r) =>
      r.durationMin < fast.durationMin ? r : fast
    );

    // Add reason text
    for (const route of scoredRoutes) {
      if (route.id === recommendedRoute.id) {
        route.reason = `Recommended for your ${profile} profile — best overall health score of ${route.score}.`;
      } else if (route.id === fastestRoute.id) {
        route.reason = `Fastest route at ${route.durationMin.toFixed(1)} min, but higher pollution exposure.`;
      } else {
        route.reason = `Alternative route with AQI ${route.avgAqi} and ${route.traffic} traffic.`;
      }
    }

    const weights = PROFILE_SCORING_WEIGHTS[profile];

    return res.json({
      message: 'Routes calculated, enriched with AQI data, and scored',
      mode,
      profile,
      routeCount: scoredRoutes.length,
      fastestRouteId: fastestRoute.id,
      recommendedRouteId: recommendedRoute.id,
      scoringMethod: {
        scale: '0-100; higher is better',
        profile,
        weights: {
          aqi: weights.aqi * 100,
          traffic: weights.traffic * 100,
          duration: weights.duration * 100,
        },
        note: 'Experimental route preference score.',
      },
      routes: scoredRoutes,
    });
  } catch (err) {
    console.error('Route handler error:', err);
    return res.status(500).json({
      error: err.message || 'Unable to calculate routes right now.',
    });
  }
});

// ==================================================================
// ENDPOINT: GET /aqi
// ==================================================================
app.get('/aqi', (_req, res) => {
  res.json({
    message: 'AQI grid data',
    cellCount: aqiGrid.length,
    cells: aqiGrid,
  });
});

// ==================================================================
// ENDPOINT: POST /explain
// ==================================================================
app.post('/explain', (req, res) => {
  try {
    const { routes, profile } = req.body;

    if (!Array.isArray(routes) || routes.length < 2 || !profile) {
      return res
        .status(400)
        .json({ error: 'Send { routes: [fastestRoute, cleanRoute], profile }' });
    }

    const [fastest, clean] = routes;
    const extraMin = Math.max(0, (clean.durationMin || 0) - (fastest.durationMin || 0)).toFixed(1);
    const drop =
      fastest.avgAqi > 0
        ? Math.round(((fastest.avgAqi - clean.avgAqi) / fastest.avgAqi) * 100)
        : 0;

    const PROFILE_REASON = {
      asthma:
        'Cleaner air lowers the risk of breathing trouble.',
      elderly:
        'Cleaner air and calmer streets are easier on the lungs and heart.',
      child:
        'Children breathe faster, so less traffic exhaust matters more.',
      general:
        'It reduces your pollution exposure for a small time cost.',
    };

    const why = PROFILE_REASON[profile] || 'It reduces your pollution exposure.';

    const text =
      `This route takes ${extraMin} min longer but has ${drop}% lower AQI ` +
      `(${clean.avgAqi} vs ${fastest.avgAqi}) with ${String(clean.traffic || 'moderate').toLowerCase()} traffic. ${why}`;

    return res.json({ text });
  } catch (err) {
    console.error('Explain handler error:', err);
    return res.status(500).json({ error: 'Unable to generate explanation.' });
  }
});

// ==================================================================
// Health check
// ==================================================================
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'breatheroute-backend' });
});

// ==================================================================
// Start server
// ==================================================================
app.listen(PORT, () => {
  console.log(`\n  🫁 BreatheRoute backend running at http://localhost:${PORT}`);
  console.log(`     POST /routes   — calculate and score routes`);
  console.log(`     GET  /aqi      — AQI grid overlay data`);
  console.log(`     POST /explain  — route comparison explanation`);
  console.log(`     GET  /health   — health check\n`);
});
