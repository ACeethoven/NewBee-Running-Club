/**
 * Records API functions
 */

import { api } from './client';

/**
 * Get available years for race records
 * @returns {Promise<{years: number[]}>}
 */
export async function getAvailableYears() {
  return api.get('/api/results/available-years');
}

/**
 * Get men's race records
 * @param {number|null} year - Optional year filter
 * @returns {Promise<{men_records: Array}>}
 */
export async function getMenRecords(year = null) {
  const params = year ? { year } : {};
  return api.get('/api/results/men-records', params);
}

/**
 * Get women's race records
 * @param {number|null} year - Optional year filter
 * @returns {Promise<{women_records: Array}>}
 */
export async function getWomenRecords(year = null) {
  const params = year ? { year } : {};
  return api.get('/api/results/women-records', params);
}

/**
 * Get all race names
 * @returns {Promise<{races: string[]}>}
 */
export async function getAllRaces() {
  return api.get('/api/results/all-races');
}
