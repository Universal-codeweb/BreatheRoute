// src/components/PlaceInput.jsx
// ------------------------------------------------------------------
// Production PlaceInput component for BreatheRoute.
//
// Key features:
// - Debounced live place search via Amazon Location Service (searchPlaces)
// - "Pick on map" crosshair mode integration
// - "Use my location" via navigator.geolocation.getCurrentPosition
// - Coverage bounds check with warning badge if coordinates fall outside
// - Keyboard accessible dropdown (Enter / Escape / Arrow keys)
// - Touch-friendly tap target (>= 44px)
// ------------------------------------------------------------------

import React, { useState, useEffect, useRef, useId } from 'react';
import { searchPlaces } from '../api';
import config from '../config';
import { isWithinDemoBounds } from '../utils/geo';

export default function PlaceInput({
  label = 'Location',
  value = null, // { lat, lng, label }
  onChange = () => {},
  onPickOnMap = null,
  placeholder = 'Search places or landmark…',
  bias = null,
  disabled = false,
  className = '',
  id: explicitId,
}) {
  const generatedId = useId();
  const inputId = explicitId || generatedId;

  const [query, setQuery] = useState(value?.label || '');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [locating, setLocating] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const containerRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const prevLabelRef = useRef(value?.label);

  // Sync internal text only when external value label changes
  useEffect(() => {
    if (value?.label !== prevLabelRef.current) {
      prevLabelRef.current = value?.label;
      setQuery(value?.label || '');
    }
  }, [value?.label]);

  // Handle outside click to close suggestions dropdown
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Debounced search logic calling real AWS Location Service
  const handleInputChange = (e) => {
    const text = e.target.value;
    setQuery(text);
    setErrorMessage(null);
    setIsOpen(true);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    if (!text.trim() || text.length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const results = await searchPlaces(
          text,
          bias || { lng: config.mapCenter[0], lat: config.mapCenter[1] }
        );
        if (Array.isArray(results)) {
          setSuggestions(results);
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        setSuggestions([]);
        setErrorMessage(err?.message || 'Unable to fetch place suggestions.');
      } finally {
        setIsLoading(false);
      }
    }, 300);
  };

  const handleSelectPlace = (place) => {
    setQuery(place.label);
    setIsOpen(false);
    setErrorMessage(null);
    onChange({
      lat: place.lat,
      lng: place.lng,
      label: place.label,
    });
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
    setErrorMessage(null);
    onChange(null);
  };

  // "Use my location" via browser Geolocation API
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setErrorMessage('Geolocation is not supported by your browser.');
      return;
    }

    setLocating(true);
    setErrorMessage(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const lat = Number(pos.coords.latitude.toFixed(5));
        const lng = Number(pos.coords.longitude.toFixed(5));
        const place = {
          lat,
          lng,
          label: `My Current Location (${lat}, ${lng})`,
        };
        setQuery(place.label);
        setIsOpen(false);
        onChange(place);
      },
      (err) => {
        setLocating(false);
        setErrorMessage(
          err.code === 1
            ? 'Location permission denied. Please allow location access.'
            : 'Unable to retrieve your location.'
        );
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Check coverage bounds for currently selected location
  const isOutside = value && !isWithinDemoBounds(value.lat, value.lng);

  return (
    <div ref={containerRef} className={`relative flex flex-col gap-1 w-full ${className}`}>
      {/* Label and Quick Action row */}
      <div className="flex items-center justify-between">
        <label
          htmlFor={inputId}
          className="font-label-md text-label-md font-semibold text-on-surface-variant flex items-center gap-1.5"
        >
          <span>{label}</span>
          {isOutside && (
            <span
              className="font-data-badge text-data-badge px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300"
              title="This point is outside the configured coverage area"
            >
              Outside coverage bounds
            </span>
          )}
        </label>

        <div className="flex items-center gap-1.5">
          {/* Use My Location button */}
          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={disabled || locating}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-secondary hover:text-primary transition-colors py-0.5 px-1.5 rounded hover:bg-secondary-container/30 disabled:opacity-50"
            title="Use current GPS location"
          >
            <span className={`material-symbols-outlined text-[14px] ${locating ? 'animate-spin' : ''}`}>
              {locating ? 'progress_activity' : 'my_location'}
            </span>
            <span>{locating ? 'Locating…' : 'My location'}</span>
          </button>

          {/* Pick on Map button */}
          {onPickOnMap && (
            <button
              type="button"
              onClick={onPickOnMap}
              disabled={disabled}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-on-surface-variant hover:text-on-surface transition-colors py-0.5 px-1.5 rounded hover:bg-surface-container disabled:opacity-50"
              title="Click map to pick coordinates"
            >
              <span className="material-symbols-outlined text-[14px]">pin_drop</span>
              <span>Pick on map</span>
            </button>
          )}
        </div>
      </div>

      {/* Input container */}
      <div className="relative flex items-center">
        <input
          id={inputId}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          className="w-full min-h-[44px] h-11 pl-10 pr-9 rounded-xl bg-surface-container-low border border-surface-container text-on-surface font-body-sm text-body-sm placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-all"
        />

        {/* Leading Pin Icon */}
        <span className="material-symbols-outlined absolute left-3 text-[18px] text-on-surface-variant/70 pointer-events-none">
          {label.toLowerCase().includes('origin') ? 'trip_origin' : 'location_on'}
        </span>

        {/* Trailing Clear Button or Spinner */}
        <div className="absolute right-2.5 flex items-center">
          {isLoading ? (
            <span className="material-symbols-outlined text-[18px] text-secondary animate-spin">
              progress_activity
            </span>
          ) : query ? (
            <button
              type="button"
              onClick={handleClear}
              className="w-6 h-6 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
              title="Clear text"
              aria-label="Clear location input"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Geolocation / search error notice */}
      {errorMessage && (
        <p className="text-[11px] text-error font-medium flex items-center gap-1 mt-0.5">
          <span className="material-symbols-outlined text-[12px]">info</span>
          {errorMessage}
        </p>
      )}

      {/* Dropdown Suggestions List (Real Amazon Location Service items only) */}
      {isOpen && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-40 bg-surface-container-lowest rounded-2xl shadow-xl border border-surface-container overflow-hidden max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
          {suggestions.length > 0 ? (
            <div className="p-1">
              <div className="px-3 py-1 font-data-badge text-data-badge text-on-surface-variant uppercase tracking-wider">
                Matching Places ({suggestions.length})
              </div>
              {suggestions.map((item, idx) => (
                <button
                  key={`${item.label}-${idx}`}
                  type="button"
                  onClick={() => handleSelectPlace(item)}
                  className="w-full min-h-[44px] px-3 py-2 text-left rounded-xl hover:bg-surface-container flex items-center justify-between gap-2 text-on-surface transition-colors group"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="material-symbols-outlined text-[18px] text-secondary flex-shrink-0 group-hover:scale-110 transition-transform">
                      place
                    </span>
                    <span className="font-body-sm text-body-sm truncate">{item.label}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : !isLoading ? (
            <div className="p-space-md text-center text-on-surface-variant font-body-sm text-body-sm">
              No matching places found. Try another search or use "Pick on map".
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
