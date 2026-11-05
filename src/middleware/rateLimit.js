// Minimal, dependency-free IP-based rate limiter (fixed window). Written
// without a package (e.g. express-rate-limit) on purpose — adding a new
// dependency means this can't deploy until someone runs `npm install` on
// the server first, and this way it ships with the next git pull like
// everything else.
//
// Caveat: state lives in this process's memory. On the current
// single-instance deployment that's a real limit; if this API is ever
// scaled out to multiple instances behind a load balancer, each instance
// tracks its own counts independently, so the effective limit becomes
// (max * instance count). Swap the Map below for a shared store (e.g.
// Redis) if that ever happens.
//
// `trust proxy` is already set in server.js, so req.ip reflects the real
// client address behind Azure's reverse proxy rather than the proxy's own
// address — required for this to key on the actual caller instead of
// treating every request as coming from the same IP.
const buckets = new Map()

/**
 * @param {{ windowMs: number, max: number, message?: string }} opts
 * @returns an Express middleware that 429s once `max` requests from the
 *   same IP land inside the same `windowMs` window.
 */
export function rateLimit({ windowMs, max, message }) {
  return function rateLimitMiddleware(req, res, next) {
    const key = req.ip || 'unknown'
    const now = Date.now()

    let bucket = buckets.get(key)
    if (!bucket || now >= bucket.resetAt) {
      bucket = { count: 0, resetAt: now + windowMs }
      buckets.set(key, bucket)
    }
    bucket.count += 1

    if (bucket.count > max) {
      res.set('Retry-After', String(Math.ceil((bucket.resetAt - now) / 1000)))
      return res.status(429).json({
        message: message || 'Too many requests. Please wait a while and try again.',
      })
    }
    return next()
  }
}

// Periodic sweep so `buckets` doesn't grow unbounded with one-off callers
// that never come back. unref() so this timer never keeps the process
// alive by itself (doesn't block a clean shutdown).
setInterval(() => {
  const now = Date.now()
  for (const [key, bucket] of buckets) {
    if (now >= bucket.resetAt) buckets.delete(key)
  }
}, 10 * 60 * 1000).unref()
