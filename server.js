import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { config } from './src/config.js'
import { authRouter } from './src/routes/auth.js'
import { assessmentRouter } from './src/routes/assessment.js'
import { adminRouter } from './src/routes/admin.js'

const app = express()

// Azure App Service (and most PaaS hosts) terminate HTTPS at a reverse
// proxy in front of the app, then forward plain HTTP internally. Without
// this, req.protocol/req.secure would report "http" even on a real HTTPS
// request, which matters for anything that branches on it later (redirects,
// secure-cookie logic elsewhere, request logging).
app.set('trust proxy', 1)

app.use(cors({ origin: config.frontendOrigin, credentials: true }))
app.use(express.json())
app.use(cookieParser())

app.get('/health', (req, res) => res.json({ ok: true }))

app.use('/auth', authRouter)
app.use('/assessment', assessmentRouter)
app.use('/admin', adminRouter)

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
