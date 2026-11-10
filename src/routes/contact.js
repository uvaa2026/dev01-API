import { Router } from 'express'
import { pool } from '../db.js'
import { sendContactInquiryEmail } from '../lib/email.js'
import { contactSchema, formatZodError } from '../lib/validation.js'
import { rateLimit } from '../middleware/rateLimit.js'
import { asyncHandler } from '../lib/asyncHandler.js'

export const contactRouter = Router()

// Fully public, unauthenticated, no cohort code — anyone who can reach
// Home's #contact section can submit this. The rate limit is the only
// defence against it being spammed; mirrors organisations.js's
// lookupLimiter in shape.
const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many inquiries from this address. Please wait a while and try again, or write to us directly.',
})

// ---------------------------------------------------------------------------
// POST /contact
//   Home's "Let's start a conversation" form (Welcome.jsx #contact).
//   Stores the inquiry (migration 025_contact_inquiries.sql) and emails
//   sayee@dheemerconsulting.com. The row is kept even if the notification
//   email fails — notified_at just stays NULL — so no inquiry is silently
//   lost to an SMTP hiccup.
// ---------------------------------------------------------------------------
contactRouter.post('/', submitLimiter, asyncHandler(async (req, res) => {
  const parsed = contactSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({
      message: 'Some details are missing or invalid.',
      errors: formatZodError(parsed.error),
    })
  }
  const data = parsed.data

  const result = await pool.query(
    `INSERT INTO contact_inquiries (full_name, work_email, organisation, role, interest, message)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING inquiry_id`,
    [data.fullName, data.workEmail, data.organisation, data.role, data.interest, data.message || null],
  )
  const inquiryId = result.rows[0].inquiry_id

  try {
    await sendContactInquiryEmail(data)
    await pool.query(`UPDATE contact_inquiries SET notified_at = now() WHERE inquiry_id = $1`, [inquiryId])
  } catch (err) {
    // The inquiry is already saved — a failed notification email shouldn't
    // turn into a 500 for the person submitting the form. Logged so it's
    // visible in server logs; notified_at is left NULL as the durable sign
    // that this one still needs a human to check.
    console.error('Failed to send contact inquiry notification email', err)
  }

  res.status(201).json({ message: 'Thank you for reaching out to UVAA. Your inquiry has been received.' })
}))
