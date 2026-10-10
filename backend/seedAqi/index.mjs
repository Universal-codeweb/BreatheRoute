import {
  DynamoDBClient,
  BatchWriteItemCommand
} from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({});

const TABLE_NAME = "breatheroute-aqi";

// Delhi demo area
const LAT_MIN = 28.6000;
const LAT_MAX = 28.6500;

const LNG_MIN = 77.1900;
const LNG_MAX = 77.2400;

// Each grid cell
const CELL_SIZE = 0.002;

export const handler = async (event) => {
  try {
    const items = [];

    const rows = 25;
    const cols = 25;

    console.log(`Creating ${rows * cols} AQI cells`);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {

        // Center point of this grid cell
        const lat = LAT_MIN + (row + 0.5) * CELL_SIZE;
        const lng = LNG_MIN + (col + 0.5) * CELL_SIZE;

        const cellId = `cell-${row}-${col}`;

        // Determine the type of area
        let roadType;
        let aqi;
        let traffic;

        // Main road areas
        if (
          Math.abs(lng - 77.210) < 0.004 ||
          Math.abs(lat - 28.625) < 0.004
        ) {
          roadType = "main-road";
          aqi = randomNumber(150, 200);
          traffic = randomNumber(80, 100);
        }

        // Park / lake areas
        else if (
          (lat > 28.605 && lat < 28.615 &&
           lng > 77.205 && lng < 77.220)
        ) {
          roadType = "park";
          aqi = randomNumber(30, 55);
          traffic = randomNumber(5, 15);
        }

        // Residential areas
        else if (
          lat > 28.615 &&
          lat < 28.640 &&
          lng > 77.195 &&
          lng < 77.235
        ) {
          roadType = "residential";
          aqi = randomNumber(60, 100);
          traffic = randomNumber(20, 40);
        }

        // Everything else
        else {
          roadType = "other";
          aqi = randomNumber(70, 110);
          traffic = randomNumber(25, 35);
        }

        // Small random variation
        aqi += randomNumber(-8, 8);

        // Keep AQI within sensible limits
        aqi = Math.max(20, Math.min(250, aqi));

        const item = {
          cellId: { S: cellId },
          lat: { N: lat.toFixed(6) },
          lng: { N: lng.toFixed(6) },
          aqi: { N: String(aqi) },
          baseAqi: { N: String(aqi) },
          traffic: { N: String(traffic) },
          roadType: { S: roadType },
          updatedAt: { S: new Date().toISOString() }
        };

        items.push(item);
      }
    }

    console.log(`Generated ${items.length} cells`);

    // DynamoDB allows maximum 25 items per BatchWrite request
    for (let i = 0; i < items.length; i += 25) {

      const batch = items.slice(i, i + 25);

      const command = new BatchWriteItemCommand({
        RequestItems: {
          [TABLE_NAME]: batch.map((item) => ({
            PutRequest: {
              Item: item
            }
          }))
        }
      });

      await client.send(command);

      console.log(
        `Inserted ${Math.min(i + 25, items.length)} / ${items.length}`
      );
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "AQI grid seeded successfully",
        cellsCreated: items.length,
        area: {
          latMin: LAT_MIN,
          latMax: LAT_MAX,
          lngMin: LNG_MIN,
          lngMax: LNG_MAX
        }
      })
    };

  } catch (error) {

    console.error("Seed error:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Failed to seed AQI grid",
        error: error.message
      })
    };
  }
};


// Generate a random integer
function randomNumber(min, max) {
  return Math.floor(
    Math.random() * (max - min + 1)
  ) + min;
}
