import { sendEmail } from '../config/nodemailer.js'

const REPLY_TO = process.env.WAITLIST_NOTIFY_EMAIL || 'casaelecontacto@gmail.com'

const esc = (v) => String(v || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

const firstName = (name) => String(name || '').trim().split(/\s+/)[0] || 'there'

/**
 * Sends the person who just signed up a short confirmation.
 * Fire-and-forget: a failure here must never affect the signup itself.
 * Replies go to the team inbox.
 */
export function sendSignupConfirmation({ to, name, subject, message }) {
  if (!to) return
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; background-color: #f4f4f4;">
      <div style="background-color: #AD1518; color: white; padding: 24px 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 26px;">Casa De ELE</h1>
      </div>
      <div style="padding: 28px 24px; background-color: white;">
        <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 14px;">Hi ${esc(firstName(name))},</p>
        <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0;">${esc(message)}</p>
        <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 24px 0 0;">You can reply to this email if you have any questions.</p>
      </div>
    </div>`
  sendEmail({
    from: process.env.EMAIL_USER,
    to,
    replyTo: REPLY_TO,
    subject,
    html
  }).catch((e) => console.error('Signup confirmation error:', e?.message || e))
}

export { firstName }
