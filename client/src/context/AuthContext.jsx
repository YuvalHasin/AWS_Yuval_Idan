import React, { createContext, useState, useContext, useEffect } from 'react';
import { Amplify } from 'aws-amplify';
import { signIn, signOut, getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
import { cognitoConfig } from '../aws-config';

Amplify.configure(cognitoConfig);

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkAuthState = async () => {
    try {
      setLoading(true);
      const session = await fetchAuthSession();
      
      if (session.tokens) {
        const payload = session.tokens.idToken.payload;
        const groups = payload['cognito:groups'] || [];
        
        const userData = {
          userId: payload.sub,
          username: payload.name || payload.email || 'User',
          email: payload.email
        };

        let role = 'CLIENT';
        if (groups.includes('ADMIN')) role = 'ADMIN';
        else if (groups.includes('CPA')) role = 'CPA';

        setUser(userData);
        setUserRole(role);
      } else {
        setUser(null);
        setUserRole(null);
      }
    } catch (err) {
      setUser(null);
      setUserRole(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuthState();
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      const { isSignedIn } = await signIn({
        username: email,
        password: password,
      });

      if (isSignedIn) {
        const session = await fetchAuthSession();
        const payload = session.tokens.idToken.payload;
        const groups = payload['cognito:groups'] || [];
        
        const userData = {
          userId: payload.sub,
          username: payload.name || payload.email || 'User',
          email: payload.email
        };

        let role = 'CLIENT';
        if (groups.includes('ADMIN')) role = 'ADMIN';
        else if (groups.includes('CPA')) role = 'CPA';

        setUser(userData);
        setUserRole(role);
      }
    } catch (err) {
      let errorMessage = 'Invalid email or password';
      if (err.name === 'UserNotFoundException') errorMessage = 'User not found';
      else if (err.name === 'NotAuthorizedException') errorMessage = 'Incorrect username or password';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut({ global: true });
      setUser(null);
      setUserRole(null);
      console.log('✅ User signed out successfully');
    } catch (err) {
      console.error('❌ Logout error:', err);
      setUser(null);
      setUserRole(null);
      localStorage.clear();
      sessionStorage.clear();
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: Get fresh authentication token
  const getAuthToken = async () => {
    try {
      const session = await fetchAuthSession();
      
      if (!session.tokens) {
        throw new Error('No valid session found');
      }
      
      // Return the ID token as a string
      const idToken = session.tokens.idToken?.toString();
      
      if (!idToken) {
        throw new Error('No ID token available');
      }
      
      console.log('🔑 Auth token retrieved successfully');
      return idToken;
      
    } catch (error) {
      console.error('❌ Error getting auth token:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userRole,
        loading,
        error,
        login,
        logout,
        getAuthToken, // ✅ Expose the new function
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};