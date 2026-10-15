import express from 'express'
import { verifyAdminAccess } from '../middleware/superAdminAuth.js'
import { sendEmail } from '../config/nodemailer.js'

const NOTIFY_EMAIL = process.env.WAITLIST_NOTIFY_EMAIL || 'casaelecontacto@gmail.com'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const esc = (v) => String(v || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

/**
 * Builds a router for a simple "someone signed up" collection:
 *  - POST /            public submit (name + email + the extra `fields`)
 *  - GET  /            admin list
 *  - PUT  /:id/status  admin: new <-> contacted
 *  - DELETE /:id       admin
 *
 * Every new entry also emails the team (fire-and-forget).
 */
export function makeSignupRouter({ Model, title, adminLabel, fields = [], dedupeBy = [] }) {
  const router = express.Router()

  const notify = (entry) => {
    const rows = [
      ['Name', entry.name],
      ['Email', entry.email],
      ...fields.map((f) => [f.label, entry[f.key]])
    ]
    sendEmail({
      from: process.env.EMAIL_USER,
      to: NOTIFY_EMAIL,
      subject: `${title}: ${entry.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px;">
          <h2 style="color:#AD1518;margin:0 0 12px">${esc(title)}</h2>
          ${rows.map(([k, v]) => `<p style="margin:4px 0"><strong>${esc(k)}:</strong> ${esc(v) || '-'}</p>`).join('')}
          <p style="margin:16px 0 0;color:#666;font-size:13px">See everyone in the admin panel under ${esc(adminLabel)}.</p>
        </div>`
    }).catch((e) => console.error(`${title} notify error:`, e?.message || e))
  }

  router.post('/', async (req, res) => {
    try {
      const body = req.body || {}
      const name = String(body.name || '').trim().slice(0, 120)
      const email = String(body.email || '').trim().slice(0, 200).toLowerCase()
      if (!name || !email) return res.status(400).json({ message: 'name and email are required' })
      if (!EMAIL_RE.test(email)) return res.status(400).json({ message: 'Please provide a valid email address' })

      const data = { name, email }
      for (const f of fields) data[f.key] = String(body[f.key] || '').trim().slice(0, 120)

      if (dedupeBy.length) {
        const query = { email }
        for (const k of dedupeBy) query[k] = data[k]
        const existing = await Model.findOne(query)
        if (existing) return res.status(200).json({ success: true, id: existing._id, duplicate: true })
      }

      const created = await Model.create(data)
      notify(created)
      res.status(201).json({ success: true, id: created._id })
    } catch (e) {
      console.error(`${title} submit error:`, e?.message || e)
      res.status(500).json({ message: 'Failed to submit. Please try again.' })
    }
  })

  router.get('/', verifyAdminAccess, async (req, res) => {
    try {
      res.json(await Model.find().sort({ createdAt: -1 }))
    } catch (e) {
      console.error(`${title} list error:`, e?.message || e)
      res.status(500).json({ message: 'Failed to fetch entries' })
    }
  })

  router.put('/:id/status', verifyAdminAccess, async (req, res) => {
    const status = req.body?.status
    if (!['new', 'contacted'].includes(status)) {
      return res.status(400).json({ message: 'status must be new or contacted' })
    }
    const updated = await Model.findByIdAndUpdate(req.params.id, { status }, { new: true })
    if (!updated) return res.status(404).json({ message: 'Not found' })
    res.json(updated)
  })

  router.delete('/:id', verifyAdminAccess, async (req, res) => {
    const deleted = await Model.findByIdAndDelete(req.params.id)
    if (!deleted) return res.status(404).json({ message: 'Not found' })
    res.json({ success: true })
  })

  return router
}
