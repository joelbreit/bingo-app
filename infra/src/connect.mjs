import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient());
const TABLE = process.env.TABLE_NAME;

export const handler = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const sessionId = event.queryStringParameters?.sessionId || "default";

  await ddb.send(new PutCommand({
    TableName: TABLE,
    Item: {
      connectionId,
      sessionId,
      ttl: Math.floor(Date.now() / 1000) + 14400, // 4 hours
    },
  }));

  console.log(JSON.stringify({ action: "connect", connectionId, sessionId }));
  return { statusCode: 200, body: "Connected" };
};
