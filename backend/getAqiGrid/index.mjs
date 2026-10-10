import {
  DynamoDBClient,
  ScanCommand
} from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({});

const TABLE_NAME = "breatheroute-aqi";

export const handler = async (event) => {
  try {
    const cells = [];
    let lastEvaluatedKey = undefined;

    do {
      const command = new ScanCommand({
        TableName: TABLE_NAME,
        ExclusiveStartKey: lastEvaluatedKey
      });

      const response = await client.send(command);

      for (const item of response.Items || []) {
        const aqi = Number(item.aqi?.N || 0);

        cells.push({
          cellId: item.cellId?.S,
          lat: Number(item.lat?.N),
          lng: Number(item.lng?.N),
          aqi: aqi,
          traffic: Number(item.traffic?.N || 0),
          roadType: item.roadType?.S || "other",
          level: getAqiLevel(aqi)
        });
      }

      lastEvaluatedKey = response.LastEvaluatedKey;

    } while (lastEvaluatedKey);

    console.log(`Retrieved ${cells.length} AQI cells`);

    return {
      statusCode: 200,

      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },

      body: JSON.stringify({
        cellSize: 0.002,
        cells: cells
      })
    };

  } catch (error) {

    console.error("Error getting AQI grid:", error);

    return {
      statusCode: 500,

      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },

      body: JSON.stringify({
        message: "Failed to get AQI grid",
        error: error.message
      })
    };
  }
};


// Convert AQI number into a readable level
function getAqiLevel(aqi) {

  if (aqi <= 50) {
    return "clean";
  }

  if (aqi <= 100) {
    return "moderate";
  }

  if (aqi <= 150) {
    return "high";
  }

  return "poor";
}
