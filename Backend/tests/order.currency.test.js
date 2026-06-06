/**
 * Tests: Razorpay currency passthrough for international payments
 *
 * Covers: createOrder, verifyPayment, createFreeOrder
 * Verifies that the active currency (INR / USD / EUR) is correctly
 * forwarded to Razorpay and stored — no more hardcoded 'INR'.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import crypto from 'crypto'

// ─── Hoisted mock handles ─────────────────────────────────────────────────────
// vi.mock() is hoisted before imports, so references to variables defined in
// the outer scope would be undefined. vi.hoisted() runs at hoist-time too,
// giving us stable references to pass into mock factories.
const mocks = vi.hoisted(() => ({
  razorpayCreate: vi.fn(),
  orderSave: vi.fn(),
  orderFindOne: vi.fn(),
  couponFindOne: vi.fn(),
  sendPurchaseEmail: vi.fn(),
  sendDigitalEmail: vi.fn(),
  subscribeBeehive: vi.fn(),
  createDownloads: vi.fn(),
}))

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('razorpay', () => ({
  // Regular function so the controller's `new Razorpay({...})` works.
  default: vi.fn(function () {
    this.orders = { create: mocks.razorpayCreate }
  }),
}))

vi.mock('../models/Order.js', () => {
  // Must be a real function (not an arrow) so the controller can `new Order()`.
  const MockOrder = vi.fn(function (data) {
    Object.assign(this, data)
    this._id = 'mock_order_id_abc'
    this.save = mocks.orderSave
  })
  MockOrder.findOne = mocks.orderFindOne
  return { default: MockOrder }
})

vi.mock('../models/Coupon.js', () => ({
  default: { findOne: mocks.couponFindOne },
}))

vi.mock('../models/Product.js', () => ({
  default: { findById: vi.fn() },
}))

vi.mock('../services/purchaseConfirmationEmailService.js', () => ({
  sendPurchaseConfirmationEmail: mocks.sendPurchaseEmail,
}))

vi.mock('../services/digitalDeliveryEmailService.js', () => ({
  sendDigitalProductEmail: mocks.sendDigitalEmail,
}))

vi.mock('../services/beehiveService.js', () => ({
  subscribeToBeehive: mocks.subscribeBeehive,
}))

vi.mock('../controllers/digitalDownloadController.js', () => ({
  createDownloadRecords: mocks.createDownloads,
}))

vi.mock('../config/firebaseAdmin.js', () => ({
  auth: { verifyIdToken: vi.fn().mockRejectedValue(new Error('no token')) },
}))

// ─── Import controller after mocks are wired ─────────────────────────────────
import { createOrder, verifyPayment, createFreeOrder } from '../controllers/orderController.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SECRET = 'test_hmac_secret_key_for_vitest' // must match setup.js

/** Compute the HMAC the same way the controller does */
const sign = (orderId, paymentId) =>
  crypto.createHmac('sha256', SECRET).update(`${orderId}|${paymentId}`).digest('hex')

/** Minimal mock request */
const req = (body = {}) => ({ body, headers: {}, user: null })

/** Minimal mock response — chainable status().json() */
const res = () => {
  const r = {}
  r.status = vi.fn().mockReturnValue(r)
  r.json = vi.fn().mockReturnValue(r)
  return r
}

const billing = {
  firstName: 'Jane',
  lastName: 'Smith',
  email: 'jane@example.com',
  phone: '9876543210',
  address: '42 Elm Street',
  city: 'Berlin',
  state: 'Berlin',
  postalCode: '10115',
  country: 'Germany',
}

const cartItems = [
  {
    _id: '507f1f77bcf86cd799439011',
    name: 'Spanish A1 Course',
    itemType: 'course',
    quantity: 1,
    price: 49,
  },
]

// ─── Reset between tests ──────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()

  mocks.razorpayCreate.mockResolvedValue({
    id: 'order_mock_rzp',
    amount: 10000,
    currency: 'INR',
    status: 'created',
  })
  mocks.orderSave.mockResolvedValue({ _id: 'mock_order_id_abc' })
  mocks.orderFindOne.mockResolvedValue(null)
  mocks.couponFindOne.mockResolvedValue(null)
  mocks.sendPurchaseEmail.mockResolvedValue({ success: true })
  mocks.sendDigitalEmail.mockResolvedValue({ success: true })
  mocks.subscribeBeehive.mockResolvedValue({ success: true })
  mocks.createDownloads.mockResolvedValue([])
})

// ─────────────────────────────────────────────────────────────────────────────
// GROUP 1 — createOrder: currency passthrough to Razorpay.orders.create
// ─────────────────────────────────────────────────────────────────────────────

describe('createOrder — currency passthrough', () => {
  it('passes INR to Razorpay when frontend sends INR', async () => {
    await createOrder(req({ amount: 49900, currency: 'INR' }), res())
    expect(mocks.razorpayCreate).toHaveBeenCalledWith(
      expect.objectContaining({ currency: 'INR' })
    )
  })

  it('passes USD to Razorpay when frontend sends USD', async () => {
    const r = res()
    await createOrder(req({ amount: 4900, currency: 'USD' }), r)
    expect(r.status).toHaveBeenCalledWith(200)
    expect(mocks.razorpayCreate).toHaveBeenCalledWith(
      expect.objectContaining({ currency: 'USD' })
    )
  })

  it('passes EUR to Razorpay when frontend sends EUR', async () => {
    const r = res()
    await createOrder(req({ amount: 4500, currency: 'EUR' }), r)
    expect(r.status).toHaveBeenCalledWith(200)
    expect(mocks.razorpayCreate).toHaveBeenCalledWith(
      expect.objectContaining({ currency: 'EUR' })
    )
  })

  it('defaults to INR when no currency field is sent', async () => {
    await createOrder(req({ amount: 49900 }), res()) // no currency key
    expect(mocks.razorpayCreate).toHaveBeenCalledWith(
      expect.objectContaining({ currency: 'INR' })
    )
  })

  it('forwards the exact amount to Razorpay', async () => {
    await createOrder(req({ amount: 25000, currency: 'USD' }), res())
    expect(mocks.razorpayCreate).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 25000 })
    )
  })

  it('returns the Razorpay key ID in the success response', async () => {
    const r = res()
    await createOrder(req({ amount: 10000, currency: 'USD' }), r)
    expect(r.json).toHaveBeenCalledWith(
      expect.objectContaining({ keyId: 'rzp_test_key_id' })
    )
  })

  it('returns 400 for amount = 0', async () => {
    const r = res()
    await createOrder(req({ amount: 0, currency: 'USD' }), r)
    expect(r.status).toHaveBeenCalledWith(400)
    expect(mocks.razorpayCreate).not.toHaveBeenCalled()
  })

  it('returns 400 for a negative amount', async () => {
    const r = res()
    await createOrder(req({ amount: -100, currency: 'INR' }), r)
    expect(r.status).toHaveBeenCalledWith(400)
    expect(mocks.razorpayCreate).not.toHaveBeenCalled()
  })

  it('returns 400 when amount is missing', async () => {
    const r = res()
    await createOrder(req({ currency: 'EUR' }), r)
    expect(r.status).toHaveBeenCalledWith(400)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// GROUP 2 — verifyPayment: HMAC, currencies, edge cases
// ─────────────────────────────────────────────────────────────────────────────

describe('verifyPayment — signature & currency', () => {
  const ORDER_ID = 'order_rzp_001'
  const PAYMENT_ID = 'pay_rzp_001'
  const VALID_SIG = sign(ORDER_ID, PAYMENT_ID)

  const verifyBody = (currency = 'INR', overrides = {}) => ({
    razorpay_order_id: ORDER_ID,
    razorpay_payment_id: PAYMENT_ID,
    razorpay_signature: VALID_SIG,
    billingDetails: billing,
    cartItems,
    totalAmount: 49,
    currency,
    ...overrides,
  })

  it('creates an INR order after valid payment', async () => {
    const r = res()
    await verifyPayment(req(verifyBody('INR')), r)
    expect(r.status).toHaveBeenCalledWith(201)
    expect(r.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }))
    expect(mocks.orderSave).toHaveBeenCalled()
  })

  it('creates a USD order after valid international payment', async () => {
    const r = res()
    await verifyPayment(req(verifyBody('USD')), r)
    expect(r.status).toHaveBeenCalledWith(201)
    expect(mocks.orderSave).toHaveBeenCalled()
  })

  it('creates a EUR order after valid European payment', async () => {
    const r = res()
    await verifyPayment(req(verifyBody('EUR')), r)
    expect(r.status).toHaveBeenCalledWith(201)
    expect(mocks.orderSave).toHaveBeenCalled()
  })

  it('passes USD currency to purchase confirmation email', async () => {
    await verifyPayment(req(verifyBody('USD')), res())
    // Background tasks fire after res.json() — give them a tick to settle
    await new Promise((r) => setTimeout(r, 30))
    expect(mocks.sendPurchaseEmail).toHaveBeenCalledWith(
      expect.objectContaining({ currency: 'USD' })
    )
  })

  it('passes EUR currency to purchase confirmation email', async () => {
    await verifyPayment(req(verifyBody('EUR')), res())
    await new Promise((r) => setTimeout(r, 30))
    expect(mocks.sendPurchaseEmail).toHaveBeenCalledWith(
      expect.objectContaining({ currency: 'EUR' })
    )
  })

  it('rejects a tampered HMAC signature with 400', async () => {
    const r = res()
    await verifyPayment(req(verifyBody('INR', { razorpay_signature: 'bad_sig_xyz' })), r)
    expect(r.status).toHaveBeenCalledWith(400)
    expect(mocks.orderSave).not.toHaveBeenCalled()
  })

  it('returns 400 when razorpay_order_id is missing', async () => {
    const { razorpay_order_id, ...body } = verifyBody('INR')
    const r = res()
    await verifyPayment(req(body), r)
    expect(r.status).toHaveBeenCalledWith(400)
  })

  it('returns 400 when billingDetails is missing', async () => {
    const { billingDetails, ...body } = verifyBody('USD')
    const r = res()
    await verifyPayment(req(body), r)
    expect(r.status).toHaveBeenCalledWith(400)
  })

  it('returns 400 for an empty cart', async () => {
    const r = res()
    await verifyPayment(req(verifyBody('INR', { cartItems: [] })), r)
    expect(r.status).toHaveBeenCalledWith(400)
  })

  it('returns existing order (200) on duplicate payment — idempotent', async () => {
    mocks.orderFindOne.mockResolvedValue({ _id: 'existing_order_99' })
    const r = res()
    await verifyPayment(req(verifyBody('USD')), r)
    expect(r.status).toHaveBeenCalledWith(200)
    expect(r.json).toHaveBeenCalledWith(
      expect.objectContaining({ orderId: 'existing_order_99' })
    )
    expect(mocks.orderSave).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// GROUP 3 — createFreeOrder: free products, any currency
// ─────────────────────────────────────────────────────────────────────────────

describe('createFreeOrder — currency in free orders', () => {
  const freeBody = (currency = 'INR', overrides = {}) => ({
    billingDetails: billing,
    cartItems,
    totalAmount: 0,
    currency,
    couponCode: null,
    discountAmount: 0,
    newsletterOptIn: false,
    ...overrides,
  })

  it('creates a free INR order successfully', async () => {
    const r = res()
    await createFreeOrder(req(freeBody('INR')), r)
    expect(r.status).toHaveBeenCalledWith(201)
    expect(mocks.orderSave).toHaveBeenCalled()
  })

  it('creates a free USD order successfully', async () => {
    const r = res()
    await createFreeOrder(req(freeBody('USD')), r)
    expect(r.status).toHaveBeenCalledWith(201)
    expect(mocks.orderSave).toHaveBeenCalled()
  })

  it('passes USD to purchase email for free order', async () => {
    await createFreeOrder(req(freeBody('USD')), res())
    await new Promise((r) => setTimeout(r, 30))
    expect(mocks.sendPurchaseEmail).toHaveBeenCalledWith(
      expect.objectContaining({ currency: 'USD' })
    )
  })

  it('passes EUR to purchase email for free order', async () => {
    await createFreeOrder(req(freeBody('EUR')), res())
    await new Promise((r) => setTimeout(r, 30))
    expect(mocks.sendPurchaseEmail).toHaveBeenCalledWith(
      expect.objectContaining({ currency: 'EUR' })
    )
  })

  it('defaults email currency to INR when no currency sent', async () => {
    const { currency, ...body } = freeBody()
    await createFreeOrder(req(body), res())
    await new Promise((r) => setTimeout(r, 30))
    expect(mocks.sendPurchaseEmail).toHaveBeenCalledWith(
      expect.objectContaining({ currency: 'INR' })
    )
  })

  it('returns 400 for totalAmount > 0 (wrong endpoint)', async () => {
    const r = res()
    await createFreeOrder(req(freeBody('USD', { totalAmount: 10 })), r)
    expect(r.status).toHaveBeenCalledWith(400)
    expect(mocks.orderSave).not.toHaveBeenCalled()
  })

  it('returns 400 when billingDetails is missing', async () => {
    const { billingDetails, ...body } = freeBody('USD')
    const r = res()
    await createFreeOrder(req(body), r)
    expect(r.status).toHaveBeenCalledWith(400)
  })

  it('returns 400 for incomplete billing — missing email', async () => {
    const r = res()
    await createFreeOrder(
      req(freeBody('EUR', { billingDetails: { ...billing, email: '' } })),
      r
    )
    expect(r.status).toHaveBeenCalledWith(400)
  })

  it('returns 400 for an empty cart', async () => {
    const r = res()
    await createFreeOrder(req(freeBody('INR', { cartItems: [] })), r)
    expect(r.status).toHaveBeenCalledWith(400)
  })
})
