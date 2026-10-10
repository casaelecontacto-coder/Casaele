import express from 'express'
import WaitlistEntry from '../models/WaitlistEntry.js'
import { verifyAdminAccess } from '../middleware/superAdminAuth.js'
import { sendEmail } from '../config/nodemailer.js'

const router = express.Router()

const NOTIFY_EMAIL = process.env.WAITLIST_NOTIFY_EMAIL || 'casaelecontacto@gmail.com'

const esc = (v) => String(v || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

// Fire-and-forget: a mail failure must never fail the visitor's signup.
const notifyNewEntry = (entry) => {
  sendEmail({
    from: process.env.EMAIL_USER,
    to: NOTIFY_EMAIL,
    subject: `New waiting list signup: ${entry.name}${entry.course ? ` (${entry.course})` : ''}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px;">
        <h2 style="color:#AD1518;margin:0 0 12px">New waiting list signup</h2>
        <p style="margin:4px 0"><strong>Name:</strong> ${esc(entry.name)}</p>
        <p style="margin:4px 0"><strong>Email:</strong> ${esc(entry.email)}</p>
        <p style="margin:4px 0"><strong>Course:</strong> ${esc(entry.course) || '-'}</p>
        <p style="margin:16px 0 0;color:#666;font-size:13px">See everyone in the admin panel under Waiting List.</p>
      </div>`
  }).catch((e) => console.error('Waitlist notify error:', e?.message || e))
}

// Public: join the waiting list
router.post('/', async (req, res) => {
  try {
    const { name, email, course } = req.body || {}
    if (!name || !email) {
      return res.status(400).json({ message: 'name and email are required' })
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(String(email).trim())) {
      return res.status(400).json({ message: 'Please provide a valid email address' })
    }
    const cleanEmail = String(email).trim().slice(0, 200).toLowerCase()
    const cleanCourse = String(course || '').trim().slice(0, 120)

    // Same person + same course already on the list: don't add a duplicate
    // row or send another notification, just confirm to the visitor.
    const existing = await WaitlistEntry.findOne({ email: cleanEmail, course: cleanCourse })
    if (existing) {
      return res.status(200).json({ success: true, id: existing._id, duplicate: true })
    }

    const created = await WaitlistEntry.create({
      name: String(name).trim().slice(0, 120),
      email: String(email).trim().slice(0, 200),
      course: String(course || '').trim().slice(0, 120)
    })
    notifyNewEntry(created)
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
