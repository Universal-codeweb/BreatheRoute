BreatheRoute: pollution-aware walking and cycling routes (Track: Air)

PROBLEM
Map apps find the fastest route. For walkers, cyclists, children, elderly people and people
with breathing problems, the cleanest route matters more. Short trips through heavy traffic
mean high exposure to polluted air.

WHAT WE BUILT
Search a destination, choose Walking or Cycling and a health profile (General, Asthma,
Elderly, Child). The app gets 2-3 routes, reads the air quality (AQI) and traffic along each
one, scores them, and shows the recommended route on the map coloured green to red. An AQI
heatmap layer shows the air quality of the area.

HOW IT WORKS
Route score combines time, AQI and traffic, with weights that change per health profile
(an asthma profile cares most about air quality). The best-scoring route is recommended.

WHERE AWS FITS
AWS Amplify (website hosting), Amazon Location Service (map, place search, routes),
Amazon API Gateway + AWS Lambda (backend and scoring), Amazon DynamoDB (AQI grid),
Amazon EventBridge (hourly data refresh), Amazon Bedrock (route explanation, with a template
fallback), Amazon CloudWatch (logs), AWS IAM (permissions).

DATA: BE HONEST
Street-level AQI and traffic are modelled from road type and traffic and stored in DynamoDB
for our demo area. We did not use real street-level sensors. Next step: real city and
street-level air quality feeds and more cities.

ROUTE EXPLANATION (AI)
The explain endpoint is built on Amazon Bedrock (Converse API). During the hackathon, Bedrock
model access on our new AWS account was still being enabled (support case open), so the
Lambda returns a template explanation built from the same numbers and the app never breaks.

AI TOOLS AND LIBRARIES USED
Antigravity (AI coding assistant), <teammates' tools: Cursor / Kiro / ...>,
React, Vite, MapLibre GL JS, AWS SDK for JavaScript v3.

TEAM
Naveenkumar (frontend), Puvitha (backend and route engine), Swetha (data layer),
Ritheesh (setup, IAM, explain Lambda, integration, video, submission).