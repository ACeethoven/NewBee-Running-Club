import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    FacebookAuthProvider,
    GithubAuthProvider,
    updateProfile,
    sendPasswordResetEmail,
    signOut
  } from 'firebase/auth';
  import { auth } from './config';
  import { syncFirebaseUser } from '../api/members';

  /**
   * Sync Firebase user to MySQL members table
   * @param {Object} user - Firebase user object
   */
  const syncUserToDatabase = async (user) => {
    try {
      await syncFirebaseUser({
        firebase_uid: user.uid,
        email: user.email,
        display_name: user.displayName,
        photo_url: user.photoURL
      });
    } catch (error) {
      console.error('Failed to sync user to database:', error);
      // Don't throw - auth succeeded, just logging the sync failure
    }
  };
  
  // Standard email/password sign in
  export const loginWithEmailAndPassword = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Sync user to MySQL database
      await syncUserToDatabase(userCredential.user);
      return { user: userCredential.user, error: null };
    } catch (error) {
      return { user: null, error: error.message };
    }
  };
  
  // Register with email/password
  export const registerWithEmailAndPassword = async (email, password, displayName) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Update profile with display name if provided
      if (displayName) {
        await updateProfile(userCredential.user, { displayName });
      }

      // Sync user to MySQL database
      await syncUserToDatabase({
        ...userCredential.user,
        displayName: displayName || userCredential.user.displayName
      });

      return { user: userCredential.user, error: null };
    } catch (error) {
      return { user: null, error: error.message };
    }
  };
  
  // Google sign in
  export const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      // Sync user to MySQL database
      await syncUserToDatabase(userCredential.user);
      return { user: userCredential.user, error: null };
    } catch (error) {
      return { user: null, error: error.message };
    }
  };
  
  // Facebook sign in
  export const signInWithFacebook = async () => {
    try {
      const provider = new FacebookAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      // Sync user to MySQL database
      await syncUserToDatabase(userCredential.user);
      return { user: userCredential.user, error: null };
    } catch (error) {
      return { user: null, error: error.message };
    }
  };
  
  // GitHub sign in
  export const signInWithGithub = async () => {
    try {
      const provider = new GithubAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      // Sync user to MySQL database
      await syncUserToDatabase(userCredential.user);
      return { user: userCredential.user, error: null };
    } catch (error) {
      return { user: null, error: error.message };
    }
  };
  
  // Password reset
  export const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };
  
  // Sign out
  export const logout = async () => {
    try {
      await signOut(auth);
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };