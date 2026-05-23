import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand, QueryCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient());
const TABLE = process.env.TABLE_NAME;

export const handler = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const body = JSON.parse(event.body || "{}");

  // If this is a player state update, save it
  if (body.t === "ps" && body.p) {
    await ddb.send(new UpdateCommand({
      TableName: TABLE,
      Key: { connectionId },
      UpdateExpression: "SET playerState = :ps",
      ExpressionAttributeValues: { ":ps": body.p },
    }));
  }

  // Query all connections in this session
  // First get the caller's sessionId
  const callerResult = await ddb.send(new QueryCommand({
    TableName: TABLE,
    KeyConditionExpression: "connectionId = :cid",
    ExpressionAttributeValues: { ":cid": connectionId },
  }));
  const sessionId = callerResult.Items?.[0]?.sessionId;
  if (!sessionId) return { statusCode: 200, body: "OK" };

  // Get all connections in this session
  const { Items: connections } = await ddb.send(new QueryCommand({
    TableName: TABLE,
    IndexName: "sessionId-index",
    KeyConditionExpression: "sessionId = :sid",
    ExpressionAttributeValues: { ":sid": sessionId },
  }));

  // Build full player list from connections that have player state
  const players = connections
    .filter(c => c.playerState)
    .map(c => c.playerState);

  const message = JSON.stringify({ t: "players", players });

  // Fan out to all connections in the session
  const endpoint = `https://${event.requestContext.domainName}/${event.requestContext.stage}`;
  const apigw = new ApiGatewayManagementApiClient({ endpoint });

  await Promise.all(connections.map(async (conn) => {
    try {
      await apigw.send(new PostToConnectionCommand({
        ConnectionId: conn.connectionId,
        Data: message,
      }));
    } catch (err) {
      if (err.$metadata?.httpStatusCode === 410) {
        await ddb.send(new DeleteCommand({
          TableName: TABLE,
          Key: { connectionId: conn.connectionId },
        }));
      }
    }
  }));

  console.log(JSON.stringify({
    action: body.t || "unknown",
    connectionId,
    sessionId,
    playerCount: players.length,
  }));

  return { statusCode: 200, body: "OK" };
};
