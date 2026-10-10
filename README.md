# BreatheRoute

> **AWS Environmental Hacks — Air Track**  
> **Hackathon Dates:** October 8, 2026 – October 10, 2026  
> **AWS Region:** `us-east-1`

BreatheRoute finds the **healthiest walking and cycling routes**—not just the fastest—by dynamically scoring paths based on Air Quality Index (AQI), traffic congestion, and travel time. Route recommendations are weighted according to specific health profiles (**General**, **Asthma**, **Elderly**, and **Child**).

---

## 1. Problem

Standard navigation applications optimize strictly for speed or distance, frequently routing pedestrians and cyclists along busy arterial roads with heavy traffic and peak particulate pollution. For vulnerable individuals—such as children, seniors, and people with respiratory conditions like asthma—prolonged exposure to poor air quality during daily commutes poses serious, immediate, and long-term health risks.

## 2. Solution

BreatheRoute calculates and suggests clean-air alternatives by evaluating multiple route candidates with a multi-criteria scoring algorithm:
$$\text{Score} = (w_{\text{aqi}} \cdot \text{AQI}) + (w_{\text{traffic}} \cdot \text{Traffic}) + (w_{\text{time}} \cdot \text{Time})$$

- **Personalized Health Profiles**: Tailored weights prioritize lowest pollution exposure for vulnerable groups while balancing travel duration.
- **Microclimate & Traffic Layer**: Combines city-level monitoring with localized street-level dispersion models.
- **AI-Powered Route Insights**: Integrates Amazon Bedrock to provide human-readable explanations of why a route was chosen and actionable health guidance.

---

## 3. Architecture

The diagram below shows the optional AWS deployment design. The runnable local app uses OpenFreeMap for map tiles, Photon for place search, and Valhalla for walk/cycle routing, with no mapping API key required.

```text
                                  +-----------------------+
                                  |  Amazon EventBridge   |
                                  |   (Hourly Trigger)    |
                                  +-----------+-----------+
                                              |
                                              v
+-------------+      +--------------+      +-------------------+      +-------------------------+
|   Browser   | ---> | AWS Amplify  | ---> | Amazon API Gateway| ---> | AWS Lambda Functions    |
|  (User UI)  |      | (React App)  |      |    (REST API)     |      | - getRoutes             |
+-------------+      +--------------+      +-------------------+      | - getAqiGrid            |
                                                                      | - explainRoute          |
                                                                      | - setAqi / refreshAqi   |
                                                                      +------------+------------+
                                                                                   |
                                                              +--------------------+--------------------+
                                                              |                    |                    |
                                                              v                    v                    v
                                                     +-----------------+  +-----------------+  +-----------------+
                                                     | Amazon DynamoDB |  | Amazon Location |  | Amazon Bedrock  |
                                                     |  (AQI/Traffic)  |  | (Maps & Routing)|  |  (GenAI Insights)|
                                                     +-----------------+  +-----------------+  +-----------------+

                                     [ AWS IAM: Role & Policy Management ]
                                    [ Amazon CloudWatch: Logs & Monitoring ]
```

---

## 4. AWS Services Used

| Service | Purpose & Functionality |
| :--- | :--- |
| **AWS Amplify** | Hosts, builds, and delivers the React-based frontend web application. |
| **Amazon API Gateway** | Provides secure, managed REST API endpoints connecting frontend clients to backend Lambdas. |
| **AWS Lambda** | Serverless compute executing `getRoutes`, `getAqiGrid`, `explainRoute`, `setAqi`, and `refreshAqi`. |
| **Amazon DynamoDB** | Low-latency NoSQL database storing AQI grid tiles, traffic metrics, and cached path data. |
| **OpenFreeMap, Photon, Valhalla** | Keyless local map tiles, place search, and pedestrian/cyclist route calculation. |
| **Amazon Location Service** | Optional provider for an AWS-hosted deployment. |
| **Amazon Bedrock** | Generative AI foundation models generating route health insights and plain-language comparisons. |
| **Amazon EventBridge** | Automated cron scheduler triggering `refreshAqi` on an hourly cadence. |
| **Amazon CloudWatch** | Aggregates application logs, performance metrics, and operational alarms. |
| **AWS IAM** | Enforces least-privilege security policies and service roles across all AWS resources. |

---

## 5. Repository Structure

```text
BreatheRoute/
├── frontend/        # React application (Vite, interactive map, health profile selector)
├── route-engine/    # Route calculation, scoring engine, and Amazon Bedrock integration Lambda
├── aqi-traffic/     # AQI grid data ingestion and traffic simulation Lambdas
├── backend/         # Local Node.js API for routing, AQI estimates, and place search
└── docs/            # Project documentation, architecture diagrams, and submission assets
```

---

## 6. How to Run

### Start the backend

```bash
cd backend
copy env.example .env
npm run dev
```

This API uses Valhalla for walk/cycle routes and Photon for free place search. AQI/traffic values are clearly labeled deterministic estimates until a live data provider is connected.

### Start the frontend

1. In a second terminal, navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env.local`:
   ```env
   VITE_API_URL=http://localhost:3001/api
   VITE_MAP_STYLE_URL=https://tiles.openfreemap.org/styles/liberty
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

---

## 7. Data

- **City-Level AQI**: Real-time environmental monitoring station feeds.
- **Street-Level AQI & Traffic**: Modeled spatial interpolation accounting for traffic density, arterial corridors, and urban microclimates.

---

## 8. AI Tools Used

- **Antigravity (Google DeepMind)**: Assisted in rapid prototyping, full-stack architectural design, and codebase implementation.
- **Amazon Bedrock**: Generates conversational route explanations, health warnings, and personalized safety tips.

---

## 9. Team

| Name | Responsibilities |
| :--- | :--- |
| **Naveenkumar** | Frontend Development & UI/UX |
| **Puvitha** | Backend Services & Documentation |
| **Swetha** | Data Layer (AQI & Traffic pipelines) |
| **Ritheesh** | Route Engine, Setup, AI Integration, Video & Demo |
