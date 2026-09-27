import { describe, it, expect, vi, beforeEach } from 'vitest'

const ID = '64b000000000000000000001'
let doc
vi.mock('../models/Magazine.js', () => ({
  default: { findById: vi.fn(async () => doc), findOne: vi.fn(async () => null) },
}))
vi.mock('../models/Order.js', () => ({ default: { findOne: vi.fn(async () => null) } }))
const getSignedDriveUrl = vi.fn(async (fileId) => `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&access_token=fake-token`)
vi.mock('../services/googleDriveService.js', () => ({ getFileStreamFromDrive: vi.fn(), getSignedDriveUrl }))
vi.mock('../config/firebaseAdmin.js', () => ({
  auth: { verifyIdToken: vi.fn(async () => { throw new Error('should not be called for open texts') }) },
}))

const { serveMagazinePdf, getMagazinePdfUrl } = await import('../controllers/magazineController.js')

const makeRes = () => {
  const res = { statusCode: 200, body: null, redirected: null }
  res.status = (c) => { res.statusCode = c; return res }
  res.json = (b) => { res.body = b; return res }
  res.redirect = (u) => { res.redirected = u; return res }
  return res
}

const run = async (headers = {}) => {
  const res = makeRes()
  await serveMagazinePdf({ params: { id: ID }, headers }, res)
  return res
}

const runUrl = async (headers = {}) => {
  const res = makeRes()
  await getMagazinePdfUrl({ params: { id: ID }, headers }, res)
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

describe('getMagazinePdfUrl — same access rules as serveMagazinePdf, returns { url } instead', () => {
  it('returns the plain URL as-is for a free text without any login', async () => {
    const res = await runUrl()
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ url: 'https://files/x.pdf' })
  })

  it('still requires login for a free issue', async () => {
    doc.contentType = 'issue'
    expect((await runUrl()).statusCode).toBe(401)
  })

  it('still requires login for a paid text', async () => {
    doc.accessType = 'paid'
    expect((await runUrl()).statusCode).toBe(401)
  })

  it('signs a gdrive:// pdfUrl into a Drive media URL instead of redirecting', async () => {
    doc.pdfUrl = 'gdrive://file123'
    const res = await runUrl()
    expect(res.statusCode).toBe(200)
    expect(getSignedDriveUrl).toHaveBeenCalledWith('file123')
    expect(res.body.url).toContain('file123')
    expect(res.body.url).toContain('alt=media')
  })

  it('404s the same way as serveMagazinePdf when there is no PDF', async () => {
    doc.pdfUrl = ''
    expect((await runUrl()).statusCode).toBe(404)
  })
})
