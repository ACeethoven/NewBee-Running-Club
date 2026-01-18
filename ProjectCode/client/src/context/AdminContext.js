import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getMemberByFirebaseUid } from '../api/members';
import { committeeMembers } from '../data/committeeMembers';

const AdminContext = createContext();

export function useAdmin() {
  return useContext(AdminContext);
}

export function AdminProvider({ children }) {
  const { currentUser } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminModeEnabled, setAdminModeEnabled] = useState(false);
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

  // Reset admin mode when user logs out
  useEffect(() => {
    if (!currentUser) {
      setAdminModeEnabled(false);
    }
  }, [currentUser]);

  const toggleAdminMode = () => {
    if (isAdmin) {
      setAdminModeEnabled(prev => !prev);
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
