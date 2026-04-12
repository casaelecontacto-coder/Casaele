/**
 * In-memory cache for /api/home-slides endpoint
 * Cache TTL: 45 seconds
 */

const cache = {
  data: null,
  expiresAt: null
};

const CACHE_TTL = 45000;

export function getCachedHomeSlides() {
  if (!cache.data || !cache.expiresAt) {
    return null;
  }

  if (Date.now() > cache.expiresAt) {
    cache.data = null;
    cache.expiresAt = null;
    return null;
  }

  return cache.data;
}

export function setCachedHomeSlides(data) {
  cache.data = data;
  cache.expiresAt = Date.now() + CACHE_TTL;
}

export function clearHomeSlidesCache() {
  cache.data = null;
  cache.expiresAt = null;
}
