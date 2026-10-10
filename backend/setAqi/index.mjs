
import {
  DynamoDBClient,
  UpdateItemCommand
} from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({});
const TABLE_NAME = "breatheroute-aqi";

export const handler = async (event) => {
  try {
    const cellId = event.pathParameters?.cellId;

    let body = event.body;

    if (typeof body === "string") {
      body = JSON.parse(body);
    }

    const aqi = Number(body?.aqi);

    if (!cellId) {
      return response(400, {
        message: "Missing cellId in URL"
      });
    }

    if (
      !Number.isInteger(aqi) ||
      aqi < 0 ||
      aqi > 500
    ) {
      return response(400, {
        message: "AQI must be an integer from 0 to 500"
      });
    }

    const result = await client.send(
      new UpdateItemCommand({
        TableName: TABLE_NAME,
        Key: {
          cellId: { S: cellId }
        },
        UpdateExpression:
          "SET aqi = :aqi, baseAqi = :baseAqi, updatedAt = :updatedAt",
        ExpressionAttributeValues: {
          ":aqi": { N: String(aqi) },
          ":baseAqi": { N: String(aqi) },
          ":updatedAt": { S: new Date().toISOString() }
        },
        ConditionExpression: "attribute_exists(cellId)",
        ReturnValues: "ALL_NEW"
      })
    );

    return response(200, {
      message: "AQI updated successfully",
      cell: {
        cellId,
        aqi: Number(result.Attributes.aqi.N),
        baseAqi: Number(result.Attributes.baseAqi.N),
        updatedAt: result.Attributes.updatedAt.S
      }
    });
  } catch (error) {
    console.error("setAqi failed:", error);

    if (error.name === "ConditionalCheckFailedException") {
      return response(404, {
        message: "AQI cell not found"
      });
    }

    if (error.name === "SyntaxError") {
      return response(400, {
        message: "Request body must contain valid JSON"
      });
    }

    return response(500, {
      message: "Failed to update AQI",
      error: error.message
    });
  }
};

function response(statusCode, data) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify(data)
  };
}
