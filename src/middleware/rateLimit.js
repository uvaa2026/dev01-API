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
// (max * instance count). Swap the per-limiter Map below for a shared
// store (e.g. Redis) if that ever happens.
//
// `trust proxy` is already set in server.js, so req.ip reflects the real
// client address behind Azure's reverse proxy rather than the proxy's own
// address — required for this to key on the actual caller instead of
// treating every request as coming from the same IP.
//
// IMPORTANT: each call to rateLimit({...}) below gets its OWN `buckets`
// Map, created fresh inside this function rather than shared at module
// scope. Every route that wants a limiter (login, forgot-password, cohort
// lookup, contact form, ...) calls rateLimit() separately, and on a shared
// office/campus IP (NAT, corporate proxy) those routes see a lot of
// unrelated traffic from the same address in a short window. A single
// shared Map keyed only by IP meant a login attempt, a cohort-code lookup,
// and a forgot-password click from that IP all incremented the exact same
// counter — so a route with a low `max` (forgot-password's is 5) could
// trip from traffic against a *completely different* route, blocking a
// person who had only ever made one request of the kind they actually
// tried. Giving each limiter instance its own Map keeps counts scoped to
// the route it actually guards.
export function rateLimit({ windowMs, max, message }) {
  const buckets = new Map()

  // Periodic sweep so this limiter's buckets don't grow unbounded with
  // one-off callers that never come back. unref() so this timer never
  // keeps the process alive by itself (doesn't block a clean shutdown).
  setInterval(() => {
    const now = Date.now()
    for (const [key, bucket] of buckets) {
      if (now >= bucket.resetAt) buckets.delete(key)
    }
  }, 10 * 60 * 1000).unref()

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
