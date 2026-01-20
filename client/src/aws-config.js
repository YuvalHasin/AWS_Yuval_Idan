// src/aws-config.js
export const cognitoConfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
      loginWith: {
        email: true,
      },
    },
  },
};
export const s3Config = {
    storageBucket: import.meta.env.VITE_STORAGE_BUCKET_NAME,
    region: import.meta.env.VITE_AWS_REGION || 'us-east-1'
};