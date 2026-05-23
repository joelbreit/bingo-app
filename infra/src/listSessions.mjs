import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient());
const TABLE = process.env.TABLE_NAME;
const now = () => Math.floor(Date.now() / 1000);

export const handler = async () => {
  // Find all session records (connectionId starts with "session#")
  const { Items: sessionItems = [] } = await ddb.send(new ScanCommand({
    TableName: TABLE,
    FilterExpression: "begins_with(connectionId, :pfx) AND (attribute_not_exists(#t) OR #t > :now)",
    ExpressionAttributeNames: { "#t": "ttl" },
    ExpressionAttributeValues: { ":pfx": "session#", ":now": now() },
  }));

  // Count live players (connections with playerState) per session
  const sessions = await Promise.all(sessionItems.map(async (item) => {
    const sessionId = item.sessionId;
    const { Count = 0 } = await ddb.send(new QueryCommand({
      TableName: TABLE,
      IndexName: "sessionId-index",
      KeyConditionExpression: "sessionId = :sid",
      FilterExpression: "attribute_exists(playerState)",
      ExpressionAttributeValues: { ":sid": sessionId },
      Select: "COUNT",
    }));
    return { id: sessionId, playerCount: Count };
  }));

  console.log(JSON.stringify({ action: "listSessions", count: sessions.length }));

  return {
    statusCode: 200,
    body: JSON.stringify({ sessions }),
  };
};
