// breatheroute-explainRoute: POST /explain
// Body: { routes: [fastestRoute, cleanRoute], profile }
import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({});

const HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type,authorization",
  "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
};

const reply = (statusCode, body) => ({
  statusCode,
  headers: HEADERS,
  body: JSON.stringify(body),
});

// Template sentence used when Bedrock fails, so the app never breaks
function fallbackText(fastest, clean, profile) {
  const extraMin = Math.max(0, clean.durationMin - fastest.durationMin);
  const drop = fastest.avgAqi > 0
    ? Math.round(((fastest.avgAqi - clean.avgAqi) / fastest.avgAqi) * 100)
    : 0;
  return `This route takes ${extraMin} min longer but has ${drop}% lower AQI ` +
         `(${clean.avgAqi} vs ${fastest.avgAqi}) with ${String(clean.traffic).toLowerCase()} traffic, ` +
         `which is better for the ${profile} profile.`;
}

export const handler = async (event) => {
  // CORS preflight
  if (event.requestContext?.http?.method === "OPTIONS") return reply(200, {});

  // 1. Validate input
  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return reply(400, { error: "Invalid JSON body" });
  }
  const { routes, profile } = body;
  if (!Array.isArray(routes) || routes.length < 2 || !profile) {
    return reply(400, { error: "Send { routes: [fastestRoute, cleanRoute], profile }" });
  }
  const [fastest, clean] = routes;

  // 2. Build the prompt text from the numbers
  const summaryText =
    `User profile: ${profile}. ` +
    `Fastest route: ${fastest.durationMin} min, AQI ${fastest.avgAqi}, traffic ${fastest.traffic}. ` +
    `Clean route: ${clean.durationMin} min, AQI ${clean.avgAqi}, traffic ${clean.traffic}. ` +
    `Explain why the clean route is better for this profile.`;

  // 3. Ask Bedrock, fall back to a template sentence on any failure
  try {
    const command = new ConverseCommand({
      modelId: process.env.MODEL_ID,
      system: [{ text: "You are a route advisor. Explain in 2 short, simple sentences." }],
      messages: [{ role: "user", content: [{ text: summaryText }] }],
      inferenceConfig: { maxTokens: 120 },
    });
    const res = await client.send(command);
    const text = res.output.message.content[0].text;
    return reply(200, { text });
  } catch (err) {
    console.error("ERROR Bedrock failed:", err);
    return reply(200, { text: fallbackText(fastest, clean, profile) });
  }
};