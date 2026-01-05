import { createContext, useState, useEffect, useContext } from 'react';
import { Amplify } from 'aws-amplify';
// Added confirmSignIn to imports to handle Force Change Password state
import { signIn, signOut, getCurrentUser, fetchAuthSession, confirmSignIn } from 'aws-amplify/auth';
import { cognitoConfig } from '../aws-config';

// Initialize Amplify
Amplify.configure(cognitoConfig);

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check auth status on mount
  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      const session = await fetchAuthSession();
      
      console.log("🔥 FULL SESSION:", session);

      // Extract groups from both Access Token and ID Token to ensure we don't miss anything
      const accessTokenGroups = session.tokens?.accessToken?.payload['cognito:groups'] || [];
      const idTokenGroups = session.tokens?.idToken?.payload['cognito:groups'] || [];
      
      // Merge groups and remove duplicates
      const groups = [...new Set([...accessTokenGroups, ...idTokenGroups])];
      
      console.log("✅ Detected Groups:", groups);

      // Determine user role based on group priority
      const role = groups.includes('ADMIN') ? 'ADMIN' 
                 : groups.includes('CPA') ? 'CPA' 
                 : 'CLIENT';

      console.log("👑 Final Role Assigned:", role);

      setUser(currentUser);
      setUserRole(role);
    } catch (error) {
      console.log('Not signed in (User needs to login)');
      setUser(null);
      setUserRole(null);
    } finally {
      setLoading(false);
    }
  };

  // --- Enhanced Login Function ---
  const login = async (email, password) => {
    try {
      const response = await signIn({ username: email, password });
      console.log("Login Step 1 Response:", response);

      // 1. Standard login successful
      if (response.isSignedIn) {
        await checkUser();
        return { success: true };
      } 
      
      // 2. Handle "Force Change Password" state automatically
      // This happens when a user is created administratively
      else if (response.nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
        console.log("⚠️ Force Change Password Detected. Auto-confirming...");
        
        // Confirm using the existing password as the "new" password
        const confirmedResponse = await confirmSignIn({ challengeResponse: password });
        console.log("Login Step 2 (Confirm) Response:", confirmedResponse);

        if (confirmedResponse.isSignedIn) {
          await checkUser();
          return { success: true };
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut();
      setUser(null);
      setUserRole(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userRole, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
export const useAuth = () => useContext(AuthContext);