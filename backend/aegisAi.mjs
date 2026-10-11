// backend/aegisAi.mjs
// ------------------------------------------------------------------
// Aegis Route AI Engine
// Powered by Google Gemini API (or local intelligent fallback)
// ------------------------------------------------------------------

export const AEGIS_SYSTEM_PROMPT = `You are "Aegis Route," an elite, health-centric navigation assistant. Your goal is to analyze multiple potential travel routes between two locations and recommend the healthiest path based on real-time Air Quality Index (AQI) data, pollutant metrics (PM2.5, PM10, O3), and user health profiles.

You will be provided with:
1. Origin and Destination names.
2. A list of available Route Alternatives (e.g., Route 1, Route 2).
3. Technical JSON data containing waypoint coordinates (lat/long), travel duration, and the live AQI values at various checkpoints along those routes.
4. Optional user health parameters (e.g., "asthmatic", "traveling with an infant", "cyclist").

Your task is to mathematically evaluate the overall pollution exposure of each route against its travel time, pick the optimal "Healthy Route," and present the analysis to the user.

CRITICAL INSTRUCTIONS FOR ANALYSIS:
- Look for AQI spikes: A route that is 5 minutes faster but passes through a hazardous "red zone" (AQI > 150) should be rejected in favor of a cleaner, slightly longer route.
- Weighted Exposure: Consider the duration of exposure. Spending 30 minutes in moderate air (AQI 75) might be better than spending 15 minutes in hazardous air (AQI 200).
- Tailor to the User: If the user is a cyclist or runner, prioritize ultra-low AQI. If they are in a sealed electric car with HEPA filters, travel time can carry slightly more weight.

RESPONSE STRUCTURE REQUIREMENTS:
1. DIRECT RECOMMENDATION: State clearly in bold which route is the healthiest and why in the very first sentence.
2. COMPARATIVE BREAKDOWN: Provide a clean, easy-to-read markdown table comparing the routes. Include Route Name, Travel Time, Average AQI, Peak AQI, and a Risk Assessment.
3. HEALTH & TRANSIT ADVICE: Provide bulleted, actionable safety tips tailored to the chosen route and the user's specific health context (e.g., mask recommendations, windows up/down).
4. JSON PAYLOAD: At the very end of your response, wrapped inside a \`\`\`json \`\`\` block, return a structured object with keys: "recommended_route_id", "aqi_safety_score" (1-100), and "health_warnings" (array of strings). This is strictly for the app frontend to render UI colors.

Maintain an empathetic, direct, and authoritative tone. Avoid technical jargon when explaining health risks; use universal, clear language.`;

/**
 * Call Google Gemini API with the Aegis Route prompt.
 */
export async function analyzeRoutesWithAi({ origin, destination, mode, profile, routes }) {
  const apiKey = process.env.GEMINI_API_KEY;

  const routesSummary = routes.map((r, i) => ({
    id: r.id,
    label: r.label || `Route ${i + 1}`,
    durationMinutes: r.durationMin,
    distanceKm: r.distanceKm,
    averageAqi: r.avgAqi,
    peakAqi: Math.round(r.avgAqi * 1.25), // estimated peak on route
    traffic: r.traffic,
  }));

  const userContextPrompt = `
Analyze the following travel routes and recommend the healthiest option:

Origin: ${origin?.label || `Coordinates (${origin?.lat}, ${origin?.lng})`}
Destination: ${destination?.label || `Coordinates (${destination?.lat}, ${destination?.lng})`}
Travel Mode: ${mode}
User Health Profile: ${profile || 'general'}

Available Route Alternatives:
${JSON.stringify(routesSummary, null, 2)}
`;

  // If Gemini API Key is provided, call Google Gemini API
  if (apiKey && apiKey.trim() !== '') {
    try {
      console.log('Consulting live Google Gemini AI with Aegis Route prompt...');
      const model = (process.env.GEMINI_MODEL || 'gemini-2.5-flash').trim();
      let url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;

      let response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { text: `${AEGIS_SYSTEM_PROMPT}\n\n${userContextPrompt}` }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1200,
          }
        }),
        signal: AbortSignal.timeout(15000),
      });

      // Fallback model if the specified model is not found
      if (response.status === 404 && model !== 'gemini-flash-latest') {
        const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey.trim()}`;
        response = await fetch(fallbackUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: `${AEGIS_SYSTEM_PROMPT}\n\n${userContextPrompt}` }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 1200 }
          }),
          signal: AbortSignal.timeout(15000),
        });
      }

      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          console.log('Live Gemini AI route analysis completed successfully!');
          return parseAegisAiResponse(text, routes);
        }
      } else {
        const errText = await response.text();
        console.error('Gemini API request failed:', response.status, errText);
      }
    } catch (err) {
      console.error('Error invoking Gemini AI:', err.message);
    }
  }

  // Graceful rule-based engine when API key is not yet set
  return generateDeterministicAegisReport({ origin, destination, mode, profile, routes });
}

/**
 * Extracts Markdown advice and the trailing JSON payload from the AI response.
 */
function parseAegisAiResponse(aiText, routes) {
  let structuredPayload = null;
  const jsonMatch = aiText.match(/```json\s*([\s\S]*?)\s*```/);

  if (jsonMatch) {
    try {
      structuredPayload = JSON.parse(jsonMatch[1]);
    } catch (e) {
      console.warn('Could not parse JSON payload from AI output:', e.message);
    }
  }

  const bestRoute = routes.find((r) => r.id === structuredPayload?.recommended_route_id) || routes[0];

  return {
    rawReport: aiText,
    recommendedRouteId: structuredPayload?.recommended_route_id || bestRoute.id,
    aqiSafetyScore: structuredPayload?.aqi_safety_score ?? Math.round(100 - bestRoute.avgAqi / 2),
    healthWarnings: structuredPayload?.health_warnings || [
      'Elevated particulate matter detected in urban segments.',
    ],
    source: 'gemini-ai',
    aiProvider: 'Google Gemini',
    isLiveGemini: true,
  };
}

/**
 * Deterministic fallback matching the exact required response structure.
 */
function generateDeterministicAegisReport({ origin, destination, mode, profile, routes }) {
  const sortedByHealth = [...routes].sort((a, b) => a.avgAqi - b.avgAqi);
  const best = sortedByHealth[0];
  const peakAqi = Math.round(best.avgAqi * 1.25);
  const safetyScore = Math.max(10, Math.min(100, Math.round(100 - best.avgAqi / 2)));

  const reportText = `**${best.label} is recommended as the healthiest path because it minimizes particulate inhalation by avoiding primary congested arteries and high-pollution zones.**

### Comparative Breakdown
| Route Name | Travel Time | Average AQI | Peak AQI | Risk Assessment |
| :--- | :--- | :--- | :--- | :--- |
${routes.map(r => `| **${r.label}** | ${r.durationMin} mins | ${Math.round(r.avgAqi)} AQI | ${Math.round(r.avgAqi * 1.3)} AQI | ${r.avgAqi <= 50 ? 'Low Risk' : r.avgAqi <= 100 ? 'Moderate' : 'Unhealthy'} |`).join('\n')}

### Health & Transit Advice
- **Health Focus (${profile})**: ${profile === 'asthma' ? 'Carry a fast-acting rescue inhaler. Keep exertion light to prevent deep lung ventilation.' : 'Plan travel during off-peak traffic hours to reduce direct exhaust exposure.'}
- **Travel Protection (${mode})**: ${mode === 'cycling' ? 'Wear an N95 particulate respirator mask to filter out PM2.5 particles.' : 'Stay on tree-lined pedestrian sidewalks away from vehicle tailpipes.'}
- **Route Monitoring**: Avoid stationary traffic intersections where localized nitrogen dioxide (NO2) concentrations spike.

\`\`\`json
{
  "recommended_route_id": "${best.id}",
  "aqi_safety_score": ${safetyScore},
  "health_warnings": [
    "Localized AQI elevation near major vehicular junctions",
    ${profile === 'asthma' ? '"High sensitivity advisory: keep exertion low"' : '"Standard urban particulate advisory"'}
  ]
}
\`\`\``;

  return {
    rawReport: reportText,
    recommendedRouteId: best.id,
    aqiSafetyScore: safetyScore,
    healthWarnings: [
      'Localized AQI elevation near major vehicular junctions',
      profile === 'asthma' ? 'High sensitivity advisory: keep exertion low' : 'Standard urban particulate advisory',
    ],
    source: 'rule-engine-fallback',
    aiProvider: 'Deterministic Rule Engine (Fallback)',
    isLiveGemini: false,
  };
}
