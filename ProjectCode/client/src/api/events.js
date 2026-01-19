/**
 * Events API client
 * Handles all event-related API calls
 */

import { api } from './client';

/**
 * Get all events
 * @param {string} status - Optional status filter (Upcoming, Highlight, Cancelled)
 * @returns {Promise<Array>} - List of events
 */
export const getAllEvents = async (status = null) => {
  const params = status ? { event_status: status } : {};
  return api.get('/api/events', params);
};

/**
 * Get events by status
 * @param {string} status - Event status (Upcoming, Highlight, Cancelled)
 * @returns {Promise<Array>} - List of events with the specified status
 */
export const getEventsByStatus = async (status) => {
  return api.get(`/api/events/status/${status}`);
};

/**
 * Get a single event by ID
 * @param {number} eventId - Event ID
 * @returns {Promise<Object>} - Event data
 */
export const getEventById = async (eventId) => {
  return api.get(`/api/events/${eventId}`);
};

/**
 * Create a new event (admin only)
 * @param {Object} eventData - Event data
 * @param {string} firebaseUid - Admin's Firebase UID for authentication
 * @returns {Promise<Object>} - Created event
 */
export const createEvent = async (eventData, firebaseUid) => {
  return api.post('/api/events', eventData, {
    'X-Firebase-UID': firebaseUid,
  });
};

/**
 * Update an existing event (admin only)
 * @param {number} eventId - Event ID
 * @param {Object} eventData - Updated event data
 * @param {string} firebaseUid - Admin's Firebase UID for authentication
 * @returns {Promise<Object>} - Updated event
 */
export const updateEvent = async (eventId, eventData, firebaseUid) => {
  return api.put(`/api/events/${eventId}`, eventData, {
    'X-Firebase-UID': firebaseUid,
  });
};

/**
 * Delete an event (admin only)
 * @param {number} eventId - Event ID
 * @param {string} firebaseUid - Admin's Firebase UID for authentication
 * @returns {Promise<Object>} - Deletion confirmation
 */
export const deleteEvent = async (eventId, firebaseUid) => {
  return api.delete(`/api/events/${eventId}`, {
    'X-Firebase-UID': firebaseUid,
  });
};
