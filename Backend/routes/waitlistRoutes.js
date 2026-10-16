import express from 'express'
import WaitlistEntry from '../models/WaitlistEntry.js'
import { verifyAdminAccess } from '../middleware/superAdminAuth.js'
import { sendEmail } from '../config/nodemailer.js'
import { sendSignupConfirmation } from '../services/signupConfirmationEmail.js'

const router = express.Router()

const NOTIFY_EMAIL = process.env.WAITLIST_NOTIFY_EMAIL || 'casaelecontacto@gmail.com'

const esc = (v) => String(v || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

const list = (arr, other) => [...(arr || []), ...(other ? [`Other: ${other}`] : [])].join(' · ')

// Fire-and-forget: a mail failure must never fail the visitor's signup.
const notifyNewEntry = (entry) => {
  const rows = [
    ['Name', entry.name],
    ['Email', entry.email],
    ['WhatsApp', entry.whatsapp],
    ['Age', entry.age],
    ['Course', entry.course],
    ['Relationship with Spanish', entry.relationship],
    ['How Spanish entered their life', list(entry.origin, entry.originOther)],
    ['In six months they want to', list(entry.goals, entry.goalsOther)],
    ['Biggest struggle', list(entry.struggles, entry.strugglesOther)],
    ['About them', entry.about]
  ]
  sendEmail({
    from: process.env.EMAIL_USER,
    to: NOTIFY_EMAIL,
    subject: `New waiting list signup: ${entry.name}${entry.course ? ` (${entry.course})` : ''}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px;">
        <h2 style="color:#AD1518;margin:0 0 12px">New waiting list signup</h2>
        ${rows.map(([k, v]) => `<p style="margin:6px 0"><strong>${esc(k)}:</strong> ${esc(v) || '-'}</p>`).join('')}
        <p style="margin:16px 0 0;color:#666;font-size:13px">See everyone in the admin panel under Waiting List.</p>
      </div>`
  }).catch((e) => console.error('Waitlist notify error:', e?.message || e))
}

const str = (v, max = 200) => String(v || '').trim().slice(0, max)
const strList = (v) => (Array.isArray(v) ? v : []).map((x) => str(x, 200)).filter(Boolean).slice(0, 12)

// Public: join the waiting list
router.post('/', async (req, res) => {
  try {
    const body = req.body || {}
    const { name, email, course } = body
    if (!name || !email) {
      return res.status(400).json({ message: 'name and email are required' })
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(String(email).trim())) {
      return res.status(400).json({ message: 'Please provide a valid email address' })
    }
    const cleanEmail = String(email).trim().slice(0, 200).toLowerCase()
    const cleanCourse = String(course || '').trim().slice(0, 120)

    // One signup per email, whatever the course: no duplicate row and no
    // second notification.
    const existing = await WaitlistEntry.findOne({ email: cleanEmail })
    if (existing) {
      return res.status(409).json({ message: 'This email is already on the waiting list.' })
    }

    const created = await WaitlistEntry.create({
      name: String(name).trim().slice(0, 120),
      email: cleanEmail,
      course: String(course || '').trim().slice(0, 120),
      whatsapp: str(body.whatsapp, 40),
      age: str(body.age, 10),
      relationship: str(body.relationship),
      origin: strList(body.origin),
      originOther: str(body.originOther, 1000),
      goals: strList(body.goals),
      goalsOther: str(body.goalsOther, 1000),
      struggles: strList(body.struggles),
      strugglesOther: str(body.strugglesOther, 1000),
      about: str(body.about, 3000)
    })
    notifyNewEntry(created)
    sendSignupConfirmation({
      to: created.email,
      name: created.name,
      subject: "You're on the waiting list",
      message: `You're on the waiting list${created.course ? ` for the Casa de ELE ${created.course} course` : ''}. Keep an eye on your inbox. We'll be in touch with updates about the course and what's coming next.`
    })
    res.status(201).json({ success: true, id: created._id })
  } catch (e) {
    console.error('Waitlist submit error:', e?.message || e)
    res.status(500).json({ message: 'Failed to join the waiting list' })
  }
})

// Admin: list everyone on the waiting list
router.get('/', verifyAdminAccess, async (req, res) => {
  try {
    const items = await WaitlistEntry.find().sort({ createdAt: -1 })
    res.json(items)
  } catch (e) {
    console.error('Waitlist list error:', e?.message || e)
    res.status(500).json({ message: 'Failed to fetch the waiting list' })
  }
})

// Admin: mark contacted / back to waiting
router.put('/:id/status', verifyAdminAccess, async (req, res) => {
  const status = req.body?.status
  if (!['waiting', 'contacted'].includes(status)) {
    return res.status(400).json({ message: 'status must be waiting or contacted' })
  }
  const updated = await WaitlistEntry.findByIdAndUpdate(req.params.id, { status }, { new: true })
  if (!updated) return res.status(404).json({ message: 'Not found' })
  res.json(updated)
})

// Admin: delete
router.delete('/:id', verifyAdminAccess, async (req, res) => {
  const deleted = await WaitlistEntry.findByIdAndDelete(req.params.id)
  if (!deleted) return res.status(404).json({ message: 'Not found' })
  res.json({ success: true })
})

export default router
