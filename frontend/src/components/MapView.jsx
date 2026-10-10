// src/components/MapView.jsx
// ------------------------------------------------------------------
// Production MapView component using MapLibre GL.
//
// Key capabilities:
// - MapTiler Streets vector style
// - Segment lines colored by AQI level (thick selected route with
//   white casing, dashed fastest, muted alternatives)
// - Origin and Destination custom markers with pulsing status rings
// - AQI grid overlay with toggleable visual mesh
// - "Pick on map" crosshair mode for intuitive spatial selection
// - Real-time live navigation marker with heading & accuracy ring
// - Interactive hover popups & route selection by clicking lines
// ------------------------------------------------------------------

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import config from '../config';
import { getAqiGrid } from '../api';
import { LEVEL_COLORS } from '../utils/colors';

function getMapStyleUrl() {
  return `https://api.maptiler.com/maps/${encodeURIComponent(config.maptilerStyleId)}/style.json?key=${encodeURIComponent(config.maptilerApiKey)}`;
}

function getLevelColor(level) {
  return LEVEL_COLORS[level] || LEVEL_COLORS.moderate;
}

export default function MapView({
  routes = [],
  selectedRouteId = null,
  onSelectRoute = () => {},
  origin = null,
  destination = null,
  pickMode = null, // 'origin' | 'destination' | null
  onPickLocation = () => {},
  onCancelPick = () => {},
  liveLocation = null, // { lat, lng, heading }
  initialCenter = null,
  initialZoom = null,
  className = '',
  height = '100%',
  showGridDefault = true,
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  // Markers refs
  const originMarkerRef = useRef(null);
  const destinationMarkerRef = useRef(null);
  const liveMarkerRef = useRef(null);

  // Layer toggles & status
  const [showAqiGrid, setShowAqiGrid] = useState(showGridDefault);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [aqiCells, setAqiCells] = useState([]);
  const [isStyleReady, setIsStyleReady] = useState(false);

  // Keep references to active callbacks so map listeners never capture stale state
  const callbacksRef = useRef({
    onSelectRoute,
    onPickLocation,
    pickMode,
  });
  useEffect(() => {
    callbacksRef.current = { onSelectRoute, onPickLocation, pickMode };
  });

  // Fetch AQI Grid cells for map overlay
  useEffect(() => {
    let isMounted = true;
    getAqiGrid()
      .then((data) => {
        if (!isMounted) return;
        if (data && Array.isArray(data.cells)) {
          setAqiCells(data.cells);
        }
      })
      .catch(() => {
        // Silently tolerate backend unavailability
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // -----------------------------------------------------------------
  // Initialize MapLibre map instance
  // -----------------------------------------------------------------
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const center = initialCenter || config.mapCenter || [78.07, 11.10];
    const zoom = initialZoom || config.mapZoom || 13;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: getMapStyleUrl(),
      center,
      zoom,
      attributionControl: true,
      fadeDuration: 150,
    });

    // Add navigation control
    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');

    map.on('load', () => {
      setMapLoaded(true);
      setIsStyleReady(true);
      map.resize();
    });

    map.on('styledata', () => {
      setIsStyleReady(true);
    });

    // Handle clicks for "Pick on map" mode
    map.on('click', (e) => {
      const currentPickMode = callbacksRef.current.pickMode;
      if (currentPickMode) {
        const lng = Number(e.lngLat.lng.toFixed(5));
        const lat = Number(e.lngLat.lat.toFixed(5));
        const modeLabel = currentPickMode === 'origin' ? 'Selected Origin' : 'Selected Destination';
        callbacksRef.current.onPickLocation({
          lat,
          lng,
          label: `${modeLabel} (${lat}, ${lng})`,
        });
      }
    });

    mapRef.current = map;

    // Window resize observer
    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      const originMarker = originMarkerRef.current;
      const destinationMarker = destinationMarkerRef.current;
      const liveMarker = liveMarkerRef.current;
      if (originMarker) originMarker.remove();
      if (destinationMarker) destinationMarker.remove();
      if (liveMarker) liveMarker.remove();
      map.remove();
      mapRef.current = null;
    };
  }, [initialCenter, initialZoom]);

  // Update cursor based on pickMode
  useEffect(() => {
    if (!mapRef.current) return;
    const canvas = mapRef.current.getCanvas();
    if (canvas) {
      canvas.style.cursor = pickMode ? 'crosshair' : '';
    }
  }, [pickMode]);

  // -----------------------------------------------------------------
  // Sync Markers: Origin, Destination & Live Navigation Location
  // -----------------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    // 1. Origin Marker
    if (origin && typeof origin.lng === 'number' && typeof origin.lat === 'number') {
      if (!originMarkerRef.current) {
        const el = document.createElement('div');
        el.className = 'origin-marker-container flex flex-col items-center group cursor-pointer';
        el.innerHTML = `
          <div class="relative flex items-center justify-center">
            <span class="absolute w-8 h-8 rounded-full bg-secondary/30 animate-ping"></span>
            <span class="w-7 h-7 rounded-full bg-secondary text-white flex items-center justify-center shadow-lg border-2 border-white text-xs font-bold font-mono">A</span>
          </div>
          <div class="mt-1 px-2 py-0.5 rounded bg-surface/90 text-on-surface text-[11px] font-semibold shadow-md border border-outline-variant/30 backdrop-blur-sm whitespace-nowrap opacity-90 group-hover:opacity-100 transition-opacity">
            ${origin.label || 'Origin'}
          </div>
        `;
        originMarkerRef.current = new maplibregl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([origin.lng, origin.lat])
          .addTo(map);
      } else {
        originMarkerRef.current.setLngLat([origin.lng, origin.lat]);
      }
    } else if (originMarkerRef.current) {
      originMarkerRef.current.remove();
      originMarkerRef.current = null;
    }

    // 2. Destination Marker
    if (destination && typeof destination.lng === 'number' && typeof destination.lat === 'number') {
      if (!destinationMarkerRef.current) {
        const el = document.createElement('div');
        el.className = 'dest-marker-container flex flex-col items-center group cursor-pointer';
        el.innerHTML = `
          <div class="relative flex items-center justify-center">
            <span class="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center shadow-lg border-2 border-white text-xs font-bold font-mono">B</span>
          </div>
          <div class="mt-1 px-2 py-0.5 rounded bg-surface/90 text-on-surface text-[11px] font-semibold shadow-md border border-outline-variant/30 backdrop-blur-sm whitespace-nowrap opacity-90 group-hover:opacity-100 transition-opacity">
            ${destination.label || 'Destination'}
          </div>
        `;
        destinationMarkerRef.current = new maplibregl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([destination.lng, destination.lat])
          .addTo(map);
      } else {
        destinationMarkerRef.current.setLngLat([destination.lng, destination.lat]);
      }
    } else if (destinationMarkerRef.current) {
      destinationMarkerRef.current.remove();
      destinationMarkerRef.current = null;
    }

    // 3. Live Navigation Beacon Marker
    if (liveLocation && typeof liveLocation.lng === 'number' && typeof liveLocation.lat === 'number') {
      if (!liveMarkerRef.current) {
        const el = document.createElement('div');
        el.className = 'live-marker-container relative flex items-center justify-center';
        el.innerHTML = `
          <span class="absolute w-10 h-10 rounded-full bg-blue-500/25 animate-ping"></span>
          <span class="absolute w-6 h-6 rounded-full bg-blue-400/40"></span>
          <span class="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-md"></span>
        `;
        liveMarkerRef.current = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([liveLocation.lng, liveLocation.lat])
          .addTo(map);
      } else {
        liveMarkerRef.current.setLngLat([liveLocation.lng, liveLocation.lat]);
      }
    } else if (liveMarkerRef.current) {
      liveMarkerRef.current.remove();
      liveMarkerRef.current = null;
    }
  }, [origin, destination, liveLocation, mapLoaded]);

  // -----------------------------------------------------------------
  // Sync GeoJSON Route Layers (Selected Route with Casing, Fastest, Alts)
  // -----------------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !isStyleReady) return;

    const activeSelectedId =
      selectedRouteId ||
      routes.find((r) => r.isRecommended)?.id ||
      routes[0]?.id ||
      null;

    const selectedRoute = routes.find((r) => r.id === activeSelectedId);
    const alternativeRoutes = routes.filter((r) => r.id !== activeSelectedId);

    // 1. Prepare Selected Route GeoJSON (Segments with AQI levels)
    const selectedSegmentsFeatures = [];
    const selectedFullCoords = [];

    if (selectedRoute) {
      if (Array.isArray(selectedRoute.segments) && selectedRoute.segments.length > 0) {
        selectedRoute.segments.forEach((seg, sIdx) => {
          if (Array.isArray(seg.coords) && seg.coords.length >= 2) {
            selectedSegmentsFeatures.push({
              type: 'Feature',
              properties: {
                segmentIndex: sIdx,
                level: seg.level || selectedRoute.aqiLevel || 'moderate',
                color: getLevelColor(seg.level || selectedRoute.aqiLevel || 'moderate'),
                aqi: seg.aqi || selectedRoute.aqi,
                instruction: seg.instruction || seg.name || `Segment ${sIdx + 1}`,
              },
              geometry: {
                type: 'LineString',
                coordinates: seg.coords,
              },
            });
            // Accumulate coordinates for full casing
            seg.coords.forEach((c) => selectedFullCoords.push(c));
          }
        });
      } else if (Array.isArray(selectedRoute.coords) && selectedRoute.coords.length >= 2) {
        selectedSegmentsFeatures.push({
          type: 'Feature',
          properties: {
            segmentIndex: 0,
            level: selectedRoute.aqiLevel || 'moderate',
            color: getLevelColor(selectedRoute.aqiLevel || 'moderate'),
            aqi: selectedRoute.aqi,
            instruction: selectedRoute.name,
          },
          geometry: {
            type: 'LineString',
            coordinates: selectedRoute.coords,
          },
        });
        selectedRoute.coords.forEach((c) => selectedFullCoords.push(c));
      }
    }

    // Selected Route Casing Feature
    const selectedCasingFeatures =
      selectedFullCoords.length >= 2
        ? [
            {
              type: 'Feature',
              properties: { id: selectedRoute?.id },
              geometry: {
                type: 'LineString',
                coordinates: selectedFullCoords,
              },
            },
          ]
        : [];

    // 2. Prepare Alternative Routes Features
    const altFeatures = [];
    alternativeRoutes.forEach((alt) => {
      const coords = [];
      if (Array.isArray(alt.segments) && alt.segments.length > 0) {
        alt.segments.forEach((seg) => {
          if (Array.isArray(seg.coords)) {
            seg.coords.forEach((c) => coords.push(c));
          }
        });
      } else if (Array.isArray(alt.coords)) {
        alt.coords.forEach((c) => coords.push(c));
      }

      if (coords.length >= 2) {
        altFeatures.push({
          type: 'Feature',
          properties: {
            id: alt.id,
            name: alt.name,
            isFastest: Boolean(alt.isFastest),
            time: alt.time,
            aqi: alt.aqi,
            aqiLevel: alt.aqiLevel,
          },
          geometry: {
            type: 'LineString',
            coordinates: coords,
          },
        });
      }
    });

    // Helper: Safely add or update GeoJSON source
    const setSourceData = (sourceId, data) => {
      const src = map.getSource(sourceId);
      if (src) {
        src.setData(data);
      } else {
        map.addSource(sourceId, { type: 'geojson', data });
      }
    };

    // Helper: Safely add layer if it doesn't already exist
    const ensureLayer = (layerDef, beforeId) => {
      if (!map.getLayer(layerDef.id)) {
        if (beforeId && map.getLayer(beforeId)) {
          map.addLayer(layerDef, beforeId);
        } else {
          map.addLayer(layerDef);
        }
      }
    };

    try {
      // Set Sources
      setSourceData('route-alts-source', {
        type: 'FeatureCollection',
        features: altFeatures,
      });

      setSourceData('route-casing-source', {
        type: 'FeatureCollection',
        features: selectedCasingFeatures,
      });

      setSourceData('route-segments-source', {
        type: 'FeatureCollection',
        features: selectedSegmentsFeatures,
      });

      // Layer 1: Alternative Routes (Muted solid)
      ensureLayer({
        id: 'layer-route-alts-solid',
        type: 'line',
        source: 'route-alts-source',
        filter: ['!=', ['get', 'isFastest'], true],
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#94a3b8',
          'line-width': 3.5,
          'line-opacity': 0.55,
        },
      });

      // Layer 2: Alternative Fastest Route (Dashed)
      ensureLayer({
        id: 'layer-route-alts-dashed',
        type: 'line',
        source: 'route-alts-source',
        filter: ['==', ['get', 'isFastest'], true],
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#64748b',
          'line-width': 4,
          'line-dasharray': [3, 2],
          'line-opacity': 0.85,
        },
      });

      // Layer 3: Selected Route White Casing (Crisp, premium outline)
      ensureLayer({
        id: 'layer-route-casing',
        type: 'line',
        source: 'route-casing-source',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#ffffff',
          'line-width': 11,
          'line-opacity': 0.95,
        },
      });

      // Layer 4: Selected Route Segment Lines (Colored by AQI Level)
      ensureLayer({
        id: 'layer-route-segments',
        type: 'line',
        source: 'route-segments-source',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 6.5,
          'line-opacity': 0.95,
        },
      });

      // Setup click selection on alternative routes
      const handleAltClick = (e) => {
        if (e.features && e.features[0]) {
          const rId = e.features[0].properties.id;
          if (rId) callbacksRef.current.onSelectRoute(rId);
        }
      };

      const handleAltEnter = () => {
        if (!callbacksRef.current.pickMode) {
          map.getCanvas().style.cursor = 'pointer';
        }
      };

      const handleAltLeave = () => {
        if (!callbacksRef.current.pickMode) {
          map.getCanvas().style.cursor = '';
        }
      };

      map.off('click', 'layer-route-alts-solid', handleAltClick);
      map.off('click', 'layer-route-alts-dashed', handleAltClick);
      map.on('click', 'layer-route-alts-solid', handleAltClick);
      map.on('click', 'layer-route-alts-dashed', handleAltClick);

      map.on('mouseenter', 'layer-route-alts-solid', handleAltEnter);
      map.on('mouseenter', 'layer-route-alts-dashed', handleAltEnter);
      map.on('mouseleave', 'layer-route-alts-solid', handleAltLeave);
      map.on('mouseleave', 'layer-route-alts-dashed', handleAltLeave);
    } catch {
      // tolerate style reload races
    }
  }, [routes, selectedRouteId, mapLoaded, isStyleReady]);

  // -----------------------------------------------------------------
  // Sync AQI Grid Overlay Layer
  // -----------------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !isStyleReady) return;

    if (!showAqiGrid || aqiCells.length === 0) {
      if (map.getLayer('layer-aqi-grid-fill')) {
        map.setLayoutProperty('layer-aqi-grid-fill', 'visibility', 'none');
      }
      if (map.getLayer('layer-aqi-grid-line')) {
        map.setLayoutProperty('layer-aqi-grid-line', 'visibility', 'none');
      }
      return;
    }

    const gridFeatures = [];
    aqiCells.forEach((cell, idx) => {
      const lvl = cell.level || 'moderate';
      const clr = getLevelColor(lvl);

      // If cell has polygon bounds [west, south, east, north]
      if (Array.isArray(cell.bounds) && cell.bounds.length === 4) {
        const [w, s, e, n] = cell.bounds;
        gridFeatures.push({
          type: 'Feature',
          properties: { id: cell.id || idx, aqi: cell.aqi, level: lvl, color: clr },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [w, s],
                [e, s],
                [e, n],
                [w, n],
                [w, s],
              ],
            ],
          },
        });
      } else if (typeof cell.lng === 'number' && typeof cell.lat === 'number') {
        // Construct small ~0.008 deg square around center
        const offset = 0.004;
        const w = cell.lng - offset;
        const e = cell.lng + offset;
        const s = cell.lat - offset;
        const n = cell.lat + offset;
        gridFeatures.push({
          type: 'Feature',
          properties: { id: cell.id || idx, aqi: cell.aqi, level: lvl, color: clr },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [w, s],
                [e, s],
                [e, n],
                [w, n],
                [w, s],
              ],
            ],
          },
        });
      }
    });

    try {
      const src = map.getSource('aqi-grid-source');
      const fc = { type: 'FeatureCollection', features: gridFeatures };
      if (src) {
        src.setData(fc);
      } else {
        map.addSource('aqi-grid-source', { type: 'geojson', data: fc });
      }

      // Add fill layer (placed beneath routes)
      if (!map.getLayer('layer-aqi-grid-fill')) {
        map.addLayer(
          {
            id: 'layer-aqi-grid-fill',
            type: 'fill',
            source: 'aqi-grid-source',
            paint: {
              'fill-color': ['get', 'color'],
              'fill-opacity': 0.18,
            },
          },
          map.getLayer('layer-route-alts-solid') ? 'layer-route-alts-solid' : undefined
        );
      } else {
        map.setLayoutProperty('layer-aqi-grid-fill', 'visibility', 'visible');
      }

      // Add line layer for subtle cell border
      if (!map.getLayer('layer-aqi-grid-line')) {
        map.addLayer(
          {
            id: 'layer-aqi-grid-line',
            type: 'line',
            source: 'aqi-grid-source',
            paint: {
              'line-color': ['get', 'color'],
              'line-width': 0.8,
              'line-opacity': 0.35,
            },
          },
          map.getLayer('layer-route-alts-solid') ? 'layer-route-alts-solid' : undefined
        );
      } else {
        map.setLayoutProperty('layer-aqi-grid-line', 'visibility', 'visible');
      }
    } catch {
      // tolerate style reload races
    }
  }, [showAqiGrid, aqiCells, mapLoaded, isStyleReady]);

  // -----------------------------------------------------------------
  // Auto-fit bounds whenever routes or origin/dest points change
  // -----------------------------------------------------------------
  const fitBoundsToContent = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    const bounds = new maplibregl.LngLatBounds();
    let hasPoints = false;

    // Include origin & destination
    if (origin && typeof origin.lng === 'number' && typeof origin.lat === 'number') {
      bounds.extend([origin.lng, origin.lat]);
      hasPoints = true;
    }
    if (destination && typeof destination.lng === 'number' && typeof destination.lat === 'number') {
      bounds.extend([destination.lng, destination.lat]);
      hasPoints = true;
    }

    // Include route coordinates
    routes.forEach((r) => {
      if (Array.isArray(r.segments)) {
        r.segments.forEach((seg) => {
          if (Array.isArray(seg.coords)) {
            seg.coords.forEach((c) => {
              bounds.extend(c);
              hasPoints = true;
            });
          }
        });
      }
      if (Array.isArray(r.coords)) {
        r.coords.forEach((c) => {
          bounds.extend(c);
          hasPoints = true;
        });
      }
    });

    if (hasPoints) {
      map.fitBounds(bounds, {
        padding: { top: 70, bottom: 70, left: 70, right: 70 },
        maxZoom: 16,
        duration: 800,
      });
    }
  }, [routes, origin, destination]);

  useEffect(() => {
    if (mapLoaded && (routes.length > 0 || (origin && destination))) {
      fitBoundsToContent();
    }
  }, [routes, origin, destination, mapLoaded, fitBoundsToContent]);

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden border border-surface-container bg-surface-container-low shadow-sm ${className}`}
      style={{ height }}
    >
      {/* MapLibre DOM Node */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* "Pick on Map" Active Banner */}
      {pickMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-primary text-on-primary px-space-md py-space-xs rounded-full shadow-xl flex items-center gap-space-sm border border-secondary text-sm font-semibold animate-pulse">
          <span className="material-symbols-outlined text-[18px]">ads_click</span>
          <span>
            Click anywhere on the map to set{' '}
            <strong className="underline uppercase tracking-wide">
              {pickMode === 'origin' ? 'Origin' : 'Destination'}
            </strong>
          </span>
          <button
            type="button"
            onClick={onCancelPick}
            className="ml-2 px-2.5 py-0.5 rounded-full bg-white/20 hover:bg-white/30 text-xs font-bold transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Floating Map Control Bar (AQI Grid Toggle, Center on Routes) */}
      <div className="absolute bottom-4 left-4 z-20 flex flex-wrap items-center gap-2">
        {/* Toggle AQI Grid Overlay */}
        <button
          type="button"
          onClick={() => setShowAqiGrid((prev) => !prev)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-md shadow-md border transition-all ${
            showAqiGrid
              ? 'bg-secondary text-on-secondary border-secondary/60 shadow-secondary/20'
              : 'bg-surface/90 text-on-surface-variant hover:text-on-surface border-outline-variant/40'
          }`}
          title="Toggle AQI sensor grid overlay"
        >
          <span className="material-symbols-outlined text-[16px]">grid_view</span>
          <span>AQI Grid {showAqiGrid ? 'On' : 'Off'}</span>
        </button>

        {/* Recenter / Fit View */}
        {(routes.length > 0 || origin || destination) && (
          <button
            type="button"
            onClick={fitBoundsToContent}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-surface/90 text-on-surface-variant hover:text-on-surface border border-outline-variant/40 backdrop-blur-md shadow-md transition-all"
            title="Fit map view to all routes"
          >
            <span className="material-symbols-outlined text-[16px]">crop_free</span>
            <span>Fit view</span>
          </button>
        )}
      </div>

      {/* Legend Badge (AQI Levels) */}
      <div className="absolute bottom-4 right-4 z-20 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface/90 backdrop-blur-md border border-outline-variant/40 shadow-md font-data-badge text-data-badge text-on-surface">
        <span className="font-semibold text-on-surface-variant">AQI:</span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: LEVEL_COLORS.clean }} />
          Clean
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: LEVEL_COLORS.moderate }} />
          Moderate
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: LEVEL_COLORS.high }} />
          High
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: LEVEL_COLORS.poor }} />
          Poor
        </span>
      </div>
    </div>
  );
}
