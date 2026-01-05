// src/aws-config.js
export const cognitoConfig = {
  Auth: {
    Cognito: {
      userPoolId: 'us-east-1_v84PdOOZW', // ה-ID מהתמונה שלך
      userPoolClientId: '2mh3g5q5fa1ov4js2tfbcua1t', // ה-Client ID שהשגת
      loginWith: {
        email: true,
      },
    },
  },
};