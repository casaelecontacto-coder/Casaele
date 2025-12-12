// Simple in-memory cache for admin check-status endpoint
// Cache TTL: 8 seconds (between 5-10 seconds as requested)

const cache = new Map();

// Cache entry structure: { data: any, expiresAt: number }

export function getCachedAdmin(email) {
  const entry = cache.get(email);
  if (!entry) return null;
  
  if (Date.now() > entry.expiresAt) {
    cache.delete(email);
    return null;
  }
  
  return entry.data;
}

export function setCachedAdmin(email, adminData) {
  const ttl = 8000; // 8 seconds
  cache.set(email, {
    data: adminData,
    expiresAt: Date.now() + ttl
  });
}

export function clearAdminCache(email) {
  if (email) {
    cache.delete(email);
  } else {
    cache.clear();
  }
}

// Clean up expired entries periodically (every 30 seconds)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now > entry.expiresAt) {
      cache.delete(key);
    }
  }
}, 30000);

