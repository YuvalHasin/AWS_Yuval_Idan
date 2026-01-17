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

  // ✅ UPDATED LOGOUT FUNCTION
  const logout = async () => {
    setLoading(true); // ✅ CHANGE #1: Show loading during logout
    try {
      await signOut({ global: true }); // ✅ CHANGE #2: Global sign out
      setUser(null);
      setUserRole(null);
      console.log('✅ User signed out successfully');
    } catch (err) {
      console.error('❌ Logout error:', err);
      // ✅ CHANGE #3: Even if signOut fails, clear local state
      setUser(null);
      setUserRole(null);
      // ✅ CHANGE #4: Fallback - manually clear storage
      localStorage.clear();
      sessionStorage.clear();
    } finally {
      setLoading(false); // ✅ CHANGE #5: Always reset loading state
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