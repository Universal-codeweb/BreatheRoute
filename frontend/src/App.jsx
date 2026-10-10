// src/App.jsx
// ------------------------------------------------------------------
// Main BreatheRoute Application Component.
//
// Manages global state:
// - origin & destination ({lat, lng, label} objects or null)
// - travel mode ("walking" | "cycling")
// - health profile ("general" | "asthma" | "elderly" | "child")
// - routes (converted UI routes from the real API)
// - selectedRouteId, loading, error
// ------------------------------------------------------------------

import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import LandingOverview from './pages/LandingOverview';
import RoutePlanning from './pages/RoutePlanning';
import MainRouteResultsMap from './pages/MainRouteResultsMap';
import RouteComparisonMatrix from './pages/RouteComparisonMatrix';
import ActiveLiveNavigation from './pages/ActiveLiveNavigation';
import { getRoutes } from './api';
import { convertAllRoutes } from './adapters';
import config from './config';

export default function App() {
  // ---- navigation tab ----
  const [activeTab, setActiveTab] = useState('landing');

  // ---- route search inputs ----
  const [origin, setOrigin]           = useState(null); // { lat, lng, label }
  const [destination, setDestination] = useState(null); // { lat, lng, label }
  const [mode, setMode]               = useState('walking');
  const [profile, setProfile]         = useState('general');

  // ---- route results from the API ----
  const [routes, setRoutes]                   = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState(null);

  // Track whether user has searched at least once (for auto re-search)
  const hasSearched = useRef(false);

  // ---------------------------------------------------------------
  // findRoutes – call the real API, convert, navigate to map
  // ---------------------------------------------------------------
  async function findRoutes() {
    if (!origin || !destination) {
      setError('Please select both an origin and a destination.');
      return;
    }
    if (origin.lat === destination.lat && origin.lng === destination.lng) {
      setError('Origin and destination cannot be the same location.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const apiResponse = await getRoutes(
        { lat: origin.lat, lng: origin.lng },
        { lat: destination.lat, lng: destination.lng },
        mode,
        profile
      );

      const { routes: uiRoutes, recommendedId } = convertAllRoutes(apiResponse);
      setRoutes(uiRoutes);
      setSelectedRouteId(recommendedId);
      hasSearched.current = true;

      // Navigate to the map explorer page
      setActiveTab('map-explorer');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message || 'Something went wrong while finding routes.');
    } finally {
      setLoading(false);
    }
  }

  // ---------------------------------------------------------------
  // Auto re-search when mode or profile changes (after first search)
  // ---------------------------------------------------------------
  useEffect(() => {
    if (!hasSearched.current) return;
    if (!origin || !destination) return;

    async function reSearch() {
      setLoading(true);
      setError(null);
      try {
        const apiResponse = await getRoutes(
          { lat: origin.lat, lng: origin.lng },
          { lat: destination.lat, lng: destination.lng },
          mode,
          profile
        );
        const { routes: uiRoutes, recommendedId } = convertAllRoutes(apiResponse);
        setRoutes(uiRoutes);
        setSelectedRouteId(recommendedId);
      } catch (err) {
        setError(err.message || 'Failed to refresh routes.');
      } finally {
        setLoading(false);
      }
    }

    reSearch();
    // eslint-disable-next-line
  }, [mode, profile]);

  // ---------------------------------------------------------------
  // Cross-page navigation helpers
  // ---------------------------------------------------------------
  const handleStartPlanning = ({ origin: o, destination: d, mode: m }) => {
    if (o) setOrigin(o);
    if (d) setDestination(d);
    if (m) setMode(m === 'walk' ? 'walking' : m === 'bike' ? 'cycling' : m);
    setActiveTab('route-planner');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExploreMap = () => {
    if (routes.length > 0) {
      setActiveTab('map-explorer');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      findRoutes();
    }
  };

  const handleStartNavigation = (routeId) => {
    if (routeId) {
      const found = routes.find((r) => r.id === routeId);
      if (found) setSelectedRouteId(routeId);
    }
    setActiveTab('active-navigation');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoToComparison = () => {
    setActiveTab('route-comparison');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectRouteAndGo = (routeId) => {
    setSelectedRouteId(routeId);
    setActiveTab('active-navigation');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEndNavigationSession = () => {
    setActiveTab('map-explorer');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ---------------------------------------------------------------
  // Setup-needed notice if env vars are missing
  // ---------------------------------------------------------------
  if (!config.isConfigured) {
    return (
      <div className="min-h-screen bg-surface flex flex-col font-body-md text-on-surface antialiased selection:bg-secondary-container selection:text-on-secondary-container">
        <Header activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="flex-1 flex items-center justify-center p-space-xl">
          <div className="max-w-lg bg-surface-container-lowest rounded-2xl p-space-xl shadow-lg border border-outline-variant/40 text-center">
            <span className="material-symbols-outlined text-[48px] text-error mb-space-md block">
              settings
            </span>
            <h1 className="font-headline-lg text-headline-lg text-on-surface mb-space-sm">
              Setup needed
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mb-space-lg">
              BreatheRoute needs a MapTiler key and a running backend. Create a{' '}
              <code className="font-data-badge bg-surface-container px-1 py-0.5 rounded">.env</code>{' '}
              file based on{' '}
              <code className="font-data-badge bg-surface-container px-1 py-0.5 rounded">.env.example</code>{' '}
              and set the required values.
            </p>
            <div className="text-left bg-surface-container-low rounded-xl p-space-md font-data-badge text-data-badge text-on-surface-variant space-y-1">
              <p className={config.apiUrl ? 'text-secondary' : 'text-error font-bold'}>
                {config.apiUrl ? '✓' : '✗'} VITE_API_URL
              </p>
              <p className={config.maptilerApiKey ? 'text-secondary' : 'text-error font-bold'}>
                {config.maptilerApiKey ? '✓' : '✗'} VITE_MAPTILER_API_KEY
              </p>
            </div>
          </div>
        </div>
        <Footer setActiveTab={setActiveTab} />
      </div>
    );
  }

  // The selected route object (for navigation page)
  const selectedRoute = routes.find((r) => r.id === selectedRouteId) || null;

  return (
    <div className="min-h-screen bg-surface flex flex-col font-body-md text-on-surface antialiased selection:bg-secondary-container selection:text-on-secondary-container">
      {/* Persistent App Header */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main View Router with Craft-style 200ms fade + 8px slide-up transition */}
      <main className="flex-1 w-full flex flex-col">
        <div key={activeTab} className="page-transition flex-1 w-full flex flex-col">
          {activeTab === 'landing' && (
            <LandingOverview
              origin={origin}
              setOrigin={setOrigin}
              destination={destination}
              setDestination={setDestination}
              mode={mode}
              setMode={setMode}
              onStartPlanning={handleStartPlanning}
              onExploreMap={handleExploreMap}
              onFindRoutes={findRoutes}
              routes={routes}
              loading={loading}
              error={error}
            />
          )}

          {activeTab === 'route-planner' && (
            <RoutePlanning
              origin={origin}
              setOrigin={setOrigin}
              destination={destination}
              setDestination={setDestination}
              mode={mode}
              setMode={setMode}
              profile={profile}
              setProfile={setProfile}
              loading={loading}
              error={error}
              routes={routes}
              onFindRoutes={findRoutes}
              onProceedToMap={handleExploreMap}
              onProceedToComparison={handleGoToComparison}
              onStartNavigation={handleStartNavigation}
            />
          )}

          {activeTab === 'map-explorer' && (
            <MainRouteResultsMap
              routes={routes}
              selectedRouteId={selectedRouteId}
              setSelectedRouteId={setSelectedRouteId}
              origin={origin}
              setOrigin={setOrigin}
              destination={destination}
              setDestination={setDestination}
              loading={loading}
              error={error}
              onFindRoutes={findRoutes}
              onSelectRoute={handleSelectRouteAndGo}
              onStartNavigation={handleStartNavigation}
              onGoToComparison={handleGoToComparison}
            />
          )}

          {activeTab === 'route-comparison' && (
            <RouteComparisonMatrix
              routes={routes}
              selectedRouteId={selectedRouteId}
              setSelectedRouteId={setSelectedRouteId}
              origin={origin}
              destination={destination}
              profile={profile}
              loading={loading}
              error={error}
              onBackToMap={handleExploreMap}
              onSelectRoute={handleSelectRouteAndGo}
            />
          )}

          {activeTab === 'active-navigation' && (
            <ActiveLiveNavigation
              route={selectedRoute}
              routes={routes}
              origin={origin}
              destination={destination}
              onEndSession={handleEndNavigationSession}
            />
          )}
        </div>
      </main>

      {/* Footer on non-immersive screens */}
      {activeTab !== 'active-navigation' && (
        <Footer setActiveTab={setActiveTab} />
      )}
    </div>
  );
}
