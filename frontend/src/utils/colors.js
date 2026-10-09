// src/utils/colors.js
// ------------------------------------------------------------------
// Colour constants for each AQI pollution level.
// Use these when you need to colour-code a route segment on a map
// or paint an AQI badge in the UI.
// ------------------------------------------------------------------

export const LEVEL_COLORS = {
  clean:    '#2ECC71',   // green  – AQI roughly 0-50
  moderate: '#F1C40F',   // yellow – AQI roughly 51-100
  high:     '#E67E22',   // orange – AQI roughly 101-150
  poor:     '#E74C3C',   // red    – AQI roughly 151+
};
