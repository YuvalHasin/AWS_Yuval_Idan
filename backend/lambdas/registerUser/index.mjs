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
  console.log('Registration request:', JSON.stringify(event, null, 2));
  
  try {
    const { name, email, password, userType } = JSON.parse(event.body);
    
    // Validate input
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

    if (!['CLIENT', 'CPA'].includes(userType)) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          success: false,
          message: 'Invalid user type',
        }),
      };
    }

    // Step 1: Create user in Cognito
    const createUserParams = {
      UserPoolId: process.env.USER_POOL_ID,
      Username: email,
      TemporaryPassword: password,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'email_verified', Value: 'true' },
        { Name: 'name', Value: name },
      ],
      MessageAction: 'SUPPRESS',
    };
    
    const createUserResponse = await cognitoClient.send(new AdminCreateUserCommand(createUserParams));
    const userId = createUserResponse.User.Username;
    
    console.log('User created in Cognito:', userId);

    // Step 2: Set permanent password
    await cognitoClient.send(new AdminSetUserPasswordCommand({
      UserPoolId: process.env.USER_POOL_ID,
      Username: userId,
      Password: password,
      Permanent: true,
    }));

    console.log('Password set as permanent');

    // Step 3: Add user to appropriate group
    await cognitoClient.send(new AdminAddUserToGroupCommand({
      UserPoolId: process.env.USER_POOL_ID,
      Username: userId,
      GroupName: userType,
    }));

    console.log(`User added to ${userType} group`);

    // Step 4: If CLIENT, auto-assign to CPA (round-robin)
    let assignedCPA = null;
    if (userType === 'CLIENT') {
      assignedCPA = await assignCPARoundRobin();
      console.log('Assigned CPA:', assignedCPA);
    }

    // Step 5: Save user metadata to DynamoDB
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

    // Step 6: If this is a CPA, initialize their client count
    if (userType === 'CPA') {
      await docClient.send(new UpdateCommand({
        TableName: process.env.USERS_TABLE,
        Key: { userId },
        UpdateExpression: 'SET clientCount = :zero',
        ExpressionAttributeValues: { ':zero': 0 },
      }));
    }

    // Step 7: If CLIENT was assigned a CPA, increment CPA's client count
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
        message: 'Registration successful',
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

// Helper: Assign CLIENT to CPA using round-robin (least clients)
async function assignCPARoundRobin() {
  try {
    // Get all CPAs
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

    // Find CPA with least clients
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