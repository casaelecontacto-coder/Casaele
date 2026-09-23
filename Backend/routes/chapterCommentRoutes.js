import express from 'express'
import mongoose from 'mongoose'
import ChapterComment from '../models/ChapterComment.js'
import Material from '../models/Material.js'
import { auth } from '../config/firebaseAdmin.js'

const router = express.Router()

const MAX_TEXT = 2000
const MAX_NAME = 60
// Posting limit per user: at most this many comments in this window.
const RATE_LIMIT_COUNT = 5
const RATE_LIMIT_WINDOW_MS = 60 * 1000

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Verifies a Bearer token if there is one. Returns the decoded token, or null
// for "not logged in" (missing/invalid token) — used where login is optional.
async function optionalUser(req) {
  const [scheme, token] = (req.headers.authorization || '').split(' ')
  if (scheme !== 'Bearer' || !token || !auth) return null
  try {
    return await auth.verifyIdToken(token)
  } catch {
    return null
  }
}

// Same admin definition as verifyVerifiedAdmin (super admin email, or a
// verified Admin document), but as a yes/no instead of a 403.
async function isAdminUser(decoded) {
  const email = (decoded?.email || '').trim().toLowerCase()
  if (!email) return false
  const superAdmin = (process.env.SUPER_ADMIN_EMAIL || '').trim().toLowerCase()
  if (superAdmin && email === superAdmin) return true

  const { getCachedAdmin, setCachedAdmin } = await import('../middleware/adminCache.js')
  let admin = getCachedAdmin(email)
  if (admin === null || admin === undefined) {
    const Admin = (await import('../models/Admin.js')).default
    admin = await Admin.findOne({ email: { $regex: new RegExp(`^${escapeRegex(email)}$`, 'i') }, verified: true })
    setCachedAdmin(email, admin || false)
  }
  return !!admin
}

async function findMaterial(idOrSlug) {
  if (!idOrSlug || typeof idOrSlug !== 'string') return null
  if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
    const byId = await Material.findById(idOrSlug).select('_id')
    if (byId) return byId
  }
  return Material.findOne({ slug: idOrSlug }).select('_id')
}

function displayName(decoded) {
  const raw = decoded.name || (decoded.email ? decoded.email.split('@')[0] : '') || 'Learner'
  return raw.trim().slice(0, MAX_NAME) || 'Learner'
}

const httpsOrEmpty = (url) => (typeof url === 'string' && /^https:\/\//i.test(url) ? url : '')

const toPublic = (c, viewerUid) => ({
  _id: c._id,
  parent: c.parent || null,
  name: c.name,
  photoUrl: c.photoUrl || '',
  replyToName: c.replyToName || '',
  text: c.text,
  createdAt: c.createdAt,
  mine: !!viewerUid && c.uid === viewerUid,
})

// GET /api/chapter-comments?material=<id or slug>
// Public. If a valid Bearer token is sent, each comment carries `mine` and the
// response says whether the viewer can moderate (delete anyone's comment).
router.get('/', async (req, res) => {
  try {
    const material = await findMaterial(req.query.material)
    if (!material) return res.status(404).json({ message: 'Chapter not found' })

    const viewer = await optionalUser(req)
    const comments = await ChapterComment.find({ material: material._id }).sort({ createdAt: 1 })
    res.json({
      comments: comments.map((c) => toPublic(c, viewer?.uid)),
      canModerate: viewer ? await isAdminUser(viewer) : false,
    })
  } catch (e) {
    console.error('Error fetching chapter comments:', e)
    res.status(500).json({ message: 'Failed to load comments' })
  }
})

// POST /api/chapter-comments  { material, text, parent? }
// Requires login.
router.post('/', async (req, res) => {
  try {
    const user = await optionalUser(req)
    if (!user) return res.status(401).json({ message: 'Please log in to comment.' })

    const text = typeof req.body?.text === 'string' ? req.body.text.trim() : ''
    if (!text) return res.status(400).json({ message: 'Write something first.' })
    if (text.length > MAX_TEXT) return res.status(400).json({ message: `Comments can be up to ${MAX_TEXT} characters.` })

    const material = await findMaterial(req.body?.material)
    if (!material) return res.status(404).json({ message: 'Chapter not found' })

    const recent = await ChapterComment.countDocuments({
      uid: user.uid,
      createdAt: { $gte: new Date(Date.now() - RATE_LIMIT_WINDOW_MS) },
    })
    if (recent >= RATE_LIMIT_COUNT) {
      return res.status(429).json({ message: 'You are commenting too fast — wait a minute and try again.' })
    }

    let parent = null
    let replyToName = ''
    if (req.body?.parent) {
      if (!mongoose.Types.ObjectId.isValid(req.body.parent)) return res.status(400).json({ message: 'Invalid reply target' })
      const target = await ChapterComment.findById(req.body.parent)
      if (!target || String(target.material) !== String(material._id)) {
        return res.status(404).json({ message: 'The comment you are replying to no longer exists.' })
      }
      // Keep threads one level deep: a reply to a reply hangs off the same root.
      parent = target.parent || target._id
      if (target.parent) replyToName = target.name
    }

    const created = await ChapterComment.create({
      material: material._id,
      parent,
      uid: user.uid,
      name: displayName(user),
      photoUrl: httpsOrEmpty(user.picture),
      replyToName,
      text,
    })
    res.status(201).json(toPublic(created, user.uid))
  } catch (e) {
    console.error('Error posting chapter comment:', e)
    res.status(500).json({ message: 'Failed to post comment' })
  }
})

// DELETE /api/chapter-comments/:id
// The author or an admin. Deleting a top-level comment deletes its replies.
router.delete('/:id', async (req, res) => {
  try {
    const user = await optionalUser(req)
    if (!user) return res.status(401).json({ message: 'Please log in.' })
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'Invalid comment id' })

    const comment = await ChapterComment.findById(req.params.id)
    if (!comment) return res.status(404).json({ message: 'Comment not found' })

    if (comment.uid !== user.uid && !(await isAdminUser(user))) {
      return res.status(403).json({ message: 'You can only delete your own comments.' })
    }

    const replies = await ChapterComment.find({ parent: comment._id }).select('_id')
    const ids = [comment._id, ...replies.map((r) => r._id)]
    await ChapterComment.deleteMany({ _id: { $in: ids } })
    res.json({ success: true, deletedIds: ids })
  } catch (e) {
    console.error('Error deleting chapter comment:', e)
    res.status(500).json({ message: 'Failed to delete comment' })
  }
})

export default router
