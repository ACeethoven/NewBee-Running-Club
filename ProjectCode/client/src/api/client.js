/**
 * Centralized API client with environment-based URL configuration
 * and consistent error handling.
 */

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Base fetch wrapper with error handling
 * @param {string} endpoint - API endpoint (relative path)
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} - Response data
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const { headers: optionHeaders, ...restOptions } = options;

  const config = {
    ...restOptions,
    headers: {
      'Content-Type': 'application/json',
      ...optionHeaders,
    },
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      let errorData = null;
      try {
        errorData = await response.json();
      } catch {
        // Response body is not JSON
      }
      throw new ApiError(
        errorData?.message || `Request failed with status ${response.status}`,
        response.status,
        errorData
      );
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    return await response.text();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network error or other fetch error
    throw new ApiError(error.message || 'Network error', 0);
  }
}

/**
 * API client with convenience methods
 */
export const api = {
  /**
   * GET request
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Query parameters
   * @param {Object} headers - Additional headers
   * @returns {Promise<any>}
   */
  get: (endpoint, params = {}, headers = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return request(url, { method: 'GET', headers });
  },

  /**
   * POST request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body
   * @param {Object} headers - Additional headers
   * @returns {Promise<any>}
   */
  post: (endpoint, data, headers = {}) => {
    return request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      headers,
    });
  },

  /**
   * PUT request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body
   * @param {Object} headers - Additional headers
   * @returns {Promise<any>}
   */
  put: (endpoint, data, headers = {}) => {
    return request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers,
    });
  },

  /**
   * DELETE request
   * @param {string} endpoint - API endpoint
   * @param {Object} headers - Additional headers
   * @returns {Promise<any>}
   */
  delete: (endpoint, headers = {}) => {
    return request(endpoint, { method: 'DELETE', headers });
  },
};

export default api;
