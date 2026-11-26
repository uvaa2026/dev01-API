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
    text: `Hi ${fullName},\n\nVerify your email to activate your UVAA account:\n${verifyUrl}\n\nThis link expires in 24 hours.\n\nIf you didn't request this, you can ignore this email.\n\nRegards,\nTeam UVAA`,
    html: `
      <p>Hi ${escapeHtml(fullName)},</p>
      <p>Verify your email to activate your UVAA account:</p>
      <p><a href="${verifyUrl}">${verifyUrl}</a></p>
      <p>This link expires in 24 hours.</p>
      <p>If you didn't request this, you can ignore this email.</p>
      <p>Regards,<br>Team UVAA</p>
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
    text: `Hi ${fullName},\n\n${orgName} is now verified on UVAA. Share this cohort code with your participants so they can register:\n\n${cohortCode}\n\nThey'll enter it, along with their own email address, on the UVAA registration page. Keep this code only as private as your registration settings require — anyone who does not have a matching work-email domain configured will be able to register with just this code.\n\nRegards,\nTeam UVAA`,
    html: `
      <p>Hi ${escapeHtml(fullName)},</p>
      <p><strong>${escapeHtml(orgName)}</strong> is now verified on UVAA. Share this cohort code with your participants so they can register:</p>
      <p style="font-size: 20px; font-weight: bold; letter-spacing: 2px;">${escapeHtml(cohortCode)}</p>
      <p>They'll enter it, along with their own email address, on the UVAA registration page.</p>
      <p>Regards,<br>Team UVAA</p>
    `,
  })

  if (!config.smtp.host) {
    console.log(`\n[dev email] SMTP not configured — cohort code for ${to}`)
    console.log(`[dev email] ${orgName}: ${cohortCode}\n`)
  }

  return info
}

export async function sendPasswordResetEmail({ to, fullName, resetUrl }) {
  const info = await getTransporter().sendMail({
    from: config.smtp.from,
    to,
    subject: 'Reset your UVAA password',
    text: `Hi ${fullName},\n\nWe received a request to reset your UVAA password. Choose a new password here:\n${resetUrl}\n\nThis link expires in 60 minutes and can only be used once.\n\nIf you didn't request this, you can ignore this email — your password will not change.\n\nRegards,\nTeam UVAA`,
    html: `
      <p>Hi ${escapeHtml(fullName)},</p>
      <p>We received a request to reset your UVAA password. Choose a new password here:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>This link expires in 60 minutes and can only be used once.</p>
      <p>If you didn't request this, you can ignore this email — your password will not change.</p>
      <p>Regards,<br>Team UVAA</p>
    `,
  })

  if (!config.smtp.host) {
    console.log(`\n[dev email] SMTP not configured — password reset link for ${to}`)
    console.log(`[dev email] ${resetUrl}\n`)
  }

  return info
}

// Notifies the Org Admin that a new participant has registered under a
// MANUAL-approval organisation and is sitting in PENDING until they decide
// — without this, nothing tells the Admin a registration needs their
// attention; they'd only find out by happening to open the dashboard.
// Fired once, right after the participant's own verification email, from
// POST /auth/register (see routes/auth.js) — only when the registration
// actually came out PENDING (an AUTOMATIC-approval org, or the Org Admin
// registering themselves, never triggers this).
export async function sendPendingApprovalEmail({ to, orgName, participantName, participantEmail, dashboardUrl }) {
  const info = await getTransporter().sendMail({
    from: config.smtp.from,
    to,
    subject: `${participantName} is awaiting your approval — ${orgName}`,
    text: `Hi,\n\n${participantName} (${participantEmail}) has registered for ${orgName}'s UVAA cohort and needs your approval before they can log in and start the assessment.\n\nReview and approve or reject them from your Admin dashboard:\n${dashboardUrl}\n\nRegards,\nTeam UVAA`,
    html: `
      <p>Hi,</p>
      <p><strong>${escapeHtml(participantName)}</strong> (${escapeHtml(participantEmail)}) has registered for <strong>${escapeHtml(orgName)}</strong>'s UVAA cohort and needs your approval before they can log in and start the assessment.</p>
      <p>Review and approve or reject them from your Admin dashboard:</p>
      <p><a href="${dashboardUrl}">${dashboardUrl}</a></p>
      <p>Regards,<br>Team UVAA</p>
    `,
  })

  if (!config.smtp.host) {
    console.log(`\n[dev email] SMTP not configured — pending-approval notice for ${to} (participant: ${participantEmail})\n`)
  }

  return info
}

// Tells a participant their registration has been approved and they can now
// log in — without this, a MANUAL-approval org's participant has no signal
// at all that their PENDING status changed; they'd only find out by trying
// to log in again speculatively, with nothing to tell them when to try.
// Fired from PATCH /org-admin/participants/:id/approve (see
// routes/orgAdmin.js), only on an APPROVE decision — a REJECT sends
// nothing, since that path isn't something to invite them to act on.
export async function sendParticipantApprovedEmail({ to, fullName, orgName, loginUrl }) {
  const info = await getTransporter().sendMail({
    from: config.smtp.from,
    to,
    subject: "You're approved — start your UVAA assessment",
    text: `Hi ${fullName},\n\nYour registration with ${orgName} has been approved. You can now log in and start your UVAA assessment:\n${loginUrl}\n\nRegards,\nTeam UVAA`,
    html: `
      <p>Hi ${escapeHtml(fullName)},</p>
      <p>Your registration with <strong>${escapeHtml(orgName)}</strong> has been approved. You can now log in and start your UVAA assessment:</p>
      <p><a href="${loginUrl}">${loginUrl}</a></p>
      <p>Regards,<br>Team UVAA</p>
    `,
  })

  if (!config.smtp.host) {
    console.log(`\n[dev email] SMTP not configured — approval notice for ${to}\n`)
  }

  return info
}

// Notifies the UVAA team of a new inquiry from Home's public Contact form
// (#contact) — there's no admin inbox view for contact_inquiries yet, so
// this email (plus the row itself, see migration 025) is the actual
// notification. Unlike the functions above, this one is To the UVAA team,
// not the person who filled the form — fullName/workEmail/etc. are the
// inquirer's details, presented for the team to act on.
export async function sendContactInquiryEmail({ fullName, workEmail, organisation, role, interest, message }) {
  const to = 'connect@uvaa.pro'
  const info = await getTransporter().sendMail({
    from: config.smtp.from,
    to,
    replyTo: workEmail,
    subject: `New UVAA inquiry — ${organisation}`,
    text: `New inquiry from the UVAA Home contact form.\n\nName: ${fullName}\nWork email: ${workEmail}\nOrganisation: ${organisation}\nRole: ${role}\nInterested in: ${interest}\n\nMessage:\n${message || '(none)'}\n`,
    html: `
      <p>New inquiry from the UVAA Home contact form.</p>
      <table cellpadding="4" cellspacing="0">
        <tr><td><strong>Name</strong></td><td>${escapeHtml(fullName)}</td></tr>
        <tr><td><strong>Work email</strong></td><td><a href="mailto:${escapeHtml(workEmail)}">${escapeHtml(workEmail)}</a></td></tr>
        <tr><td><strong>Organisation</strong></td><td>${escapeHtml(organisation)}</td></tr>
        <tr><td><strong>Role</strong></td><td>${escapeHtml(role)}</td></tr>
        <tr><td><strong>Interested in</strong></td><td>${escapeHtml(interest)}</td></tr>
      </table>
      <p><strong>Message</strong></p>
      <p>${message ? escapeHtml(message).replaceAll('\n', '<br>') : '(none)'}</p>
    `,
  })

  if (!config.smtp.host) {
    console.log(`\n[dev email] SMTP not configured — contact inquiry from ${workEmail} (${organisation})\n`)
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
