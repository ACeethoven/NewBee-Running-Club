/**
 * Banners API client
 * Handles all banner-related API calls for homepage carousel
 */

import { api } from './client';

/**
 * Get all active banners (public)
 * @returns {Promise<Array>} - List of active banners sorted by display order
 */
export const getActiveBanners = async () => {
  return api.get('/api/banners');
};

/**
 * Get all banners including inactive (admin only)
 * @param {string} firebaseUid - Admin's Firebase UID for authentication
 * @returns {Promise<Array>} - List of all banners
 */
export const getAllBanners = async (firebaseUid) => {
  return api.get('/api/banners/all', {}, {
    'X-Firebase-UID': firebaseUid,
  });
};

/**
 * Get a single banner by ID
 * @param {number} bannerId - Banner ID
 * @returns {Promise<Object>} - Banner data
 */
export const getBannerById = async (bannerId) => {
  return api.get(`/api/banners/${bannerId}`);
};

/**
 * Create a new banner (admin only)
 * @param {Object} bannerData - Banner data
 * @param {string} firebaseUid - Admin's Firebase UID for authentication
 * @returns {Promise<Object>} - Created banner
 */
export const createBanner = async (bannerData, firebaseUid) => {
  return api.post('/api/banners', bannerData, {
    'X-Firebase-UID': firebaseUid,
  });
};

/**
 * Update an existing banner (admin only)
 * @param {number} bannerId - Banner ID
 * @param {Object} bannerData - Updated banner data
 * @param {string} firebaseUid - Admin's Firebase UID for authentication
 * @returns {Promise<Object>} - Updated banner
 */
export const updateBanner = async (bannerId, bannerData, firebaseUid) => {
  return api.put(`/api/banners/${bannerId}`, bannerData, {
    'X-Firebase-UID': firebaseUid,
  });
};

/**
 * Delete a banner (admin only)
 * @param {number} bannerId - Banner ID
 * @param {string} firebaseUid - Admin's Firebase UID for authentication
 * @returns {Promise<Object>} - Deletion confirmation
 */
export const deleteBanner = async (bannerId, firebaseUid) => {
  return api.delete(`/api/banners/${bannerId}`, {
    'X-Firebase-UID': firebaseUid,
  });
};

/**
 * Get carousel banners for homepage
 * Returns merged list of manual banners and highlight events
 * @returns {Promise<Array>} - List of carousel items sorted by display order
 */
export const getCarouselBanners = async () => {
  return api.get('/api/banners/carousel');
};
