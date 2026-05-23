import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient());
const TABLE = process.env.TABLE_NAME;

export const handler = async (event) => {
  const connectionId = event.requestContext.connectionId;

  await ddb.send(new DeleteCommand({
    TableName: TABLE,
    Key: { connectionId },
  }));

  console.log(JSON.stringify({ action: "disconnect", connectionId }));
  return { statusCode: 200, body: "Disconnected" };
};
