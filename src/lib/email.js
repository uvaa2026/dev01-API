import nodemailer from 'nodemailer'
import { config } from '../config.js'

let transporter

function getTransporter() {
  if (transporter) return transporter

  if (config.smtp.host) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
    })
  } else {
    // No SMTP configured — fall back to a transport that doesn't actually
    // send anything. Registration still works end-to-end in dev/test; the
    // verification link is printed to the server console instead of
    // landing in an inbox. Point SMTP_HOST/SMTP_USER/SMTP_PASS (or
    // whichever provider you pick — Azure Communication Services Email,
    // SendGrid, plain SMTP) at a real account to start sending for real.
    transporter = nodemailer.createTransport({ jsonTransport: true })
  }

  return transporter
}

export async function sendVerificationEmail({ to, fullName, verifyUrl }) {
  const info = await getTransporter().sendMail({
    from: config.smtp.from,
    to,
    subject: 'Verify your email for UVAA',
    text: `Hi ${fullName},\n\nVerify your email to activate your UVAA account:\n${verifyUrl}\n\nThis link expires in 24 hours.\n\nIf you didn't request this, you can ignore this email.`,
    html: `
      <p>Hi ${escapeHtml(fullName)},</p>
      <p>Verify your email to activate your UVAA account:</p>
      <p><a href="${verifyUrl}">${verifyUrl}</a></p>
      <p>This link expires in 24 hours.</p>
      <p>If you didn't request this, you can ignore this email.</p>
    `,
  })

  if (!config.smtp.host) {
    console.log(`\n[dev email] SMTP not configured — verification link for ${to}`)
    console.log(`[dev email] ${verifyUrl}\n`)
  }

  return info
}

export async function sendCohortCodeEmail({ to, fullName, orgName, cohortCode }) {
  const info = await getTransporter().sendMail({
    from: config.smtp.from,
    to,
    subject: `${orgName}'s UVAA cohort code is ready`,
    text: `Hi ${fullName},\n\n${orgName} is now verified on UVAA. Share this cohort code with your participants so they can register:\n\n${cohortCode}\n\nThey'll enter it, along with their own email address, on the UVAA registration page. Keep this code only as private as your registration settings require — anyone who does not have a matching work-email domain configured will be able to register with just this code.`,
    html: `
      <p>Hi ${escapeHtml(fullName)},</p>
      <p><strong>${escapeHtml(orgName)}</strong> is now verified on UVAA. Share this cohort code with your participants so they can register:</p>
      <p style="font-size: 20px; font-weight: bold; letter-spacing: 2px;">${escapeHtml(cohortCode)}</p>
      <p>They'll enter it, along with their own email address, on the UVAA registration page.</p>
    `,
  })

  if (!config.smtp.host) {
    console.log(`\n[dev email] SMTP not configured — cohort code for ${to}`)
    console.log(`[dev email] ${orgName}: ${cohortCode}\n`)
  }

  return info
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}
