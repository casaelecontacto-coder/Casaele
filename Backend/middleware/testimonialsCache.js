/**
 * In-memory cache for /api/testimonials/approved endpoint
 * Cache TTL: 45 seconds (between 30-60s as requested)
 * Cache key: "testimonials-approved"
 */

const cache = {
  data: null,
  expiresAt: null
};

const CACHE_TTL = 45000; // 45 seconds in milliseconds

/**
 * Get cached approved testimonials
 * @returns {Array|null} - Cached data or null if not found/expired
 */
export function getCachedTestimonials() {
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
 * Set cached approved testimonials
 * @param {Array} data - Testimonials array
 */
export function setCachedTestimonials(data) {
  cache.data = data;
  cache.expiresAt = Date.now() + CACHE_TTL;
}

/**
 * Clear testimonials cache
 */
export function clearTestimonialsCache() {
  cache.data = null;
  cache.expiresAt = null;
}

