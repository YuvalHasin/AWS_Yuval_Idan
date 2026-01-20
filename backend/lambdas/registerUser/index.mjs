import { 
  CognitoIdentityProviderClient, 
  AdminCreateUserCommand, 
  AdminAddUserToGroupCommand,
  AdminSetUserPasswordCommand
} from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export const handler = async (event) => {
  // Handle CORS preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    console.log(' Handling OPTIONS preflight request');
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Max-Age": "86400"
      },
      body: JSON.stringify({ message: "CORS preflight successful" })
    };
  }

  try {
    const { name, email, password, userType } = JSON.parse(event.body);
    
    if (!name || !email || !password || !userType) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          success: false,
          message: 'Missing required fields',
        }),
      };
    }

    //  Allow ADMIN (so existing ADMIN can create more ADMINs)
    if (!['CLIENT', 'CPA', 'ADMIN'].includes(userType)) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          success: false,
          message: 'Invalid user type. Must be CLIENT, CPA, or ADMIN',
        }),
      };
    }

    //  Create user in Cognito
    const createUserParams = {
      UserPoolId: process.env.USER_POOL_ID,
      Username: email,
      TemporaryPassword: password,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'email_verified', Value: 'true' },
        { Name: 'name', Value: name },
        { Name: 'custom:userType', Value: userType }, //  Critical for DashboardRouter
      ],
      MessageAction: 'SUPPRESS',
    };
    
    const createUserResponse = await cognitoClient.send(new AdminCreateUserCommand(createUserParams));
    const userId = createUserResponse.User.Username;
    
    console.log('User created in Cognito:', userId);

    //  Set permanent password
    await cognitoClient.send(new AdminSetUserPasswordCommand({
      UserPoolId: process.env.USER_POOL_ID,
      Username: userId,
      Password: password,
      Permanent: true,
    }));

    console.log('Password set as permanent');

    //  Add user to appropriate group
    await cognitoClient.send(new AdminAddUserToGroupCommand({
      UserPoolId: process.env.USER_POOL_ID,
      Username: userId,
      GroupName: userType,
    }));

    console.log(`User added to ${userType} group`);

    //  If CLIENT, auto-assign to CPA
    let assignedCPA = null;
    if (userType === 'CLIENT') {
      assignedCPA = await assignCPARoundRobin();
      console.log('Assigned CPA:', assignedCPA);
    }

    //  Save user metadata to DynamoDB
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

    //  If CPA, initialize client count
    if (userType === 'CPA') {
      await docClient.send(new UpdateCommand({
        TableName: process.env.USERS_TABLE,
        Key: { userId },
        UpdateExpression: 'SET clientCount = :zero',
        ExpressionAttributeValues: { ':zero': 0 },
      }));
    }

    //  Increment CPA's client count if assigned
    if (assignedCPA) {
      await docClient.send(new UpdateCommand({
        TableName: process.env.USERS_TABLE,
        Key: { userId: assignedCPA },
        UpdateExpression: 'SET clientCount = if_not_exists(clientCount, :zero) + :inc',
        ExpressionAttributeValues: { ':zero': 0, ':inc': 1 },
      }));
    }

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        message: 'User created successfully',
        userId,
        userType,
        assignedCPA,
      }),
    };
    
  } catch (error) {
    console.error('Registration error:', error);
    
    let errorMessage = 'Registration failed';
    
    if (error.name === 'UsernameExistsException') {
      errorMessage = 'An account with this email already exists';
    } else if (error.name === 'InvalidPasswordException') {
      errorMessage = 'Password does not meet requirements';
    }
    
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: false,
        message: errorMessage,
        error: error.message,
      }),
    };
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