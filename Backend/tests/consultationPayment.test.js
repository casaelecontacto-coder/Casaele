/**
 * Tests: 1:1 consultation payment is confirmed with Razorpay, priced on the server.
 */
import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest'
import express from 'express'

const mocks = vi.hoisted(() => ({
  findById: vi.fn(), findOneAndUpdate: vi.fn(), linkFetch: vi.fn(), linkCreate: vi.fn(),
  sendEmail: vi.fn(() => Promise.resolve()), sendConfirmation: vi.fn()
}))

vi.mock('razorpay', () => ({
  default: function () { this.paymentLink = { fetch: mocks.linkFetch, create: mocks.linkCreate } }
}))
vi.mock('../models/ConsultationRequest.js', () => ({
  default: { findById: mocks.findById, findOneAndUpdate: mocks.findOneAndUpdate, findOne: vi.fn(), create: vi.fn() }
}))
vi.mock('../config/nodemailer.js', () => ({ sendEmail: mocks.sendEmail }))
vi.mock('../services/signupConfirmationEmail.js', () => ({ sendSignupConfirmation: mocks.sendConfirmation, firstName: (n) => n }))
vi.mock('../middleware/superAdminAuth.js', () => ({ verifyAdminAccess: (req, res, next) => next() }))

process.env.RAZORPAY_KEY_ID = 'rzp_test_x'
process.env.RAZORPAY_KEY_SECRET = 'secret'

const { default: router } = await import('../routes/consultationRoutes.js')
const app = express()
app.use(express.json())
app.use('/api/consultations', router)
const server = app.listen(0)
const base = `http://127.0.0.1:${server.address().port}/api/consultations`
afterAll(() => server.close())

const post = (path, body = {}) =>
  fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(async (r) => ({ status: r.status, body: await r.json() }))

const req = (duration, over = {}) => ({
  _id: 'c1', name: 'Test', email: 't@example.com', duration, paymentStatus: 'unpaid', paymentLinkId: 'plink_1', paymentLinkUrl: '', save: vi.fn(), ...over
})

beforeEach(() => vi.clearAllMocks())

describe('consultation payment', () => {
  it('prices a 60-minute call at 999 on the server', async () => {
    mocks.findById.mockResolvedValue(req('60 minutes', { paymentLinkId: '' }))
    mocks.linkCreate.mockResolvedValue({ id: 'plink_9', short_url: 'https://rzp.io/rzp/x' })
    await post('/c1/pay-link')
    expect(mocks.linkCreate.mock.calls[0][0].amount).toBe(99900)
  })

  it('prices a 30-minute call at 549', async () => {
    mocks.findById.mockResolvedValue(req('30 minutes', { paymentLinkId: '' }))
    mocks.linkCreate.mockResolvedValue({ id: 'plink_9', short_url: 'https://rzp.io/rzp/x' })
    await post('/c1/pay-link')
    expect(mocks.linkCreate.mock.calls[0][0].amount).toBe(54900)
  })

  it('refuses an unknown length', async () => {
    mocks.findById.mockResolvedValue(req('15 minutes', { paymentLinkId: '' }))
    expect((await post('/c1/pay-link')).status).toBe(400)
    expect(mocks.linkCreate).not.toHaveBeenCalled()
  })

  it('stays unpaid until Razorpay says paid', async () => {
    mocks.findById.mockResolvedValue(req('60 minutes'))
    mocks.linkFetch.mockResolvedValue({ status: 'created', amount_paid: 0, reference_id: 'c1' })
    expect((await post('/c1/verify')).body.paid).toBe(false)
    expect(mocks.sendConfirmation).not.toHaveBeenCalled()
  })

  it('rejects a 549 payment for a 60-minute call', async () => {
    mocks.findById.mockResolvedValue(req('60 minutes'))
    mocks.linkFetch.mockResolvedValue({ status: 'paid', amount_paid: 54900, reference_id: 'c1', payments: [] })
    expect((await post('/c1/verify')).body.paid).toBe(false)
    expect(mocks.findOneAndUpdate).not.toHaveBeenCalled()
  })

  it('marks paid and emails once when paid in full', async () => {
    mocks.findById.mockResolvedValue(req('60 minutes'))
    mocks.linkFetch.mockResolvedValue({ status: 'paid', amount_paid: 99900, reference_id: 'c1', payments: [{ payment_id: 'pay_1', status: 'captured' }] })
    mocks.findOneAndUpdate.mockResolvedValue(req('60 minutes', { paymentStatus: 'paid' }))
    const r = await post('/c1/verify')
    expect(r.body.paid).toBe(true)
    expect(mocks.sendConfirmation).toHaveBeenCalledTimes(1)
  })
})
