# BreatheRoute: Pollution-Aware Route Awareness Platform (Track: Air)

## PROBLEM

Most navigation apps prioritize distance and travel time. For pedestrians, cyclists, children, elderly people, and people with respiratory sensitivities, exposure to polluted air is also an important consideration. Even short journeys through traffic-heavy areas can increase exposure to poor air quality.

## WHAT WE BUILT

BreatheRoute is an air-quality-aware route analysis platform that combines route information, AQI data, and traffic-related factors to help users make more informed travel decisions.

Users can explore routes between locations, view route alternatives, and access an AQI heatmap representing air quality across the demonstration area. The application uses a map-based interface to make environmental information easier to understand.

The current implementation includes a Delhi AQI grid containing 625 cells and a route-analysis workflow that evaluates available route information alongside AQI and traffic-related data.

## HOW IT WORKS

1. **Location and route input:** The user enters an origin and destination.
2. **Route retrieval:** The application requests route information through the backend.
3. **AQI retrieval:** The backend obtains AQI grid data stored in Amazon DynamoDB.
4. **Route analysis:** Route alternatives are evaluated using available route, AQI, and traffic-related factors.
5. **Map visualization:** The frontend displays route information and AQI data to help users compare environmental conditions.

The route-analysis approach is designed to balance travel time, air quality, and traffic conditions. The relative importance of these factors can be adjusted for different user needs.

## WHERE AWS FITS

- **Amazon API Gateway:** Exposes HTTP endpoints for the frontend to access backend functionality.
- **AWS Lambda:** Runs backend operations for route retrieval, AQI grid access, data seeding and refreshing, and route-related processing.
- **Amazon DynamoDB:** Stores the AQI grid data used by the application.
- **Amazon EventBridge:** Supports scheduled AQI refresh workflows.
- **Amazon Location Service:** Supports location and place search and route-related functionality.
- **AWS Systems Manager Parameter Store:** Stores the Gemini API key securely as a `SecureString`.
- **AWS IAM:** Controls permissions for AWS resources and services.

The frontend is built with React, Vite, and Tailwind CSS, with MapTiler used for map visualization. The project also includes a Node.js backend and Terraform configuration for infrastructure provisioning.

## DATA: BE HONEST

The current demonstration uses a seeded AQI grid covering a defined area of Delhi, with 625 cells stored in DynamoDB. The grid can be refreshed through the backend workflow.

**The AQI values have not been verified as live, street-level sensor measurements.** The application demonstrates how air-quality information can be stored, retrieved, visualized, and used in route analysis; it should not be presented as providing verified real-time pollution measurements.

Expanding the platform with reliable live AQI feeds, traffic data sources, and coverage for additional cities is an important next step.

## AI-ASSISTED ROUTE EXPLANATION

The project includes an AI-assisted route explanation workflow using the Google Gemini API. The aim is to turn route-analysis results into explanations that users can understand when comparing alternatives.

The application also includes fallback behavior so that route explanations can remain available when the AI service cannot be used. The Gemini integration is separate from AQI data retrieval: the AI explains route information but does not independently measure pollution.

## AI TOOLS AND LIBRARIES USED

- Antigravity — AI-assisted development
- React and Vite — frontend development
- Tailwind CSS — interface styling
- Node.js — backend development
- AWS SDK for JavaScript v3 — AWS service integration
- MapTiler — map visualization
- Terraform — infrastructure configuration
- Google Gemini API — AI-assisted route explanations

## TEAM CONTRIBUTIONS

- **Naveenkumar:** Frontend development
- **Puvitha:** Backend and route engine
- **Swetha:** AQI data layer
- **Ritheesh:** Setup, IAM, AI explanation workflow, integration, video, and submission

## FUTURE SCOPE

- Integrate reliable live AQI and traffic data sources.
- Expand AQI coverage beyond the current Delhi demonstration area.
- Improve route scoring with more accurate road-level environmental data.
- Strengthen health-profile-based route recommendations.
- Validate route recommendations against real-world measurements.

BreatheRoute demonstrates how AWS-based data storage, serverless backend services, mapping, and AI-assisted explanations can be combined to support more pollution-aware travel decisions.

**GitHub:** https://github.com/Universal-codeweb/BreatheRoute