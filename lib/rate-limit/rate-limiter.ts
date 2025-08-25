/**
 * Simple rate limiting - removed Redis dependency
 * Using in-memory storage for simplicity
 */

const attempts = new Map<string, { count: number; resetAt: number }>()

export async function rateLimit(identifier: string, limit: number = 10, window: number = 60000) {
  const now = Date.now()
  const record = attempts.get(identifier)
  
  if (!record || record.resetAt < now) {
    attempts.set(identifier, { count: 1, resetAt: now + window })
    return { success: true, remaining: limit - 1 }
  }
  
  if (record.count >= limit) {
    return { success: false, remaining: 0 }
  }
  
  record.count++
  return { success: true, remaining: limit - record.count }
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of attempts.entries()) {
    if (value.resetAt < now) {
      attempts.delete(key)
    }
  }
}, 60000) // Clean every minute