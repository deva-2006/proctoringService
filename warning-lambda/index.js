const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  UpdateCommand,
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
    "WarningLambda invoked with event:",
    JSON.stringify(event)
  );

  try {
    // Handle CORS Preflight
    const method =
      event?.httpMethod ||
      event?.requestContext?.http?.method;

    if (method === "OPTIONS") {
      return buildResponse(200, {});
    }

    // Parse Body
    let body = {};

    if (typeof event.body === "string") {
      body = JSON.parse(event.body);
    } else if (event.body && typeof event.body === "object") {
      body = event.body;
    }

    console.log("Parsed Body:", body);

    const sessionId = body.sessionId;

    if (
      !sessionId ||
      typeof sessionId !== "string" ||
      !sessionId.trim()
    ) {
      return buildResponse(400, {
        message: "sessionId is required",
      });
    }

    const tableName = process.env.TABLE_NAME;

    console.log("Session ID:", sessionId);
    console.log("Table Name:", tableName);

    if (!tableName) {
      throw new Error(
        "TABLE_NAME environment variable is not configured"
      );
    }

    const command = new UpdateCommand({
      TableName: tableName,
      Key: {
        sessionId,
      },
      UpdateExpression:
        "SET warningCount = if_not_exists(warningCount, :zero) + :increment",
      ExpressionAttributeValues: {
        ":zero": 0,
        ":increment": 1,
      },
      ReturnValues: "UPDATED_NEW",
    });

    console.log(
      "Updating warning count for session:",
      sessionId
    );

    const result = await docClient.send(command);

    console.log(
      "DynamoDB Update Result:",
      JSON.stringify(result)
    );

    const warningCount =
      result.Attributes?.warningCount ?? 0;

    return buildResponse(200, {
      warningCount,
    });
  } catch (error) {
    console.error(
      "Failed to update warning count:",
      error
    );

    return buildResponse(500, {
      message: "Failed to update warning count",
      error: error.message,
    });
  }
};