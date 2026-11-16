import 'dotenv/config'

function required(name, fallback) {
  const value = process.env[name] ?? fallback
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

const nodeEnv = process.env.NODE_ENV ?? 'development'
const isProduction = nodeEnv === 'production'

// The frontend and API are deployed as separate origins (different Azure
// App Service apps, or a local dev server hitting a deployed API) — that
// makes every request "cross-site" from the browser's point of view, even
// though it's the same person using the same site conceptually. A
// SameSite=Lax cookie is NOT sent on cross-site fetch()/XHR calls (only on
// top-level navigations), so login would appear to succeed but the very
// next `GET /auth/me` would silently come back unauthenticated. SameSite=
// None + Secure fixes that for cross-site use, and only works over HTTPS —
// which is why it's tied to NODE_ENV=production (Azure serves everything
// over HTTPS by default; local dev is plain HTTP, where both the frontend
// and API are on "localhost" and count as same-site, so Lax is correct and
// required there — Chrome rejects SameSite=None without Secure entirely).
// Override with COOKIE_SAMESITE if you later put the frontend and API on
// the same origin (e.g. Express serving the built React app) and want to
// go back to the tighter Lax setting even in production.
const sameSite = process.env.COOKIE_SAMESITE || (isProduction ? 'none' : 'lax')

// SameSite=None still isn't enough on its own: it's only the *required*
// attribute for a cross-site cookie to be sendable at all — several
// browsers (Safari ITP, Firefox ETP strict mode, Brave, and Chrome's
// ongoing third-party-cookie phase-out, which is now on by default for a
// growing share of Chrome users) block or partition third-party cookies
// regardless of SameSite. That's exactly what produced the "logs in, says
// Redirecting…, then bounces back to a blank login form" report: the POST
// /auth/login response's Set-Cookie gets silently dropped by the browser,
// so the very next GET /auth/me has no cookie to send and comes back
// unauthenticated.
//
// The real fix is making the cookie first-party by putting the API on a
// subdomain of the SAME registrable domain as the frontend (e.g.
// api.uvaa.pro alongside test.uvaa.pro) and setting COOKIE_DOMAIN to the
// shared parent, e.g. ".uvaa.pro" — a leading dot makes the cookie valid
// for that domain and every subdomain of it, so it travels with requests
// to api.uvaa.pro from a page served at test.uvaa.pro (or any future
// uvaa.pro subdomain) as an ordinary first-party cookie, unaffected by any
// of the third-party-cookie blocking above. Leave COOKIE_DOMAIN unset
// (the default) until that subdomain exists — setting a Domain the browser
// doesn't recognise as covering the API's actual host makes the browser
// reject the cookie outright, which is worse than the current behaviour.
const cookieDomain = process.env.COOKIE_DOMAIN || undefined

export const config = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv,
  isProduction,

  databaseUrl: required('DATABASE_URL'),
  dbSsl: (process.env.DB_SSL ?? 'true') === 'true',

  frontendOrigin: required('FRONTEND_ORIGIN', 'http://localhost:5173'),

  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '12h',
  jwtExpiresInRemember: process.env.JWT_EXPIRES_IN_REMEMBER ?? '30d',
  cookieName: 'uvaa_session',
  sessionCookieOptions: {
    httpOnly: true,
    secure: sameSite === 'none' ? true : isProduction, // SameSite=None requires Secure
    sameSite,
    path: '/',
    ...(cookieDomain ? { domain: cookieDomain } : {}),
  },

  appVerifyUrlBase: required('APP_VERIFY_URL_BASE', 'http://localhost:5173/verify'),
  appResetPasswordUrlBase: required('APP_RESET_PASSWORD_URL_BASE', 'http://localhost:5173/reset-password'),

  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT ?? 587),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'UVAA <no-reply@uvaa.example.com>',
  },
}
