import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand, QueryCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient());
const TABLE = process.env.TABLE_NAME;

async function getCallerSession(connectionId) {
  const { Item } = await ddb.send(new GetCommand({ TableName: TABLE, Key: { connectionId } }));
  return Item?.sessionId;
}

async function getConnections(sessionId) {
  const { Items } = await ddb.send(new QueryCommand({
    TableName: TABLE,
    IndexName: "sessionId-index",
    KeyConditionExpression: "sessionId = :sid",
    ExpressionAttributeValues: { ":sid": sessionId },
  }));
  return Items.filter(c => !c.connectionId.startsWith("session#"));
}

async function getSessionRecord(sessionId) {
  const { Item } = await ddb.send(new GetCommand({
    TableName: TABLE,
    Key: { connectionId: `session#${sessionId}` },
  }));
  return Item;
}

// UpdateCommand so individual session fields don't overwrite each other
// Rolling 8-hour TTL keeps the session visible in the listing while active
async function updateSession(sessionId, expression, values) {
  const ttl = Math.floor(Date.now() / 1000) + 28800;
  await ddb.send(new UpdateCommand({
    TableName: TABLE,
    Key: { connectionId: `session#${sessionId}` },
    UpdateExpression: `SET ${expression}, sessionId = :_sid, #t = :ttl`,
    ExpressionAttributeNames: { "#t": "ttl" },
    ExpressionAttributeValues: { ...values, ":_sid": sessionId, ":ttl": ttl },
  }));
}

async function broadcastTo(connections, message, event) {
  const endpoint = `https://${event.requestContext.domainName}/${event.requestContext.stage}`;
  const apigw = new ApiGatewayManagementApiClient({ endpoint });
  const data = JSON.stringify(message);

  await Promise.all(connections.map(async (conn) => {
    try {
      await apigw.send(new PostToConnectionCommand({ ConnectionId: conn.connectionId, Data: data }));
    } catch (err) {
      if (err.$metadata?.httpStatusCode === 410) {
        await ddb.send(new DeleteCommand({ TableName: TABLE, Key: { connectionId: conn.connectionId } }));
      }
    }
  }));
}

export const handler = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const body = JSON.parse(event.body || "{}");

  const sessionId = await getCallerSession(connectionId);
  if (!sessionId) return { statusCode: 200, body: "OK" };

  // ── Player state update ──
  if (body.t === "ps" && body.p) {
    await ddb.send(new UpdateCommand({
      TableName: TABLE,
      Key: { connectionId },
      UpdateExpression: "SET playerState = :ps",
      ExpressionAttributeValues: { ":ps": body.p },
    }));
  }

  // ── Host sets custom topics ──
  if (body.t === "setTopics" && Array.isArray(body.topics) && body.topics.length >= 24) {
    await updateSession(sessionId, "topics = :t", { ":t": body.topics });
  }

  // ── Host reveals topic(s) ──
  if (body.t === "reveal" && body.topics) {
    const session = await getSessionRecord(sessionId);
    const revealed = session?.revealedTopics || [];
    for (const t of body.topics) {
      if (t && !revealed.includes(t)) revealed.push(t);
    }
    await updateSession(sessionId, "revealedTopics = :rt", { ":rt": revealed });
  }

  // ── Host resets the game (topics are preserved) ──
  if (body.t === "reset") {
    await updateSession(sessionId, "revealedTopics = :empty", { ":empty": [] });
    const connections = await getConnections(sessionId);
    await Promise.all(connections.map(conn =>
      ddb.send(new UpdateCommand({
        TableName: TABLE,
        Key: { connectionId: conn.connectionId },
        UpdateExpression: "REMOVE playerState",
      }))
    ));
    const session = await getSessionRecord(sessionId);
    await broadcastTo(connections, {
      t: "players", players: [], revealedTopics: [], topics: session?.topics || null, reset: true,
    }, event);
    console.log(JSON.stringify({ action: "reset", connectionId, sessionId }));
    return { statusCode: 200, body: "OK" };
  }

  // ── Broadcast current state to all session connections ──
  const connections = await getConnections(sessionId);
  const players = connections.filter(c => c.playerState).map(c => c.playerState);
  const session = await getSessionRecord(sessionId);

  await broadcastTo(connections, {
    t: "players",
    players,
    revealedTopics: session?.revealedTopics || null,
    topics: session?.topics || null,
  }, event);

  console.log(JSON.stringify({
    action: body.t || "unknown",
    connectionId,
    sessionId,
    playerCount: players.length,
  }));

  return { statusCode: 200, body: "OK" };
};
