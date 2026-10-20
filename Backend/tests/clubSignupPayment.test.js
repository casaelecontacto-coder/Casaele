/**
 * Tests: Conversation Club payment is confirmed with Razorpay, never by the browser.
 */
import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest'
import express from 'express'

const mocks = vi.hoisted(() => ({
  findById: vi.fn(),
  findOneAndUpdate: vi.fn(),
  linkFetch: vi.fn(),
  linkCreate: vi.fn(),
  sendEmail: vi.fn(() => Promise.resolve()),
  sendConfirmation: vi.fn()
}))

vi.mock('razorpay', () => ({
  default: function () { this.paymentLink = { fetch: mocks.linkFetch, create: mocks.linkCreate } }
}))
vi.mock('../models/ClubSignup.js', () => ({
  default: { findById: mocks.findById, findOneAndUpdate: mocks.findOneAndUpdate, findOne: vi.fn(), create: vi.fn() }
}))
vi.mock('../config/nodemailer.js', () => ({ sendEmail: mocks.sendEmail }))
vi.mock('../services/signupConfirmationEmail.js', () => ({ sendSignupConfirmation: mocks.sendConfirmation, firstName: (n) => n }))
vi.mock('../middleware/superAdminAuth.js', () => ({ verifyAdminAccess: (req, res, next) => next() }))

process.env.RAZORPAY_KEY_ID = 'rzp_test_x'
process.env.RAZORPAY_KEY_SECRET = 'secret'

const { default: router } = await import('../routes/clubSignupRoutes.js')
const app = express()
app.use(express.json())
app.use('/api/club-signups', router)
const server = app.listen(0)
const base = `http://127.0.0.1:${server.address().port}/api/club-signups`
afterAll(() => server.close())

const post = (path, body = {}) =>
  fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(async (r) => ({ status: r.status, body: await r.json() }))

const signup = (over = {}) => ({
  _id: 'abc123', name: 'Test', email: 't@example.com', club: 'Higher intermediate', plan: 'Bi-Monthly',
  paymentStatus: 'unpaid', paymentLinkId: 'plink_1', paymentLinkUrl: '', save: vi.fn(), ...over
})

beforeEach(() => vi.clearAllMocks())

describe('POST /:id/verify', () => {
  it('stays unpaid when Razorpay says the link is not paid', async () => {
    mocks.findById.mockResolvedValue(signup())
    mocks.linkFetch.mockResolvedValue({ status: 'created', amount_paid: 0, reference_id: 'abc123', payments: null })
    const r = await post('/abc123/verify')
    expect(r.body.paid).toBe(false)
    expect(mocks.findOneAndUpdate).not.toHaveBeenCalled()
    expect(mocks.sendConfirmation).not.toHaveBeenCalled()
  })

  it('marks paid and sends the emails once when Razorpay says paid in full', async () => {
    mocks.findById.mockResolvedValue(signup())
    mocks.linkFetch.mockResolvedValue({ status: 'paid', amount_paid: 448000, reference_id: 'abc123', payments: [{ payment_id: 'pay_1', status: 'captured' }] })
    mocks.findOneAndUpdate.mockResolvedValue(signup({ paymentStatus: 'paid' }))
    const r = await post('/abc123/verify')
    expect(r.body.paid).toBe(true)
    expect(mocks.sendConfirmation).toHaveBeenCalledTimes(1)
  })

  it('does not accept a payment smaller than the plan price', async () => {
    mocks.findById.mockResolvedValue(signup())
    mocks.linkFetch.mockResolvedValue({ status: 'paid', amount_paid: 100, reference_id: 'abc123', payments: [] })
    const r = await post('/abc123/verify')
    expect(r.body.paid).toBe(false)
    expect(mocks.findOneAndUpdate).not.toHaveBeenCalled()
  })

  it('does not accept a link that belongs to another signup', async () => {
    mocks.findById.mockResolvedValue(signup())
    mocks.linkFetch.mockResolvedValue({ status: 'paid', amount_paid: 448000, reference_id: 'someone-else', payments: [] })
    expect((await post('/abc123/verify')).body.paid).toBe(false)
  })

  it('emails only once if two verifies race', async () => {
    mocks.findById.mockResolvedValue(signup())
    mocks.linkFetch.mockResolvedValue({ status: 'paid', amount_paid: 448000, reference_id: 'abc123', payments: [{ payment_id: 'pay_1', status: 'captured' }] })
    mocks.findOneAndUpdate.mockResolvedValueOnce(signup({ paymentStatus: 'paid' })).mockResolvedValueOnce(null)
    await Promise.all([post('/abc123/verify'), post('/abc123/verify')])
    expect(mocks.sendConfirmation).toHaveBeenCalledTimes(1)
  })
})

describe('POST /:id/pay-link', () => {
  it('creates a link for the server-side price and the right reference', async () => {
    const s = signup({ paymentLinkId: '' })
    mocks.findById.mockResolvedValue(s)
    mocks.linkCreate.mockResolvedValue({ id: 'plink_9', short_url: 'https://rzp.io/rzp/x' })
    const r = await post('/abc123/pay-link', { returnUrl: 'https://casadeele.co/ConversationClub' })
    expect(r.body).toEqual({ paid: false, url: 'https://rzp.io/rzp/x' })
    const arg = mocks.linkCreate.mock.calls[0][0]
    expect(arg.amount).toBe(448000)
    expect(arg.reference_id).toBe('abc123')
    expect(arg.callback_url).toBe('https://casadeele.co/ConversationClub?signup=abc123')
  })

  it('ignores a return URL on another site', async () => {
    mocks.findById.mockResolvedValue(signup({ paymentLinkId: '' }))
    mocks.linkCreate.mockResolvedValue({ id: 'plink_9', short_url: 'https://rzp.io/rzp/x' })
    await post('/abc123/pay-link', { returnUrl: 'https://evil.example/steal' })
    expect(mocks.linkCreate.mock.calls[0][0].callback_url).toBeUndefined()
  })
})
