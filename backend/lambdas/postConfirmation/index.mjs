import { 
  CognitoIdentityProviderClient, 
  AdminAddUserToGroupCommand
} from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export const handler = async (event) => {
  console.log('PostConfirmation event:', JSON.stringify(event, null, 2));
  
  try {
    const { userName, request } = event;
    const userAttributes = request.userAttributes;
    
    const userId = userName;
    const email = userAttributes.email;
    const name = userAttributes.name;
    const userType = userAttributes['custom:userType'] || 'CLIENT';

    console.log(`Processing user: ${email}, type: ${userType}`);

    // Add user to Cognito group
    await cognitoClient.send(new AdminAddUserToGroupCommand({
      UserPoolId: event.userPoolId,
      Username: userId,
      GroupName: userType,
    }));

    console.log(`User added to ${userType} group`);

    // Auto-assign CPA if user is CLIENT
    let assignedCPA = null;
    if (userType === 'CLIENT') {
      assignedCPA = await assignCPARoundRobin();
      console.log('Assigned CPA:', assignedCPA);
    }

    // Save user metadata to DynamoDB
    const timestamp = new Date().toISOString();
    await docClient.send(new PutCommand({
      TableName: process.env.USERS_TABLE,
      Item: {
        userId,
        email,
        name,
        userType,
        assignedCPA: assignedCPA || null,
        status: 'ACTIVE',
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    }));

    console.log('User metadata saved to DynamoDB');

    //  Initialize CPA client count
    if (userType === 'CPA') {
      await docClient.send(new UpdateCommand({
        TableName: process.env.USERS_TABLE,
        Key: { userId },
        UpdateExpression: 'SET clientCount = :zero',
        ExpressionAttributeValues: { ':zero': 0 },
      }));
    }

    // Increment CPA's client count if assigned
    if (assignedCPA) {
      await docClient.send(new UpdateCommand({
        TableName: process.env.USERS_TABLE,
        Key: { userId: assignedCPA },
        UpdateExpression: 'SET clientCount = if_not_exists(clientCount, :zero) + :inc',
        ExpressionAttributeValues: { ':zero': 0, ':inc': 1 },
      }));
    }

    console.log('PostConfirmation completed successfully');
    
    return event; // Must return event for Cognito trigger
    
  } catch (error) {
    console.error('PostConfirmation error:', error);
    throw error;
  }
};

async function assignCPARoundRobin() {
  try {
    const result = await docClient.send(new ScanCommand({
      TableName: process.env.USERS_TABLE,
      FilterExpression: 'userType = :cpa AND #status = :active',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':cpa': 'CPA', ':active': 'ACTIVE' },
    }));
    
    if (!result.Items || result.Items.length === 0) {
      console.log('No CPAs available for assignment');
      return null;
    }

    const cpaWithLeastClients = result.Items.reduce((prev, curr) => 
      (curr.clientCount || 0) < (prev.clientCount || 0) ? curr : prev
    );

    console.log('Selected CPA:', cpaWithLeastClients.userId, 'with', cpaWithLeastClients.clientCount || 0, 'clients');
    
    return cpaWithLeastClients.userId;
    
  } catch (error) {
    console.error('Error assigning CPA:', error);
    return null;
  }
}