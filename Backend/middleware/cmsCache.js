/**
 * In-memory cache for CMS lookups
 * Cache TTL: 45 seconds (between 30-60s as requested)
 * Cache key format: "cms:slug:{slug}"
 */

const cache = new Map();

// Cache entry structure: { data, expiresAt }
const CACHE_TTL = 45000; // 45 seconds in milliseconds

/**
 * Get cached CMS data by slug
 * @param {string} slug - CMS slug
 * @returns {object|null} - Cached data or null if not found/expired
 */
export function getCachedCms(slug) {
  const key = `cms:slug:${slug}`;
  const entry = cache.get(key);
  
  if (!entry) {
    return null;
  }

  // Check if expired
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }

  return entry.data;
}

/**
 * Set cached CMS data by slug
 * @param {string} slug - CMS slug
 * @param {object} data - CMS page data
 */
export function setCachedCms(slug, data) {
  const key = `cms:slug:${slug}`;
  cache.set(key, {
    data: data,
    expiresAt: Date.now() + CACHE_TTL
  });
}

/**
 * Clear cache for specific slug or all CMS cache
 * @param {string|null} slug - Slug to clear, or null to clear all
 */
export function clearCmsCache(slug = null) {
  if (slug) {
    const key = `cms:slug:${slug}`;
    cache.delete(key);
  } else {
    // Clear all CMS cache entries
    for (const key of cache.keys()) {
      if (key.startsWith('cms:slug:')) {
        cache.delete(key);
      }
    }
  }
}

/**
 * Cleanup expired cache entries periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now > entry.expiresAt) {
      cache.delete(key);
    }
  }
}, 60000); // Run cleanup every 60 seconds

