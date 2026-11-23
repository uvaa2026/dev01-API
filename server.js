import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { config } from './src/config.js'
import { authRouter } from './src/routes/auth.js'
import { assessmentRouter } from './src/routes/assessment.js'
import { adminRouter } from './src/routes/admin.js'
import { organisationsRouter } from './src/routes/organisations.js'
import { orgAdminRouter } from './src/routes/orgAdmin.js'
import { contactRouter } from './src/routes/contact.js'

const app = express()

// Azure App Service (and most PaaS hosts) terminate HTTPS at a reverse
// proxy in front of the app, then forward plain HTTP internally. Without
// this, req.protocol/req.secure would report "http" even on a real HTTPS
// request, which matters for anything that branches on it later (redirects,
// secure-cookie logic elsewhere, request logging).
app.set('trust proxy', 1)

// Dynamic origin check instead of a single static string — multiple real
// frontends (test site + production site, possibly more later) now share
// this one API, so we need to allow a short, explicit list of exact
// origins rather than one hardcoded value. See config.frontendOrigins.
app.use(cors({
  origin(origin, callback) {
    // No Origin header means it's not a browser cross-origin request at all
    // (curl, server-to-server health checks, same-origin requests) — CORS
    // only governs browser behavior, so there's nothing to restrict here.
    if (!origin || config.frontendOrigins.includes(origin)) {
      return callback(null, true)
    }
    return callback(new Error(`Origin ${origin} is not allowed by CORS`))
  },
  credentials: true,
}))
app.use(express.json())
app.use(cookieParser())

app.get('/health', (req, res) => res.json({ ok: true }))

app.use('/auth', authRouter)
app.use('/assessment', assessmentRouter)
app.use('/admin', adminRouter)
app.use('/org', organisationsRouter)
app.use('/org-admin', orgAdminRouter)
app.use('/contact', contactRouter)

// Centralised error handler — catches anything thrown/rejected inside a
// route that wasn't already handled, so a bug returns a clean 500 instead
// of an unhandled-rejection crash or a raw stack trace to the client.
app.use((err, req, res, _next) => {
  console.error(err)
  res.status(500).json({ message: 'Unexpected server error.' })
})

app.listen(config.port, () => {
  console.log(`UVAA API listening on http://localhost:${config.port}`)
})
