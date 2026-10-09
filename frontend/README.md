# 🌿 BreatheRoute — Atmospheric Precision Clean Navigation

> **Breathe Better on Every Route.** An air-quality-aware navigation frontend that helps pedestrians and cyclists find the cleanest commute by analyzing real-time AQI sensor data, PM2.5 inhalation exposure, and environmental canopy coverage.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Pages & Screens](#pages--screens)
- [Component Architecture](#component-architecture)
- [Design System](#design-system)
- [Data Layer](#data-layer)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Build & Deployment](#build--deployment)

---

## Overview

BreatheRoute is a React-based single-page application that reimagines urban navigation by prioritizing **respiratory health**. Instead of simply finding the fastest route, BreatheRoute evaluates routes based on:

- **Air Quality Index (AQI)** from distributed IoT sensor nodes
- **PM2.5 particulate inhalation estimates** (µg inhaled per commute)
- **Green canopy coverage** along route segments
- **Traffic congestion and diesel idling zones**
- **Shade and shelter percentages**

The application targets the **Tiruchengode / KSRCT Campus** region in Tamil Nadu, India, with real sensor deployments providing live atmospheric telemetry.

---

## Key Features

| Feature | Description |
|---|---|
| 🏠 **Landing Overview** | Hero section with live route comparison demo, AQI trust stats, and interactive mode selector (Walk/Bike) |
| 🗺️ **Route Planning Wizard** | 4-step guided planner — origin/destination input, transport mode, health preferences, and AQI-weighted route preview |
| 📍 **Map Explorer** | Full-screen spatial canvas with overlay AQI heatmap, route polylines, sensor node markers, and live telemetry sidebar |
| 📊 **Route Comparison Matrix** | Side-by-side matrix of all route options with AQI scores, PM2.5 exposure bars, canopy coverage, traffic density, and health grades |
| 🧭 **Active Live Navigation** | Turn-by-turn guidance with real-time AQI corridor tracking, heart rate simulation, canopy percentage, and air quality warnings |

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| **UI Framework** | React | ^19.2.8 |
| **Build Tool** | Vite | ^8.3.0 |
| **Styling** | Tailwind CSS | ^3.4.x |
| **PostCSS** | PostCSS + Autoprefixer | ^8.5.x |
| **Fonts** | Google Fonts (Manrope, JetBrains Mono) | CDN |
| **Icons** | Material Symbols Outlined | CDN |
| **Linting** | OxLint | ^1.81.0 |
| **Language** | JavaScript (ES Modules) | ESM |

---

## Project Structure

```
frontend/
├── index.html                  # App entry point with font/icon CDN links
├── package.json                # Dependencies & scripts
├── vite.config.js              # Vite configuration
├── tailwind.config.js          # Design tokens (colors, fonts, spacing, radii)
├── postcss.config.js           # PostCSS pipeline (Tailwind + Autoprefixer)
├── public/                     # Static assets
├── src/
│   ├── main.jsx                # React DOM root mount
│   ├── App.jsx                 # Root component — tab router & cross-page state
│   ├── App.css                 # Minimal app-level overrides
│   ├── index.css               # Tailwind directives & global base styles
│   ├── assets/                 # Static imports (images, SVGs)
│   ├── components/
│   │   ├── Header.jsx          # Persistent top navbar with navigation tabs
│   │   └── Footer.jsx          # Site-wide footer with quick links & attribution
│   ├── data/
│   │   └── routeData.js        # Centralized mock data (routes, sensors, nav steps)
│   └── pages/
│       ├── LandingOverview.jsx          # Home / hero screen
│       ├── RoutePlanning.jsx            # 4-step route planner wizard
│       ├── MainRouteResultsMap.jsx      # Map explorer with route overlays
│       ├── RouteComparisonMatrix.jsx    # Side-by-side route comparison
│       └── ActiveLiveNavigation.jsx     # Turn-by-turn navigation mode
└── dist/                       # Production build output
```

---

## Pages & Screens

### 1. Landing Overview (`LandingOverview.jsx`)
The entry point of the application featuring:
- **Hero Section** — Bold headline with transport mode switcher (Walk / Bike), origin & destination quick-input, and primary CTA buttons
- **Live Route Comparison Demo** — Interactive before/after cards showing a "Cleanest Route" vs "Fastest Route" with real AQI numbers, PM2.5 inhalation bars, and exposure delta percentages
- **Trust Statistics** — Animated counters showing sensor network coverage (148 active nodes, 12 campus zones, 3,240+ clean commutes)
- **Why BreatheRoute Section** — Feature cards explaining AQI-aware routing, PM2.5 avoidance, and green canopy corridor selection
- **Spatial Canvas Preview** — Stylized map overview with AQI-colored sensor markers and route trail visualizations

### 2. Route Planning Wizard (`RoutePlanning.jsx`)
A guided 4-step wizard that collects user preferences:
- **Step 1: Origin & Destination** — Location input fields with GPS auto-detect, recent locations, and popular destination cards
- **Step 2: Transport Mode** — Walk, Bike, or E-Scooter mode selector with estimated route characteristics per mode
- **Step 3: Health & Preference Settings** — Sensitivity presets (Athlete, Standard, Respiratory-Sensitive), max acceptable AQI threshold slider, shade priority toggle
- **Step 4: Route Preview & Confirmation** — AQI-scored route options with a mini-map preview, estimated PM2.5 intake, and proceed-to-navigation CTA

### 3. Map Explorer (`MainRouteResultsMap.jsx`)
The primary spatial interface containing:
- **Full-Screen Map Canvas** — SVG-based map with color-coded route polylines (green=clean, red=polluted, blue=scenic)
- **AQI Heatmap Overlay** — Semi-transparent gradient layer showing air quality distribution across the region
- **Sensor Node Markers** — Interactive pins for each IoT sensor showing real-time AQI, PM2.5, and temperature readings
- **Route Cards Sidebar** — Scrollable list of route options with AQI badges, time estimates, and health scores
- **Live Telemetry Panel** — Bottom bar showing current wind speed, humidity, temperature, and sensor network status
- **Elevation Profile Graph** — CSS-based elevation chart correlating altitude changes with AQI exposure

### 4. Route Comparison Matrix (`RouteComparisonMatrix.jsx`)
A data-rich comparison view including:
- **Route Summary Cards** — Side-by-side display of Route A (Fastest), Route B (Cleanest), and Route C (Northern Bypass)
- **Metric Comparison Grid** — Tabular breakdown of AQI score, PM2.5 inhalation, distance, time, shade coverage, traffic density, and elevation gain
- **Health Grade Badges** — Letter-grade health ratings (A+ through D) based on composite exposure calculations
- **PM2.5 Exposure Bar Charts** — Visual bar comparison of particulate intake across routes
- **Feature Highlights** — Bullet-point advantages and warnings for each route option
- **Quick Action Buttons** — Direct "Navigate This Route" buttons per card

### 5. Active Live Navigation (`ActiveLiveNavigation.jsx`)
An immersive turn-by-turn navigation experience:
- **Direction Banner** — Large, clear instruction display (e.g., "Turn left onto Green Valley Park Avenue") with distance-to-next-turn
- **Live AQI Corridor Indicator** — Real-time AQI reading for the current road segment with color-coded status (Pristine / Good / Moderate / Poor)
- **Biometric Simulation Panel** — Heart rate, breathing rate, and estimated PM2.5 intake updated per navigation step
- **Canopy Coverage Gauge** — Live percentage of green canopy overhead
- **Air Quality Warning Alerts** — Pop-up warnings when approaching high-pollution zones with suggested detour options
- **Navigation Progress Bar** — Visual progress indicator showing remaining distance and estimated time
- **Map Canvas with Animated Marker** — Stylized map with a pulsing navigation dot and highlighted active route segment
- **End Session Controls** — Summary screen on arrival with total PM2.5 avoidance stats and health impact report

---

## Component Architecture

### App.jsx — Root Controller
The root component manages:
- **Tab-based routing** via `activeTab` state (`'landing'` | `'route-planner'` | `'map-explorer'` | `'route-comparison'` | `'active-navigation'`)
- **Cross-page state propagation** — origin/destination/mode passed from Landing → RoutePlanning → MapExplorer
- **Navigation handlers** — `handleStartPlanning()`, `handleExploreMap()`, `handleStartNavigation()`, `handleGoToComparison()`, `handleSelectRouteAndGo()`, `handleEndNavigationSession()`

### Header.jsx — Persistent Navigation Bar
- Responsive navbar with logo, navigation tabs, and live station status pill
- Highlights the active tab and supports mobile hamburger menu toggle
- Displays real-time AQI status indicator from the nearest sensor node

### Footer.jsx — Site Footer
- Quick navigation links, social media icons, and data attribution notices
- Displays sensor network status and last data refresh timestamp
- Responsive grid layout with multiple link sections

---

## Design System

The design system is codified in `tailwind.config.js` using Material Design 3-inspired token architecture:

### Color Palette
| Token | Hex | Purpose |
|---|---|---|
| `primary` | `#002617` | Deep green — primary brand, headings |
| `secondary` | `#186c42` | Active green — CTAs, success states, clean routes |
| `tertiary` | `#002339` | Deep blue — scenic routes, informational |
| `error` | `#ba1a1a` | Red — polluted routes, warnings, high AQI |
| `surface` | `#f8f9ff` | Near-white — page backgrounds |
| `on-surface` | `#0b1c30` | Dark blue-black — primary text |
| `surface-container` | `#e5eeff` | Light blue tint — card backgrounds |
| `secondary-container` | `#a4f4bf` | Light green — badges, highlights |
| `error-container` | `#ffdad6` | Light red — error badges, warning panels |

### Typography
| Token | Font | Size | Weight | Usage |
|---|---|---|---|---|
| `display-lg` | Manrope | 48px | 700 | Hero headlines |
| `headline-lg` | Manrope | 32px | 700 | Section titles |
| `headline-md` | Manrope | 24px | 600 | Card titles |
| `headline-sm` | Manrope | 20px | 600 | Subheadings |
| `body-lg` | Manrope | 18px | 400 | Feature descriptions |
| `body-md` | Manrope | 16px | 400 | Default body text |
| `body-sm` | Manrope | 14px | 400 | Captions, metadata |
| `label-lg` | Manrope | 14px | 600 | Buttons, tab labels |
| `label-md` | Manrope | 12px | 500 | Badges, small labels |
| `data-metric` | JetBrains Mono | 18px | 600 | AQI numbers, sensor readings |
| `data-badge` | JetBrains Mono | 11px | 500 | Data tags, status codes |

### Icons
Google Material Symbols Outlined, loaded via CDN with optical size 24px, weight 400, grade 0, fill 0.

---

## Data Layer

### `routeData.js` — Centralized Mock Data Module

All route, sensor, and navigation data is centralized in a single module for easy backend integration:

#### `SENSOR_NODES`
Array of IoT air quality sensor stations with:
- `id`, `name` — Station identifier and human-readable location
- `aqi` — Current Air Quality Index reading (0–500 scale)
- `pm25` — PM2.5 particulate concentration (µg/m³)
- `temp` — Ambient temperature (°C)
- `status` — Categorical status (`'Optimal'` | `'Good'` | `'Moderate'` | `'Unhealthy'`)

#### `MOCK_ROUTES`
Three pre-computed route options (`routeA`, `routeB`, `routeC`) each containing:
- **Identity** — `name`, `subtitle`, `badge`, `badgeType`
- **Metrics** — `time`, `distance`, `aqi`, `aqiCategory`, `score`
- **Health Data** — `exposureReduction`, `pmInhalation`, `shade`
- **Environment** — `traffic`, `trafficDesc`, `elevationGain`
- **Features** — Array of bullet-point advantages/warnings

#### `MOCK_NAVIGATION_STEPS`
Sequential navigation instructions with:
- `instruction` — Turn-by-turn text direction
- `aqi`, `aqiCategory` — Air quality at that segment
- `remainingDist`, `remainingTime` — Progress tracking
- `heartRate`, `canopy` — Biometric and environmental simulation
- `coords` — Map marker position and rotation angle

---

## Getting Started

### Prerequisites
- **Node.js** >= 18.x
- **npm** >= 9.x

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd BreathRoute_Frontend/frontend

# Install dependencies
npm install
```

### Development Server

```bash
npm run dev
```

The app will start at `http://localhost:5173` with hot module replacement (HMR) enabled.

---

## Available Scripts

| Script | Command | Description |
|---|---|---|
| **dev** | `npm run dev` | Start Vite dev server with HMR |
| **build** | `npm run build` | Create optimized production build in `dist/` |
| **preview** | `npm run preview` | Preview the production build locally |
| **lint** | `npm run lint` | Run OxLint for code quality checks |

---

## Build & Deployment

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

The production build generates optimized, minified assets in the `dist/` directory, ready for deployment to any static hosting service (Vercel, Netlify, Firebase Hosting, GitHub Pages, etc.).

### Environment Notes
- All fonts and icons are loaded via Google CDN — no local font files required
- No environment variables needed for the current mock-data configuration
- When connecting to a real backend, replace the mock data exports in `src/data/routeData.js` with API calls

---

## 🔮 Future Integration Points

| Integration | Status | Notes |
|---|---|---|
| Live AQI API | 🔜 Planned | Replace `SENSOR_NODES` with real-time API polling |
| Map Provider (Mapbox/Leaflet) | 🔜 Planned | Replace SVG canvas with interactive map tiles |
| Backend Routing Engine | 🔜 Planned | Compute routes server-side with AQI-weighted pathfinding |
| User Authentication | 🔜 Planned | Save route preferences and commute history |
| Push Notifications | 🔜 Planned | AQI alerts and route condition changes |

---

<p align="center">
  <strong>BreatheRoute</strong> — Because the air you breathe on your commute matters. 🌿
</p>
