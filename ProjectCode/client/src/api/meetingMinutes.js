/**
 * Meeting Minutes API client
 * Handles all meeting minutes-related API calls
 */

import { api } from './client';

/**
 * Get all meeting minutes
 * @returns {Promise<Array>} - List of meeting minutes sorted by date (most recent first)
 */
export const getAllMeetingMinutes = async () => {
  return api.get('/api/meeting-minutes');
};

/**
 * Get a single meeting minutes by ID
 * @param {number} minutesId - Meeting minutes ID
 * @returns {Promise<Object>} - Meeting minutes data
 */
export const getMeetingMinutesById = async (minutesId) => {
  return api.get(`/api/meeting-minutes/${minutesId}`);
};

/**
 * Create new meeting minutes (admin only)
 * @param {Object} minutesData - Meeting minutes data { title, meeting_date, content }
 * @param {string} firebaseUid - Admin's Firebase UID for authentication
 * @returns {Promise<Object>} - Created meeting minutes
 */
export const createMeetingMinutes = async (minutesData, firebaseUid) => {
  return api.post('/api/meeting-minutes', minutesData, {
    'X-Firebase-UID': firebaseUid,
  });
};

/**
 * Update existing meeting minutes (admin only)
 * @param {number} minutesId - Meeting minutes ID
 * @param {Object} minutesData - Updated meeting minutes data
 * @param {string} firebaseUid - Admin's Firebase UID for authentication
 * @returns {Promise<Object>} - Updated meeting minutes
 */
export const updateMeetingMinutes = async (minutesId, minutesData, firebaseUid) => {
  return api.put(`/api/meeting-minutes/${minutesId}`, minutesData, {
    'X-Firebase-UID': firebaseUid,
  });
};

/**
 * Delete meeting minutes (admin only)
 * @param {number} minutesId - Meeting minutes ID
 * @param {string} firebaseUid - Admin's Firebase UID for authentication
 * @returns {Promise<Object>} - Deletion confirmation
 */
export const deleteMeetingMinutes = async (minutesId, firebaseUid) => {
  return api.delete(`/api/meeting-minutes/${minutesId}`, {
    'X-Firebase-UID': firebaseUid,
  });
};
