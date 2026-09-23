import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import express from 'express'

// Everything the route touches outside itself is mocked, so this tests the
// route's own rules: who can post/delete, threading, validation, rate limit.
const MATERIAL_ID = '64b000000000000000000001'
const ROOT_ID = '64b0000000000000000000a1'
const REPLY_ID = '64b0000000000000000000a2'

const db = { comments: [], recent: 0 }

vi.mock('../models/Material.js', () => ({
  default: {
    findById: vi.fn((id) => ({ select: async () => (id === MATERIAL_ID ? { _id: MATERIAL_ID } : null) })),
    findOne: vi.fn(() => ({ select: async () => null })),
  },
}))

vi.mock('../models/ChapterComment.js', () => ({
  default: {
    find: vi.fn((q) => {
      const rows = q.parent ? db.comments.filter((c) => String(c.parent) === String(q.parent)) : db.comments
      return { sort: async () => rows, select: async () => rows }
    }),
    countDocuments: vi.fn(async () => db.recent),
    findById: vi.fn(async (id) => db.comments.find((c) => String(c._id) === String(id)) || null),
    create: vi.fn(async (doc) => ({ _id: 'new1', createdAt: new Date(), ...doc })),
    deleteMany: vi.fn(async () => ({})),
  },
}))

const tokens = {
  alice: { uid: 'alice-uid', name: 'Alice', email: 'alice@x.com', picture: 'https://img/a.png' },
  bob: { uid: 'bob-uid', name: 'Bob', email: 'bob@x.com' },
  admin: { uid: 'admin-uid', name: 'Admin', email: 'boss@x.com' },
}
vi.mock('../config/firebaseAdmin.js', () => ({
  auth: { verifyIdToken: vi.fn(async (t) => { if (!tokens[t]) throw new Error('bad'); return tokens[t] }) },
}))
vi.mock('../middleware/adminCache.js', () => ({ getCachedAdmin: () => null, setCachedAdmin: () => {} }))
vi.mock('../models/Admin.js', () => ({
  default: { findOne: vi.fn(async ({ email }) => (email.$regex.test('boss@x.com') ? { verified: true } : null)) },
}))

const { default: router } = await import('../routes/chapterCommentRoutes.js')

let server
let base
beforeAll(async () => {
  const app = express()
  app.use(express.json())
  app.use('/api/chapter-comments', router)
  await new Promise((r) => { server = app.listen(0, r) })
  base = `http://localhost:${server.address().port}/api/chapter-comments`
})
afterAll(() => server.close())

beforeEach(() => {
  db.recent = 0
  db.comments = [
    { _id: ROOT_ID, material: MATERIAL_ID, parent: null, uid: 'alice-uid', name: 'Alice', text: 'First!', createdAt: new Date() },
    { _id: REPLY_ID, material: MATERIAL_ID, parent: ROOT_ID, uid: 'bob-uid', name: 'Bob', text: 'Hi Alice', createdAt: new Date() },
  ]
})

const call = (path, { method = 'GET', token, body } = {}) =>
  fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })

describe('GET /', () => {
  it('lists comments without leaking uids, mine=false when logged out', async () => {
    const res = await call(`?material=${MATERIAL_ID}`)
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.comments).toHaveLength(2)
    expect(data.comments.every((c) => c.mine === false && !('uid' in c))).toBe(true)
    expect(data.canModerate).toBe(false)
  })

  it('flags the viewer\'s own comments and admin moderation', async () => {
    const alice = await (await call(`?material=${MATERIAL_ID}`, { token: 'alice' })).json()
    expect(alice.comments.map((c) => c.mine)).toEqual([true, false])
    const admin = await (await call(`?material=${MATERIAL_ID}`, { token: 'admin' })).json()
    expect(admin.canModerate).toBe(true)
  })

  it('404s for an unknown chapter', async () => {
    expect((await call('?material=nope')).status).toBe(404)
  })
})

describe('POST /', () => {
  it('requires login', async () => {
    expect((await call('', { method: 'POST', body: { material: MATERIAL_ID, text: 'hi' } })).status).toBe(401)
  })

  it('rejects empty and over-long text', async () => {
    expect((await call('', { method: 'POST', token: 'bob', body: { material: MATERIAL_ID, text: '   ' } })).status).toBe(400)
    expect((await call('', { method: 'POST', token: 'bob', body: { material: MATERIAL_ID, text: 'x'.repeat(2001) } })).status).toBe(400)
  })

  it('creates a top-level comment with the author\'s name', async () => {
    const res = await call('', { method: 'POST', token: 'alice', body: { material: MATERIAL_ID, text: ' Great chapter ' } })
    const data = await res.json()
    expect(res.status).toBe(201)
    expect(data).toMatchObject({ name: 'Alice', text: 'Great chapter', parent: null, mine: true, photoUrl: 'https://img/a.png' })
  })

  it('replying to a top-level comment attaches to it with no @name', async () => {
    const data = await (await call('', { method: 'POST', token: 'bob', body: { material: MATERIAL_ID, parent: ROOT_ID, text: 'agreed' } })).json()
    expect(data.parent).toBe(ROOT_ID)
    expect(data.replyToName).toBe('')
  })

  it('replying to a reply stays one level deep and records who it answers', async () => {
    const data = await (await call('', { method: 'POST', token: 'alice', body: { material: MATERIAL_ID, parent: REPLY_ID, text: 'thanks Bob' } })).json()
    expect(data.parent).toBe(ROOT_ID)
    expect(data.replyToName).toBe('Bob')
  })

  it('rate limits fast posting', async () => {
    db.recent = 5
    expect((await call('', { method: 'POST', token: 'bob', body: { material: MATERIAL_ID, text: 'spam' } })).status).toBe(429)
  })
})

describe('DELETE /:id', () => {
  it('requires login', async () => {
    expect((await call(`/${ROOT_ID}`, { method: 'DELETE' })).status).toBe(401)
  })

  it('forbids deleting someone else\'s comment', async () => {
    expect((await call(`/${ROOT_ID}`, { method: 'DELETE', token: 'bob' })).status).toBe(403)
  })

  it('lets the author delete, taking replies with it', async () => {
    const res = await call(`/${ROOT_ID}`, { method: 'DELETE', token: 'alice' })
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.deletedIds.map(String).sort()).toEqual([ROOT_ID, REPLY_ID].sort())
  })

  it('lets an admin delete anyone\'s comment', async () => {
    expect((await call(`/${REPLY_ID}`, { method: 'DELETE', token: 'admin' })).status).toBe(200)
  })
})
