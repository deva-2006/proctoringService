const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  UpdateCommand,
  GetCommand,
} = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};

const buildResponse = (statusCode, body) => ({
  statusCode,
  headers: corsHeaders,
  body: JSON.stringify(body),
});

exports.handler = async (event) => {
  console.log(
    "CompleteSessionLambda invoked with event:",
    JSON.stringify(event)
  );

  try {
    const method =
      event?.httpMethod ||
      event?.requestContext?.http?.method;

    // Handle CORS
    if (method === "OPTIONS") {
      return buildResponse(200, {});
    }

    // Validate method only if it exists
    if (method && method !== "POST") {
      return buildResponse(400, {
        message: "Invalid request method",
      });
    }

    let body = {};

    if (typeof event.body === "string") {
      body = JSON.parse(event.body);
    } else if (event.body && typeof event.body === "object") {
      body = event.body;
    }

    const { sessionId, status } = body;

    console.log("Session ID:", sessionId);
    console.log("Status:", status);

    if (
      !sessionId ||
      typeof sessionId !== "string" ||
      !sessionId.trim()
    ) {
      return buildResponse(400, {
        message: "Invalid sessionId",
      });
    }

    if (
      !status ||
      !["SUCCESS", "ENDED"].includes(status)
    ) {
      return buildResponse(400, {
        message: "Invalid status",
      });
    }

    const tableName = process.env.TABLE_NAME;

    if (!tableName) {
      throw new Error(
        "TABLE_NAME environment variable is not configured"
      );
    }

    const endedAt = new Date().toISOString();

    console.log("Updating session in DynamoDB...");

    await docClient.send(
      new UpdateCommand({
        TableName: tableName,
        Key: {
          sessionId,
        },
        UpdateExpression:
          "SET #status = :status, endedAt = :endedAt",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":status": status,
          ":endedAt": endedAt,
        },
      })
    );

    console.log("Session updated successfully");

    const result = await docClient.send(
      new GetCommand({
        TableName: tableName,
        Key: {
          sessionId,
        },
      })
    );

    console.log(
      "Final Session Record:",
      JSON.stringify(result.Item)
    );

    return buildResponse(200, {
      message: "Session completed",
      session: result.Item,
    });
  } catch (error) {
    console.error(
      "Failed to complete session:",
      error
    );

    return buildResponse(500, {
      message: "Failed to complete session",
      error: error.message,
    });
  }
};