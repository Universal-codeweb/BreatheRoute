# BreatheRoute API

This local Node.js service replaces the missing API Gateway/Lambda HTTP layer for development. It exposes the route and AQI endpoints the frontend uses, plus free Photon-backed place search.

## Requirements

- Node.js 22.12 or newer

## Run

1. Copy `env.example` to `.env` if you need to change the default settings.
2. Start the API:

   ```sh
   npm run dev
   ```

The API listens at `http://localhost:3001/api`. Its endpoints are `GET /health`, `GET /aqi`, `GET /places?q=...`, and `POST /routes`.

Walking and cycling alternatives come from the configurable Valhalla endpoint. Place search uses the public Photon service. AQI and traffic values are deterministic demo estimates, not live sensor measurements; the response includes `aqiIsLive: false` and `trafficIsLive: false`. Configure `ROUTING_API_URL`, `MAP_CENTER`, `DEMO_BOUNDS`, and `CORS_ORIGIN` in `.env` as needed. The public map, search, and routing endpoints have fair-use limits and no uptime guarantee.