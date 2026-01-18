/**
 * Applications API functions
 */

import { api } from './client';

/**
 * Submit a new membership application
 * @param {Object} applicationData - Application data
 * @returns {Promise<Object>} Created application
 */
export async function submitApplication(applicationData) {
  return api.post('/api/applications', applicationData);
}

/**
 * Get all applications (admin only)
 * @param {string} [status] - Filter by status (pending, approved, rejected)
 * @returns {Promise<Array>} List of applications
 */
export async function getApplications(status = null) {
  const params = status ? { status_filter: status } : {};
  return api.get('/api/applications', params);
}

/**
 * Get pending applications for review
 * @returns {Promise<Array>} List of pending applications
 */
export async function getPendingApplications() {
  return api.get('/api/applications/pending');
}

/**
 * Get a specific application by ID
 * @param {number} applicationId - Application ID
 * @returns {Promise<Object>} Application data
 */
export async function getApplication(applicationId) {
  return api.get(`/api/applications/${applicationId}`);
}

/**
 * Review an application (approve or reject)
 * @param {number} applicationId - Application ID
 * @param {number} reviewerId - Reviewer's member ID
 * @param {string} action - 'approve' or 'reject'
 * @param {string} [reviewNotes] - Optional notes
 * @returns {Promise<Object>} Updated application
 */
export async function reviewApplication(applicationId, reviewerId, action, reviewNotes = null) {
  const body = {
    action,
    review_notes: reviewNotes
  };
  return api.post(`/api/applications/${applicationId}/review?reviewer_id=${reviewerId}`, body);
}
