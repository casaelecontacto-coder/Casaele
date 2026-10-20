import Razorpay from 'razorpay'

// Where Razorpay may send people back to after paying.
const RETURN_HOSTS = (process.env.PAYMENT_RETURN_HOSTS || 'casadeele.co,www.casadeele.co,localhost')
  .split(',').map((h) => h.trim()).filter(Boolean)

const safeReturnUrl = (u) => {
  try {
    const url = new URL(String(u || ''))
    if (!['http:', 'https:'].includes(url.protocol) || !RETURN_HOSTS.includes(url.hostname)) return ''
    return url.origin + url.pathname
  } catch { return '' }
}

let razorpay
const getRazorpay = () => {
  if (razorpay) return razorpay
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return null
  razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET })
  return razorpay
}

/**
 * Adds "pay first" to a signup router made by makeSignupRouter({ deferEmails: true }):
 *  - POST /:id/pay-link  a Razorpay payment link for that signup (reused while unpaid)
 *  - POST /:id/verify    asks Razorpay whether it was paid; only then marks it paid
 *                        and sends the team alert + confirmation email, once.
 *
 * The model needs: paymentStatus, paymentLinkId, paymentLinkUrl, paymentId, amountPaid, paidAt.
 * The price comes from `priceFor(signup)` (INR, whole rupees), never from the browser.
 */
export function addPayment(router, { Model, priceFor, describe, who }) {
  router.post('/:id/pay-link', async (req, res) => {
    try {
      const signup = await Model.findById(req.params.id)
      if (!signup) return res.status(404).json({ message: 'Signup not found' })
      if (signup.paymentStatus === 'paid') return res.json({ paid: true })
      if (signup.paymentLinkUrl) return res.json({ paid: false, url: signup.paymentLinkUrl })

      const amount = priceFor(signup)
      if (!amount) return res.status(400).json({ message: 'Unknown plan' })
      const rz = getRazorpay()
      if (!rz) return res.status(503).json({ message: 'Payments are not available right now.' })

      const returnUrl = safeReturnUrl(req.body?.returnUrl)
      const link = await rz.paymentLink.create({
        amount: amount * 100,
        currency: 'INR',
        accept_partial: false,
        description: describe(signup),
        reference_id: String(signup._id),
        customer: { name: signup.name, email: signup.email },
        notify: { sms: false, email: false },
        reminder_enable: false,
        ...(returnUrl ? { callback_url: `${returnUrl}?signup=${signup._id}`, callback_method: 'get' } : {})
      })
      signup.paymentLinkId = link.id
      signup.paymentLinkUrl = link.short_url
      await signup.save()
      res.json({ paid: false, url: link.short_url })
    } catch (e) {
      console.error('Pay-link error:', e?.error?.description || e?.message || e)
      res.status(500).json({ message: 'Could not start the payment. Please try again.' })
    }
  })

  router.post('/:id/verify', async (req, res) => {
    try {
      const signup = await Model.findById(req.params.id)
      if (!signup) return res.status(404).json({ message: 'Signup not found' })
      if (signup.paymentStatus === 'paid') return res.json({ paid: true, ...who(signup) })
      if (!signup.paymentLinkId) return res.json({ paid: false, ...who(signup) })
      const rz = getRazorpay()
      if (!rz) return res.status(503).json({ message: 'Payments are not available right now.' })

      const link = await rz.paymentLink.fetch(signup.paymentLinkId)
      const payment = (link.payments || []).find((p) => p.status === 'captured' || p.status === 'paid')
      const expected = priceFor(signup) * 100
      if (link.status !== 'paid' || !expected || (link.amount_paid || 0) < expected || String(link.reference_id) !== String(signup._id)) {
        return res.json({ paid: false, ...who(signup) })
      }

      // Atomic flip so the emails go out exactly once, even if verify is hit twice.
      const updated = await Model.findOneAndUpdate(
        { _id: signup._id, paymentStatus: { $ne: 'paid' } },
        { paymentStatus: 'paid', paymentId: payment?.payment_id || '', amountPaid: (link.amount_paid || 0) / 100, paidAt: new Date() },
        { new: true }
      )
      if (updated) router.sendEmails(updated)
      res.json({ paid: true, ...who(signup) })
    } catch (e) {
      console.error('Verify error:', e?.error?.description || e?.message || e)
      res.status(500).json({ message: 'Could not check the payment. Please try again.' })
    }
  })
}
