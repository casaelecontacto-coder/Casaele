/**
 * In-memory cache for CMS lookups
 * Cache TTL: 45 seconds (between 30–60s as requested)
 * Cache key format: "cms:slug:{slug}"
 */

const cache = new Map();

// Cache entry structure: { data, expiresAt }
const CACHE_TTL = 45_000; // 45 seconds in milliseconds

/**
 * Get cached CMS data by slug
 * IMPORTANT:
 *  - returns `undefined` → cache miss (not cached or expired)
 *  - returns `null`      → cached 404 (slug not found)
 *  - returns object      → cached CMS data
 *
 * @param {string} slug - CMS slug
 * @returns {any|undefined}
 */
export function getCachedCms(slug) {
  const key = `cms:slug:${slug}`;
  const entry = cache.get(key);

  // Cache miss
  if (!entry) {
    return undefined;
  }

  // Expired entry
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return undefined;
  }

  // Can be object OR null (cached 404)
  return entry.data;
}

/**
 * Set cached CMS data by slug
 * Pass `null` as data to cache a 404 response
 *
 * @param {string} slug - CMS slug
 * @param {object|null} data - CMS page data or null for 404
 */
export function setCachedCms(slug, data) {
  const key = `cms:slug:${slug}`;

  cache.set(key, {
    data,
    expiresAt: Date.now() + CACHE_TTL
  });
}

/**
 * Clear cache for a specific slug or clear all CMS cache
 *
 * @param {string|null} slug - Slug to clear, or null to clear all
 */
export function clearCmsCache(slug = null) {
  if (slug) {
    cache.delete(`cms:slug:${slug}`);
    return;
  }

  // Clear all CMS cache entries
  for (const key of cache.keys()) {
    if (key.startsWith("cms:slug:")) {
      cache.delete(key);
    }
  }
}

/**
 * Periodic cleanup of expired cache entries
 * Runs every 60 seconds
 */
setInterval(() => {
  const now = Date.now();

  for (const [key, entry] of cache.entries()) {
    if (now > entry.expiresAt) {
      cache.delete(key);
    }
  }
}, 60_000);
