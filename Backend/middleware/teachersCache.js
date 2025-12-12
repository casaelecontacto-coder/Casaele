/**
 * In-memory cache for /api/teachers endpoint
 * Cache TTL: 60 seconds
 * Cache key: "teachers-list"
 */

const cache = {
  data: null,
  expiresAt: null
};

const CACHE_TTL = 60000; // 60 seconds in milliseconds

/**
 * Get cached teachers list
 * @returns {Array|null} - Cached data or null if not found/expired
 */
export function getCachedTeachers() {
  if (!cache.data || !cache.expiresAt) {
    return null;
  }

  // Check if expired
  if (Date.now() > cache.expiresAt) {
    cache.data = null;
    cache.expiresAt = null;
    return null;
  }

  return cache.data;
}

/**
 * Set cached teachers list
 * @param {Array} data - Teachers array
 */
export function setCachedTeachers(data) {
  cache.data = data;
  cache.expiresAt = Date.now() + CACHE_TTL;
}

/**
 * Clear teachers cache
 */
export function clearTeachersCache() {
  cache.data = null;
  cache.expiresAt = null;
}

