
import {
  DynamoDBClient,
  ScanCommand,
  BatchWriteItemCommand
} from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({});
const TABLE_NAME = "breatheroute-aqi";

export const handler = async () => {
  try {
    const now = new Date();

    // Use India Standard Time for rush-hour detection
    const indiaTime = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );

    const hour = indiaTime.getHours();
    const isRushHour =
      (hour >= 8 && hour < 10) ||
      (hour >= 17 && hour < 20);

    // Read all AQI cells
    const items = [];
    let lastKey;

    do {
      const result = await client.send(
        new ScanCommand({
          TableName: TABLE_NAME,
          ExclusiveStartKey: lastKey
        })
      );

      items.push(...(result.Items || []));
      lastKey = result.LastEvaluatedKey;
    } while (lastKey);

    // Prepare updated cells
    const requests = items.map((item) => {
      const baseAqi = Number(item.baseAqi?.N ?? item.aqi?.N ?? 70);
      const roadType = item.roadType?.S || "other";
      const baseTraffic = Number(item.traffic?.N ?? 30);

      const variation = Math.floor(Math.random() * 21) - 10;
      let aqi = Math.max(0, baseAqi + variation);

      if (isRushHour && roadType === "main-road") {
        aqi += 15;
      }

      let traffic = baseTraffic;

      if (isRushHour) {
        traffic = Math.min(100, Math.round(baseTraffic * 1.2));
      }

      return {
        PutRequest: {
          Item: {
            ...item,
            aqi: { N: String(aqi) },
            traffic: { N: String(traffic) },
            updatedAt: { S: now.toISOString() }
          }
        }
      };
    });

    // DynamoDB allows up to 25 writes per batch
    for (let i = 0; i < requests.length; i += 25) {
      await client.send(
        new BatchWriteItemCommand({
          RequestItems: {
            [TABLE_NAME]: requests.slice(i, i + 25)
          }
        })
      );
    }

    console.log(`Refreshed ${requests.length} AQI cells`);
    console.log(`Rush hour: ${isRushHour}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "AQI refreshed successfully",
        cellsUpdated: requests.length,
        rushHour: isRushHour
      })
    };
  } catch (error) {
    console.error("AQI refresh failed:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "AQI refresh failed",
        error: error.message
      })
    };
  }
};
