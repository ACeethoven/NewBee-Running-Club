import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getMemberByFirebaseUid } from '../api/members';
import { committeeMembers } from '../data/committeeMembers';

const AdminContext = createContext();

// Storage key for admin mode persistence
const ADMIN_MODE_STORAGE_KEY = 'newbee_admin_mode_enabled';

export function useAdmin() {
  return useContext(AdminContext);
}

// Helper to safely get stored admin mode state
const getStoredAdminMode = () => {
  try {
    const stored = localStorage.getItem(ADMIN_MODE_STORAGE_KEY);
    return stored === 'true';
  } catch {
    return false;
  }
};

// Helper to safely set stored admin mode state
const setStoredAdminMode = (enabled) => {
  try {
    if (enabled) {
      localStorage.setItem(ADMIN_MODE_STORAGE_KEY, 'true');
    } else {
      localStorage.removeItem(ADMIN_MODE_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors (e.g., in private browsing)
  }
};

export function AdminProvider({ children }) {
  const { currentUser } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  // Initialize adminModeEnabled from localStorage
  const [adminModeEnabled, setAdminModeEnabled] = useState(getStoredAdminMode);
  const [memberData, setMemberData] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAdminStatus = useCallback(async () => {
    if (!currentUser?.uid) {
      setIsAdmin(false);
      setAdminModeEnabled(false);
      setMemberData(null);
      setLoading(false);
      return;
    }

    try {
      const member = await getMemberByFirebaseUid(currentUser.uid);
      setMemberData(member);

      // Check if user is admin based on member status or committee membership
      const isAdminByStatus = member?.status === 'admin';
      const memberName = member?.display_name || currentUser?.displayName || '';
      const isCommitteeMember = committeeMembers.some(
        cm => cm.name.toLowerCase() === memberName.toLowerCase()
      );

      setIsAdmin(isAdminByStatus || isCommitteeMember);
    } catch (err) {
      console.error('Error checking admin status:', err);
      // Check committee membership by Firebase display name as fallback
      const displayName = currentUser?.displayName || '';
      const isCommitteeMember = committeeMembers.some(
        cm => cm.name.toLowerCase() === displayName.toLowerCase()
      );
      setIsAdmin(isCommitteeMember);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    checkAdminStatus();
  }, [checkAdminStatus]);

  // Reset admin mode when user logs out and clear from storage
  useEffect(() => {
    if (!currentUser) {
      setAdminModeEnabled(false);
      setStoredAdminMode(false);
    }
  }, [currentUser]);

  // Sync admin mode state to localStorage whenever it changes
  useEffect(() => {
    // Only persist if user is an admin, otherwise clear storage
    if (isAdmin) {
      setStoredAdminMode(adminModeEnabled);
    } else if (adminModeEnabled) {
      // User is not admin but admin mode was enabled (e.g., from stale storage)
      // Reset to false
      setAdminModeEnabled(false);
      setStoredAdminMode(false);
    }
  }, [adminModeEnabled, isAdmin]);

  const toggleAdminMode = () => {
    if (isAdmin) {
      const newValue = !adminModeEnabled;
      setAdminModeEnabled(newValue);
      // Storage sync happens in the useEffect above
    }
  };

  const value = {
    isAdmin,
    adminModeEnabled,
    toggleAdminMode,
    memberData,
    loading
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
}
