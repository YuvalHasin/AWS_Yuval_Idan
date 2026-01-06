import React, { createContext, useState, useContext, useEffect } from 'react';
import { Amplify } from 'aws-amplify';
import { signIn, signOut, getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
import { cognitoConfig } from '../aws-config';

Amplify.configure(cognitoConfig);

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const clearSession = async () => {
      try {
        await signOut();
        console.log('🔒 Session cleared - login required');
      } catch (err) {
        // No session to clear
      }
    };
    clearSession();
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      const { isSignedIn, nextStep } = await signIn({
        username: email,
        password: password,
      });

      if (nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
        console.log('🔒 NEW_PASSWORD_REQUIRED detected, auto-completing...');
      }

      if (isSignedIn) {
        const currentUser = await getCurrentUser();
        const session = await fetchAuthSession();
        
        const groups = session.tokens?.accessToken?.payload['cognito:groups'] || 
                      session.tokens?.idToken?.payload['cognito:groups'] || [];
        
        console.log('✅ Detected Groups:', groups);
        
        let role = 'CLIENT';
        if (groups.includes('ADMIN')) {
          role = 'ADMIN';
        } else if (groups.includes('CPA')) {
          role = 'CPA';
        }
        
        console.log('🎯 Final Role Assigned:', role);
        
        setUser(currentUser);
        setUserRole(role);
      }

    } catch (err) {
      console.error('❌ Login error:', err);
      
      let errorMessage = 'Invalid email or password';
      if (err.name === 'UserNotFoundException') {
        errorMessage = 'User not found';
      } else if (err.name === 'NotAuthorizedException') {
        errorMessage = 'Incorrect username or password';
      }
      
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut();
      setUser(null);
      setUserRole(null);
      console.log('✅ User signed out successfully');
    } catch (err) {
      console.error('❌ Logout error:', err);
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