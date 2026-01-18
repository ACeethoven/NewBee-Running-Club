/**
 * Members API functions
 */

import { api } from './client';

/**
 * Sync a Firebase user to the members table
 * Creates a new member if not exists, returns existing member if already synced
 * @param {Object} userData - Firebase user data
 * @param {string} userData.firebase_uid - Firebase UID
 * @param {string} userData.email - User email
 * @param {string} [userData.display_name] - Display name
 * @param {string} [userData.photo_url] - Profile photo URL
 * @returns {Promise<Object>} Member data
 */
export async function syncFirebaseUser(userData) {
  return api.post('/api/members/firebase-sync', userData);
}

/**
 * Get member by Firebase UID
 * @param {string} firebaseUid - Firebase UID
 * @returns {Promise<Object>} Member data
 */
export async function getMemberByFirebaseUid(firebaseUid) {
  return api.get(`/api/members/firebase/${firebaseUid}`);
}

/**
 * Get current member's data
 * @param {number} memberId - Member ID
 * @returns {Promise<Object>} Member data
 */
export async function getMember(memberId) {
  return api.get(`/api/members/${memberId}`);
}

/**
 * Update member data
 * @param {number} memberId - Member ID
 * @param {Object} data - Updated fields
 * @returns {Promise<Object>} Updated member data
 */
export async function updateMember(memberId, data) {
  return api.put(`/api/members/${memberId}`, data);
}

/**
 * Update member privacy settings
 * @param {number} memberId - Member ID
 * @param {boolean} [showInCredits] - Show in credits page
 * @param {boolean} [showInDonors] - Show in donors page
 * @returns {Promise<Object>} Updated member data
 */
export async function updateMemberPrivacy(memberId, showInCredits, showInDonors) {
  const params = new URLSearchParams();
  if (showInCredits !== undefined) params.append('show_in_credits', showInCredits);
  if (showInDonors !== undefined) params.append('show_in_donors', showInDonors);
  return api.put(`/api/members/${memberId}/privacy?${params.toString()}`, {});
}

/**
 * Get all members visible in credits page
 * @returns {Promise<Array>} List of members
 */
export async function getMembersForCredits() {
  return api.get('/api/members/credits');
}

/**
 * Get committee members
 * @returns {Promise<Array>} List of committee members
 */
export async function getCommitteeMembers() {
  return api.get('/api/members/committee/list');
}

/**
 * Submit join application
 * @param {Object} applicationData - Application form data
 * @param {string} applicationData.name - Full name
 * @param {string} applicationData.email - Email address
 * @param {string} [applicationData.nyrr_id] - NYRR Runner ID
 * @param {string} applicationData.running_experience - Running experience description
 * @param {string} applicationData.location - Running location
 * @param {string} applicationData.weekly_frequency - Weekly running frequency
 * @param {string} applicationData.monthly_mileage - Monthly mileage
 * @param {string} [applicationData.race_experience] - Race experience
 * @param {string} applicationData.goals - Running goals
 * @param {string} applicationData.introduction - Self introduction
 * @returns {Promise<Object>} Application response
 */
export async function submitJoinApplication(applicationData) {
  return api.post('/api/join/submit', applicationData);
}

/**
 * Get all pending member applications (admin only)
 * @returns {Promise<Array>} List of pending members
 */
export async function getPendingMembers() {
  return api.get('/api/members/pending/list');
}

/**
 * Approve a pending member application
 * @param {number} memberId - Member ID
 * @returns {Promise<Object>} Approval response
 */
export async function approveMember(memberId) {
  return api.put(`/api/members/${memberId}/approve`, {});
}

/**
 * Reject a pending member application
 * @param {number} memberId - Member ID
 * @returns {Promise<Object>} Rejection response
 */
export async function rejectMember(memberId) {
  return api.put(`/api/members/${memberId}/reject`, {});
}
