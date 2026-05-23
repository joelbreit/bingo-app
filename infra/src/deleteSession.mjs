import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient());
const TABLE = process.env.TABLE_NAME;

export const handler = async (event) => {
  const sessionId = event.pathParameters?.sessionId;
  if (!sessionId) return { statusCode: 400, body: "Missing sessionId" };

  // Fetch every record tied to this session (session record + all player connections)
  const { Items = [] } = await ddb.send(new QueryCommand({
    TableName: TABLE,
    IndexName: "sessionId-index",
    KeyConditionExpression: "sessionId = :sid",
    ExpressionAttributeValues: { ":sid": sessionId },
  }));

  await Promise.all(Items.map(item =>
    ddb.send(new DeleteCommand({ TableName: TABLE, Key: { connectionId: item.connectionId } }))
  ));

  console.log(JSON.stringify({ action: "deleteSession", sessionId, deletedCount: Items.length }));

  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true }),
  };
};
