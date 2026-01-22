/**
 * Race Results API functions
 */

import { api } from './client';

/**
 * Get race results for a member by NYRR ID or name
 * @param {string} searchKey - Member's NYRR ID or display name
 * @param {Object} [options] - Optional parameters for more precise matching
 * @param {string} [options.gender] - "M" or "F" for gender_age matching
 * @param {number} [options.birth_year] - Birth year for gender_age calculation
 * @returns {Promise<Object>} Race results and statistics
 */
export async function getMemberRaceResults(searchKey, options = {}) {
  const params = {};
  if (options.gender) params.gender = options.gender;
  if (options.birth_year) params.birth_year = options.birth_year;
  return api.get(`/api/results/member/${encodeURIComponent(searchKey)}`, params);
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
