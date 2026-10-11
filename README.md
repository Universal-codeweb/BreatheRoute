# BreatheRoute

> **Atmospheric Precision Clean Navigation**  
> **AWS Environmental Hacks — Air Track**  
> **AWS Region:** `us-east-1`  
> **Live Demo:** [http://100.55.15.141](http://100.55.15.141)

BreatheRoute finds the **healthiest walking and cycling routes**—not just the fastest—by dynamically scoring paths based on Air Quality Index (AQI), traffic congestion, and travel time. Route recommendations are weighted according to specific health profiles (**General**, **Asthma**, **Elderly**, and **Child**), paired with real-time vector cartography and Google Gemini generative AI health recommendations.

---

## 1. Problem

Standard navigation applications optimize strictly for speed or distance, frequently routing pedestrians and cyclists along busy arterial roads with heavy traffic and peak particulate pollution. For vulnerable individuals—such as children, seniors, and people with respiratory conditions like asthma—prolonged exposure to poor air quality during daily commutes poses serious, immediate, and long-term health risks.

## 2. Solution

BreatheRoute calculates and suggests clean-air alternatives by evaluating multiple route candidates with a multi-criteria scoring algorithm:
$$\text{Score} = (w_{\text{aqi}} \cdot \text{AQI}) + (w_{\text{traffic}} \cdot \text{Traffic}) + (w_{\text{time}} \cdot \text{Time})$$

- **Personalized Health Profiles**: Tailored weights prioritize lowest pollution exposure for vulnerable groups while balancing travel duration.
- **Dynamic Delhi AQI Grid Integration**: Connects to the AWS DynamoDB Delhi grid (`breatheroute-aqi`) covering 625 geographic cells, truthfully tagged as cached monitored data.
- **Aegis Route AI Engine**: Leverages Google Gemini (`gemini-3.5-flash` / `gemini-3.5-flash-lite`) to generate authoritative, physician-grade health warnings, route comparisons, and respiratory guidance based on real-time exposure.
- **Interactive MapLibre GL Vector Engine**: GPU-accelerated client-side rendering with OpenFreeMap Liberty style, interactive AQI heatmap mesh, and turn-by-turn routing telemetry.

---

## 3. Architecture

BreatheRoute deploys a production-grade full-stack architecture on AWS EC2 orchestrated via Terraform, seamlessly integrated with existing serverless AWS infrastructure.

```text
                                  +-----------------------+
                                  |  Amazon EventBridge   |
                                  |   (Hourly Refresh)    |
                                  +-----------+-----------+
                                              |
                                              v
+------------------+             +--------------------------+             +----------------------+
|     Browser      |  HTTP :80   |     AWS EC2 Instance     |  DynamoDB   | Amazon DynamoDB      |
|    (React SPA)   | ----------> |  - Nginx Reverse Proxy   | <---------> |   (breatheroute-aqi) |
+------------------+             |  - Node.js (systemd)     |    Sync     |   625 Delhi Cells    |
                                 +-------------+------------+             +----------------------+
                                               |
                                               v
                                 +--------------------------+             +----------------------+
                                 |  AWS Systems Manager     |             |    Google Gemini     |
                                 |  (SSM Parameter Store)   |             |   Generative AI      |
                                 |  /breatheroute/gemini_*  |             | (gemini-3.5-flash)   |
                                 +--------------------------+             +----------------------+
```

### Infrastructure Workflow
1. **Frontend & Ingress**: Nginx serves the production React + Vite SPA, enforces `.mjs` JavaScript module worker MIME handling for MapLibre GL, and proxies `/api` endpoints directly to the local backend.
2. **Backend Engine**: A persistent Node.js service (`server.mjs`) managed by systemd on port 3001 delivers Valhalla routing, spatial AQI interpolation, and AI analysis.
3. **Delhi AQI Spatial Telemetry**: Reads from the existing API Gateway and DynamoDB table `breatheroute-aqi` (625 monitored cells).
4. **Zero-Secret Key Retrieval**: Gemini credentials are stored as `SecureString` in AWS Systems Manager Parameter Store and retrieved at runtime via IAM instance profile without hardcoding secrets in Git, logs, or Terraform state.

---

## 4. AWS Services Used

| Service | Purpose & Functionality |
| :--- | :--- |
| **Amazon EC2 (`t3.micro`)** | Cost-effective compute hosting the Nginx reverse proxy and Node.js backend service. |
| **AWS Systems Manager (SSM)** | Parameter Store securely isolates the Gemini API key as a `SecureString` with least-privilege IAM access. |
| **AWS IAM** | Role and instance profile policies (`breatheroute_app_policy`) granting EC2 read-only access to SSM parameters and DynamoDB. |
| **Amazon DynamoDB** | Stores the 625-cell Delhi air quality spatial grid in `breatheroute-aqi`. |
| **Amazon API Gateway** | Managed HTTP API (`cyprd9viih`) providing serverless read access to the AQI grid. |
| **Amazon EventBridge** | Automated cron scheduler triggering hourly AQI synchronization. |
| **Terraform (IaC)** | Declarative infrastructure as code provisioning VPC security groups, IAM roles, and EC2 instances. |
| **OpenFreeMap, Photon, Valhalla** | High-performance vector tiles, open geocoding, and multimodal routing engine. |

---

## 5. Repository Structure

```text
BreatheRoute/
├── frontend/            # React + Vite application (MapLibre GL, health profiles, turn-by-turn UI)
├── backend/             # Node.js API server (routing, AQI spatial cache, Aegis Gemini AI engine)
├── terraform/           # Terraform configuration (EC2, IAM, Security Groups, User Data provisioning)
├── route-engine/        # Route calculation & scoring engine Lambda functions
├── aqi-traffic/         # AQI grid data ingestion and traffic simulation Lambdas
└── docs/                # Architecture diagrams, design documentation, and submission assets
```

---

## 6. How to Run Locally

### Start the Backend

1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   npm install
   ```

2. Configure environment variables (optional, fallback AI engine works out-of-the-box):
   ```bash
   cp env.example .env
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

### Start the Frontend

1. In a second terminal, navigate to `frontend/`:
   ```bash
   cd frontend
   npm install
   ```

2. Create `.env.local`:
   ```env
   VITE_API_URL=http://localhost:3001/api
   VITE_MAP_STYLE_URL=https://tiles.openfreemap.org/styles/liberty
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

---

## 7. AWS Deployment (Terraform)

Deploying BreatheRoute to AWS requires authenticated AWS CLI credentials in `us-east-1`:

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

The Terraform plan provisions:
- Security Group allowing HTTP (`80`) and HTTPS (`443`) traffic.
- IAM Instance Profile with least-privilege access for SSM Parameter Store and DynamoDB reading.
- EC2 `t3.micro` instance running Ubuntu 24.04 with automated cloud-init provisioning (Node.js 22 LTS, Nginx, Git, swap space).

---

## 8. AI Tools Used

- **Antigravity (Google DeepMind)**: Full-stack agentic pair programming, cloud infrastructure automation, and automated validation.
- **Google Gemini API (`gemini-3.5-flash` / `gemini-3.5-flash-lite`)**: Generates real-time conversational route evaluations, respiratory health advisories, and comparative risk matrices.

---

## 9. Team

| Name | Responsibilities |
| :--- | :--- |
| **Naveenkumar** | Frontend Development & UI/UX |
| **Puvitha** | Backend Services & Documentation |
| **Swetha** | Data Layer (AQI & Traffic pipelines) |
| **Ritheesh** | Route Engine, Setup, AI Integration, Video & Demo |
