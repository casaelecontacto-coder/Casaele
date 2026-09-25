import { describe, it, expect, vi, beforeEach } from 'vitest'

const ID = '64b000000000000000000001'
let doc
vi.mock('../models/Magazine.js', () => ({
  default: { findById: vi.fn(async () => doc), findOne: vi.fn(async () => null) },
}))
vi.mock('../models/Order.js', () => ({ default: { findOne: vi.fn(async () => null) } }))
vi.mock('../services/googleDriveService.js', () => ({ getFileStreamFromDrive: vi.fn() }))
vi.mock('../config/firebaseAdmin.js', () => ({
  auth: { verifyIdToken: vi.fn(async () => { throw new Error('should not be called for open texts') }) },
}))

const { serveMagazinePdf } = await import('../controllers/magazineController.js')

const run = async (headers = {}) => {
  const res = { statusCode: 200, body: null, redirected: null }
  res.status = (c) => { res.statusCode = c; return res }
  res.json = (b) => { res.body = b; return res }
  res.redirect = (u) => { res.redirected = u; return res }
  await serveMagazinePdf({ params: { id: ID }, headers }, res)
  return res
}

beforeEach(() => {
  doc = { _id: ID, contentType: 'text', accessType: 'free', pdfUrl: 'https://files/x.pdf' }
})

describe('serveMagazinePdf login rules', () => {
  it('serves a free text without any login', async () => {
    const res = await run()
    expect(res.redirected).toBe('https://files/x.pdf')
    expect(res.statusCode).toBe(200)
  })

  it('still requires login for a free issue', async () => {
    doc.contentType = 'issue'
    expect((await run()).statusCode).toBe(401)
  })

  it('still requires login for a free comic', async () => {
    doc.contentType = 'comic'
    expect((await run()).statusCode).toBe(401)
  })

  it('still requires login for a paid text', async () => {
    doc.accessType = 'paid'
    expect((await run()).statusCode).toBe(401)
  })
})
