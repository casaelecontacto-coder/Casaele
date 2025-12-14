/**
 * In-memory cache for /api/picks endpoint
 * Cache TTL: 45 seconds (between 30-60s as requested)
 * Cache key: "picks-active"
 */

const cache = {
  data: null,
  expiresAt: null
};

const CACHE_TTL = 45000; // 45 seconds in milliseconds

/**
 * Get cached picks list
 * @returns {Array|null} - Cached data or null if not found/expired
 */
export function getCachedPicks() {
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
 * Set cached picks list
 * @param {Array} data - Picks array
 */
export function setCachedPicks(data) {
  cache.data = data;
  cache.expiresAt = Date.now() + CACHE_TTL;
}

/**
 * Clear picks cache
 */
export function clearPicksCache() {
  cache.data = null;
  cache.expiresAt = null;
}

