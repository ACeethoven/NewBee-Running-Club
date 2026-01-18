/**
 * Race Results API functions
 */

import { api } from './client';

/**
 * Get race results for a member by NYRR ID
 * @param {string} nyrrId - Member's NYRR ID or name
 * @returns {Promise<Object>} Race results and statistics
 */
export async function getMemberRaceResults(nyrrId) {
  return api.get(`/api/results/member/${encodeURIComponent(nyrrId)}`);
}

/**
 * Search race results with filters
 * @param {Object} filters - Search filters
 * @param {string} [filters.name] - Runner name
 * @param {string} [filters.race] - Race name
 * @param {number} [filters.year] - Year
 * @param {string} [filters.distance] - Race distance
 * @returns {Promise<Object>} Search results
 */
export async function searchRaceResults(filters) {
  return api.get('/api/results/search', filters);
}

/**
 * Get available years with race data
 * @returns {Promise<Object>} List of years
 */
export async function getAvailableYears() {
  return api.get('/api/results/available-years');
}

/**
 * Get men's top records
 * @param {number} [year] - Optional year filter
 * @returns {Promise<Object>} Men's records
 */
export async function getMenRecords(year = null) {
  const params = year ? { year } : {};
  return api.get('/api/results/men-records', params);
}

/**
 * Get women's top records
 * @param {number} [year] - Optional year filter
 * @returns {Promise<Object>} Women's records
 */
export async function getWomenRecords(year = null) {
  const params = year ? { year } : {};
  return api.get('/api/results/women-records', params);
}

/**
 * Get all races
 * @returns {Promise<Object>} List of all races
 */
export async function getAllRaces() {
  return api.get('/api/results/all-races');
}
