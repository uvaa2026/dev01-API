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
  },

  appVerifyUrlBase: required('APP_VERIFY_URL_BASE', 'http://localhost:5173/verify'),

  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT ?? 587),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'UVAA <no-reply@uvaa.example.com>',
  },
}
