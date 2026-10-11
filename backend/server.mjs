import { createServer } from 'node:http';
import { analyzeRoutesWithAi } from './aegisAi.mjs';

const PORT = Number(process.env.PORT) || 3001;
const API_PREFIX = '/api';
const ROUTING_API_URL = process.env.ROUTING_API_URL || 'https://valhalla1.openstreetmap.de/route';
const MAP_CENTER = parsePair(process.env.MAP_CENTER, [78.07, 11.1]);
const DEMO_BOUNDS = parseBounds(process.env.DEMO_BOUNDS) || {
  west: MAP_CENTER[0] - 0.2,
  south: MAP_CENTER[1] - 0.16,
  east: MAP_CENTER[0] + 0.2,
  north: MAP_CENTER[1] + 0.16,
};

const PROFILE_WEIGHTS = {
  general: { aqi: 0.6, traffic: 0.25, duration: 0.15 },
  asthma: { aqi: 0.8, traffic: 0.1, duration: 0.1 },
  elderly: { aqi: 0.7, traffic: 0.15, duration: 0.15 },
  child: { aqi: 0.75, traffic: 0.15, duration: 0.1 },
};

function parsePair(value, fallback) {
  if (!value) return fallback;
  const pair = value.split(',').map(Number);
  return pair.length === 2 && pair.every(Number.isFinite) ? pair : fallback;
}

function parseBounds(value) {
  if (!value) return null;
  const [west, south, east, north] = value.split(',').map(Number);
  if (![west, south, east, north].every(Number.isFinite) || west >= east || south >= north) {
    return null;
  }
  return { west, south, east, north };
}

const DELHI_BOUNDS = {
  west: 77.19,
  south: 28.60,
  east: 77.24,
  north: 28.65,
};
const DELHI_CENTER = [77.215, 28.625];
const EXISTING_AQI_API_URL = process.env.EXISTING_AQI_API_URL || 'https://cyprd9viih.execute-api.us-east-1.amazonaws.com/aqi';

let delhiGridCache = {
  cells: null,
  lastFetched: 0,
  ttlMs: 5 * 60 * 1000,
};

async function getDelhiAqiGrid() {
  const now = Date.now();
  if (delhiGridCache.cells && now - delhiGridCache.lastFetched < delhiGridCache.ttlMs) {
    return delhiGridCache.cells;
  }

  try {
    const res = await fetch(EXISTING_AQI_API_URL, {
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.cells) && data.cells.length > 0) {
        const halfSize = (data.cellSize || 0.002) / 2;
        const normalized = data.cells.map((c, i) => {
          const lat = Number(c.lat);
          const lng = Number(c.lng);
          const aqi = Number(c.aqi || 0);
          const traffic = Number(c.traffic || 0);
          const roadType = c.roadType || 'other';
          const level = c.level || levelForAqi(aqi);
          return {
            id: c.cellId || `delhi-${i}`,
            lat,
            lng,
            aqi,
            traffic,
            roadType,
            level,
            bounds: [lng - halfSize, lat - halfSize, lng + halfSize, lat + halfSize],
            source: 'dynamodb',
          };
        });
        delhiGridCache.cells = normalized;
        delhiGridCache.lastFetched = now;
        return normalized;
      }
    }
  } catch (err) {
    console.warn('Could not fetch existing Delhi AQI grid from upstream API:', err.message);
  }

  return delhiGridCache.cells || null;
}

function findNearestDelhiCell(cells, lng, lat) {
  if (!cells || cells.length === 0) return null;
  let nearest = null;
  let minDistanceSq = Infinity;
  for (const cell of cells) {
    const dSq = (cell.lng - lng) ** 2 + (cell.lat - lat) ** 2;
    if (dSq < minDistanceSq) {
      minDistanceSq = dSq;
      nearest = cell;
    }
  }
  return nearest;
}

function isPointInDelhi(lng, lat) {
  return lng >= DELHI_BOUNDS.west && lng <= DELHI_BOUNDS.east &&
         lat >= DELHI_BOUNDS.south && lat <= DELHI_BOUNDS.north;
}

function boundsOverlapDelhi(bounds) {
  if (!bounds) return false;
  return bounds.west <= DELHI_BOUNDS.east && bounds.east >= DELHI_BOUNDS.west &&
         bounds.south <= DELHI_BOUNDS.north && bounds.north >= DELHI_BOUNDS.south;
}


function jsonResponse(response, status, body) {
  const reqOrigin = response.reqOrigin;
  const configuredOrigin = process.env.CORS_ORIGIN || '*';
  let allowOrigin = configuredOrigin;

  if (configuredOrigin === '*') {
    allowOrigin = '*';
  } else {
    const allowed = configuredOrigin.split(',').map((item) => item.trim());
    if (reqOrigin && (allowed.includes(reqOrigin) || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(reqOrigin))) {
      allowOrigin = reqOrigin;
    } else {
      allowOrigin = allowed[0] || '*';
    }
  }

  response.writeHead(status, {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json; charset=utf-8',
  });
  response.end(JSON.stringify(body));
}

async function readJson(request) {
  let body = '';
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 1_000_000) throw new Error('Request body is too large.');
  }
  try {
    return JSON.parse(body);
  } catch {
    throw new Error('Request body must be valid JSON.');
  }
}

function validatePoint(point, name) {
  if (
    !point ||
    !Number.isFinite(point.lat) ||
    !Number.isFinite(point.lng) ||
    point.lat < -90 || point.lat > 90 ||
    point.lng < -180 || point.lng > 180
  ) {
    throw new Error(`${name} must contain valid numeric lat and lng values.`);
  }
}

function decodePolyline(encoded, precision = 6) {
  const coordinates = [];
  const factor = 10 ** precision;
  let index = 0;
  let latitude = 0;
  let longitude = 0;

  while (index < encoded.length) {
    const values = [];
    for (let coordinate = 0; coordinate < 2; coordinate += 1) {
      let result = 0;
      let shift = 0;
      let byte;
      do {
        if (index >= encoded.length) throw new Error('Routing service returned an invalid path.');
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      values.push(result & 1 ? ~(result >> 1) : result >> 1);
    }
    latitude += values[0];
    longitude += values[1];
    coordinates.push([longitude / factor, latitude / factor]);
  }

  return coordinates;
}

function levelForAqi(aqi) {
  if (aqi <= 50) return 'clean';
  if (aqi <= 100) return 'moderate';
  if (aqi <= 150) return 'high';
  return 'poor';
}

function estimateEnvironment(lng, lat) {
  const aqi = Math.round(Math.max(25, Math.min(180,
    68 + 17 * Math.sin(lng * 73 + lat * 31) + 13 * Math.cos(lat * 89 - lng * 19),
  )));
  const traffic = Math.round(Math.max(5, Math.min(90,
    38 + 24 * Math.sin(lng * 51 - lat * 35) + 13 * Math.cos(lat * 61 + lng * 27),
  )));
  return { aqi, traffic, level: levelForAqi(aqi) };
}

function createAqiCells(customBounds) {
  const activeBounds = customBounds || DEMO_BOUNDS;
  const columns = 8;
  const rows = 8;
  const cellWidth = (activeBounds.east - activeBounds.west) / columns;
  const cellHeight = (activeBounds.north - activeBounds.south) / rows;
  const cells = [];

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const west = activeBounds.west + column * cellWidth;
      const south = activeBounds.south + row * cellHeight;
      const centerLng = west + cellWidth / 2;
      const centerLat = south + cellHeight / 2;
      const { aqi, level } = estimateEnvironment(centerLng, centerLat);
      cells.push({
        id: `estimate-${row}-${column}`,
        lng: centerLng,
        lat: centerLat,
        bounds: [west, south, west + cellWidth, south + cellHeight],
        aqi,
        level,
      });
    }
  }

  return cells;
}

async function sampleRoute(coords) {
  const delhiCells = await getDelhiAqiGrid();
  const stride = Math.max(1, Math.floor(coords.length / 40));
  const samples = coords.filter((_, index) => index % stride === 0 || index === coords.length - 1);
  let usesDelhiCount = 0;

  const conditions = samples.map(([lng, lat]) => {
    if (delhiCells && isPointInDelhi(lng, lat)) {
      const nearest = findNearestDelhiCell(delhiCells, lng, lat);
      if (nearest) {
        usesDelhiCount += 1;
        return {
          aqi: nearest.aqi,
          traffic: nearest.traffic,
          level: nearest.level,
          isDelhiGrid: true,
        };
      }
    }
    return {
      ...estimateEnvironment(lng, lat),
      isDelhiGrid: false,
    };
  });

  const isDelhi = usesDelhiCount > 0;
  return {
    avgAqi: conditions.reduce((total, item) => total + item.aqi, 0) / conditions.length,
    avgTraffic: conditions.reduce((total, item) => total + item.traffic, 0) / conditions.length,
    aqiSource: isDelhi ? 'DynamoDB Delhi Grid (hourly scheduled model)' : 'deterministic demo estimate',
    aqiSourceType: isDelhi ? 'cached' : 'simulated',
    isLive: false,
  };
}

function scoreRoutes(routes, profile) {
  const weights = PROFILE_WEIGHTS[profile];
  const fastestDuration = Math.min(...routes.map((route) => route.durationMin));

  return routes.map((route) => {
    const aqiScore = Math.max(0, Math.min(100, 100 - route.avgAqi / 5));
    const trafficScore = Math.max(0, Math.min(100, 100 - route.avgTraffic));
    const durationScore = Math.max(0, Math.min(100, fastestDuration / route.durationMin * 100));
    const score = aqiScore * weights.aqi + trafficScore * weights.traffic + durationScore * weights.duration;

    return {
      ...route,
      avgAqi: Number(route.avgAqi.toFixed(1)),
      traffic: Number(route.avgTraffic.toFixed(1)),
      aqiLevel: levelForAqi(route.avgAqi),
      score: Number(score.toFixed(1)),
      healthLabel: levelForAqi(route.avgAqi),
      scoreBreakdown: { aqi: aqiScore, traffic: trafficScore, duration: durationScore, weights },
    };
  });
}

async function fetchJson(url, options) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(20_000) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || data.error_code || `Upstream service returned ${response.status}.`);
  }
  return data;
}

async function getRoutes(body) {
  const { origin, destination, mode, profile } = body || {};
  validatePoint(origin, 'origin');
  validatePoint(destination, 'destination');
  if (!['walking', 'cycling'].includes(mode)) throw new Error('mode must be walking or cycling.');
  if (!PROFILE_WEIGHTS[profile]) throw new Error('profile must be general, asthma, elderly, or child.');
  if (origin.lat === destination.lat && origin.lng === destination.lng) {
    throw new Error('Origin and destination cannot be the same location.');
  }

  const routingResult = await fetchJson(ROUTING_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      locations: [
        { lat: origin.lat, lon: origin.lng, type: 'break' },
        { lat: destination.lat, lon: destination.lng, type: 'break' },
      ],
      costing: mode === 'cycling' ? 'bicycle' : 'pedestrian',
      alternates: 2,
      units: 'kilometers',
      directions_options: { units: 'kilometers', language: 'en-US' },
    }),
  });

  const trips = [routingResult.trip, ...(routingResult.alternates || []).map((alternate) => alternate.trip || alternate)]
    .filter((trip) => Array.isArray(trip?.legs));
  const uniqueTrips = [];
  const seenPaths = new Set();

  for (const trip of trips) {
    const coords = trip.legs.flatMap((leg, index) => {
      const legCoords = decodePolyline(leg.shape);
      return index > 0 ? legCoords.slice(1) : legCoords;
    });
    if (coords.length < 2) continue;
    const signature = `${coords[0].join(',')}:${coords[Math.floor(coords.length / 2)].join(',')}:${coords.at(-1).join(',')}`;
    if (seenPaths.has(signature)) continue;
    seenPaths.add(signature);
    uniqueTrips.push({ trip, coords });
  }

  if (uniqueTrips.length === 0) throw new Error('No walk or cycle route was found for these locations.');

  const routes = await Promise.all(uniqueTrips.slice(0, 3).map(async ({ trip, coords }, index) => {
    const environment = await sampleRoute(coords);
    const distanceKm = Number(trip.summary.length.toFixed(2));
    const durationMin = Number((trip.summary.time / 60).toFixed(1));
    const level = levelForAqi(environment.avgAqi);
    return {
      id: `r${index + 1}`,
      label: index === 0 ? 'Recommended corridor' : `Alternative ${index}`,
      distanceKm,
      durationMin,
      avgAqi: environment.avgAqi,
      avgTraffic: environment.avgTraffic,
      aqiSource: environment.aqiSource,
      aqiSourceType: environment.aqiSourceType,
      coords,
      segments: [{ coords, level, aqi: Number(environment.avgAqi.toFixed(1)) }],
      steps: trip.legs.flatMap((leg) => (leg.maneuvers || []).map((maneuver) => ({
        instruction: maneuver.instruction || 'Continue on the selected route.',
        distanceKm: Number((maneuver.length || 0).toFixed(3)),
        durationMin: Number(((maneuver.time || 0) / 60).toFixed(1)),
      }))),
    };
  }));

  const scoredRoutes = scoreRoutes(routes, profile);
  const recommended = scoredRoutes.reduce((best, route) => route.score > best.score ? route : best);
  const fastest = scoredRoutes.reduce((best, route) => route.durationMin < best.durationMin ? route : best);

  let aegisAnalysis = null;
  try {
    aegisAnalysis = await analyzeRoutesWithAi({
      origin,
      destination,
      mode,
      profile,
      routes: scoredRoutes,
    });
  } catch (err) {
    console.error('Aegis AI analysis error:', err.message);
  }

  return {
    mode,
    profile,
    routeCount: scoredRoutes.length,
    recommendedRouteId: aegisAnalysis?.recommendedRouteId || recommended.id,
    fastestRouteId: fastest.id,
    scoringMethod: {
      scale: '0-100; higher is better',
      note: 'Evaluated by Aegis Route AI health navigation engine.',
    },
    aqiIsLive: false,
    trafficIsLive: false,
    aegisAnalysis,
    routes: scoredRoutes,
  };
}

async function searchPlaces(url) {
  const query = url.searchParams.get('q')?.trim();
  if (!query || query.length < 2) return [];
  if (query.length > 160) throw new Error('q must contain at most 160 characters.');

  const geocodeUrl = new URL('https://photon.komoot.io/api/');
  geocodeUrl.searchParams.set('q', query);
  geocodeUrl.searchParams.set('limit', '5');
  const proximity = url.searchParams.get('proximity');
  if (proximity && /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(proximity)) {
    const [lon, lat] = proximity.split(',');
    geocodeUrl.searchParams.set('lon', lon);
    geocodeUrl.searchParams.set('lat', lat);
  }

  try {
    const result = await fetchJson(geocodeUrl);
    return (result.features || []).flatMap((feature) => {
      const coordinates = feature.geometry?.coordinates;
      if (!Array.isArray(coordinates) || coordinates.length < 2) return [];
      const properties = feature.properties || {};
      const label = [
        properties.name,
        properties.street,
        properties.city || properties.county,
        properties.state,
        properties.country,
      ].filter((part, index, parts) => part && parts.indexOf(part) === index).join(', ');
      return [{ label: label || query, lng: coordinates[0], lat: coordinates[1] }];
    });
  } catch (err) {
    console.error('Photon search failed:', err.message);
    return [];
  }
}

const server = createServer(async (request, response) => {
  response.reqOrigin = request.headers.origin;
  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  if (request.method === 'OPTIONS') return jsonResponse(response, 204, {});

  try {
    const routePath = url.pathname.replace(/^\/api(?=\/|$)/, '') || '/';

    if (routePath === '/health' && request.method === 'GET') {
      return jsonResponse(response, 200, { status: 'ok', routing: 'Valhalla', map: 'OpenFreeMap', search: 'Photon' });
    }
    if (routePath === '/aqi' && request.method === 'GET') {
      let customBounds = null;
      const boundsParam = url.searchParams.get('bounds');
      const centerParam = url.searchParams.get('center');
      const regionParam = url.searchParams.get('region');
      if (boundsParam) {
        customBounds = parseBounds(boundsParam);
      } else if (centerParam) {
        const center = parsePair(centerParam, null);
        if (center) {
          customBounds = {
            west: center[0] - 0.15,
            south: center[1] - 0.12,
            east: center[0] + 0.15,
            north: center[1] + 0.12,
          };
        }
      }

      // Check if requested bounds overlap the existing Delhi AQI grid or region=delhi
      const isDelhiRequested = regionParam === 'delhi' ||
        boundsOverlapDelhi(customBounds) ||
        (customBounds === null && MAP_CENTER[0] > 75 && MAP_CENTER[0] < 79 && MAP_CENTER[1] > 26 && MAP_CENTER[1] < 30);

      if (isDelhiRequested) {
        const delhiCells = await getDelhiAqiGrid();
        if (delhiCells && delhiCells.length > 0) {
          return jsonResponse(response, 200, {
            cells: delhiCells,
            averageAqi: Math.round(delhiCells.reduce((sum, cell) => sum + cell.aqi, 0) / delhiCells.length),
            source: 'DynamoDB breatheroute-aqi (Delhi grid)',
            sourceType: 'cached',
            isLive: false,
            area: 'Delhi',
            itemCount: delhiCells.length,
          });
        }
      }

      const cells = createAqiCells(customBounds);
      return jsonResponse(response, 200, {
        cells,
        averageAqi: Math.round(cells.reduce((sum, cell) => sum + cell.aqi, 0) / cells.length),
        source: 'deterministic demo estimate',
        sourceType: 'simulated',
        isLive: false,
      });
    }
    if (routePath === '/places' && request.method === 'GET') {
      return jsonResponse(response, 200, { places: await searchPlaces(url) });
    }
    if (routePath === '/routes' && request.method === 'POST') {
      return jsonResponse(response, 200, await getRoutes(await readJson(request)));
    }
    if (routePath === '/aegis-analyze' && request.method === 'POST') {
      const payload = await readJson(request);
      return jsonResponse(response, 200, await analyzeRoutesWithAi(payload));
    }
    return jsonResponse(response, 404, { error: 'Endpoint not found.' });
  } catch (error) {
    const status = /must contain|must be|cannot be the same|between 2 and 160|valid JSON|too large/.test(error.message)
      ? 400
      : error.message.includes('not configured') ? 503 : 502;
    return jsonResponse(response, status, { error: error.message || 'Backend request failed.' });
  }
});

server.listen(PORT, () => {
  console.log(`BreatheRoute API listening at http://localhost:${PORT}${API_PREFIX}`);
});