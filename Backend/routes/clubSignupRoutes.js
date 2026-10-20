import Razorpay from 'razorpay'
import ClubSignup from '../models/ClubSignup.js'
import { makeSignupRouter } from './signupRouter.js'

// Prices live here, not in the browser, so nobody can pay less by editing the page.
export const CLUB_PRICES = {
  lower: { title: 'Lower intermediate', monthly: 2200, bimonthly: 4200, fourmonth: 8000 },
  higher: { title: 'Higher intermediate', monthly: 2400, bimonthly: 4480, fourmonth: 8480 }
}
const PLAN_NAMES = { monthly: 'Monthly', bimonthly: 'Bi-Monthly', fourmonth: 'Four-Month' }

const priceFor = (clubTitle, planName) => {
  const club = Object.values(CLUB_PRICES).find((c) => c.title === clubTitle)
  const planKey = Object.keys(PLAN_NAMES).find((k) => PLAN_NAMES[k] === planName)
  return club && planKey ? club[planKey] : 0
}

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

const router = makeSignupRouter({
  Model: ClubSignup,
  title: 'New Club de Conversación signup',
  adminLabel: 'Conversation Club',
  fields: [
    { key: 'club', label: 'Club' },
    { key: 'plan', label: 'Plan' },
    { key: 'whatsapp', label: 'WhatsApp', max: 40 },
    { key: 'age', label: 'Age', max: 10 },
    { key: 'superpower', label: 'If Spanish were a superpower', max: 2000 },
    { key: 'confidence', label: 'What would help them speak confidently', max: 2000 },
    { key: 'culture', label: 'Into Spanish-speaking cultures', max: 2000 }
  ],
  // The same person can't sign up twice for the same club and plan.
  dedupeBy: ['club', 'plan'],
  // The team alert and the confirmation email go out once the payment is confirmed.
  deferEmails: true,
  confirmation: (e) => ({
    subject: 'You\'re signed up for Club de Conversación',
    message: `Thanks for signing up for the ${e.club || 'Club de Conversación'} club${e.plan ? `, ${e.plan} plan` : ''}. We've received your payment and we'll be in touch with the next steps.`
  })
})

// POST /:id/pay-link  -> a Razorpay payment link for this signup (reused while unpaid)
router.post('/:id/pay-link', async (req, res) => {
  try {
    const signup = await ClubSignup.findById(req.params.id)
    if (!signup) return res.status(404).json({ message: 'Signup not found' })
    if (signup.paymentStatus === 'paid') return res.json({ paid: true })
    if (signup.paymentLinkUrl) return res.json({ paid: false, url: signup.paymentLinkUrl })

    const amount = priceFor(signup.club, signup.plan)
    if (!amount) return res.status(400).json({ message: 'Unknown club or plan' })
    const rz = getRazorpay()
    if (!rz) return res.status(503).json({ message: 'Payments are not available right now.' })

    const link = await rz.paymentLink.create({
      amount: amount * 100,
      currency: 'INR',
      accept_partial: false,
      description: `Conversation Club - ${signup.club} - ${signup.plan}`,
      reference_id: String(signup._id),
      customer: { name: signup.name, email: signup.email },
      notify: { sms: false, email: false },
      reminder_enable: false,
      ...(safeReturnUrl(req.body?.returnUrl)
        ? { callback_url: `${safeReturnUrl(req.body.returnUrl)}?signup=${signup._id}`, callback_method: 'get' }
        : {})
    })
    signup.paymentLinkId = link.id
    signup.paymentLinkUrl = link.short_url
    await signup.save()
    res.json({ paid: false, url: link.short_url })
  } catch (e) {
    console.error('Club pay-link error:', e?.error?.description || e?.message || e)
    res.status(500).json({ message: 'Could not start the payment. Please try again.' })
  }
})

// POST /:id/verify  -> asks Razorpay whether the link was paid; only then marks it paid
const who = (s) => ({ name: s.name, club: s.club, plan: s.plan })

router.post('/:id/verify', async (req, res) => {
  try {
    const signup = await ClubSignup.findById(req.params.id)
    if (!signup) return res.status(404).json({ message: 'Signup not found' })
    if (signup.paymentStatus === 'paid') return res.json({ paid: true, ...who(signup) })
    if (!signup.paymentLinkId) return res.json({ paid: false, ...who(signup) })
    const rz = getRazorpay()
    if (!rz) return res.status(503).json({ message: 'Payments are not available right now.' })

    const link = await rz.paymentLink.fetch(signup.paymentLinkId)
    const payment = (link.payments || []).find((p) => p.status === 'captured' || p.status === 'paid')
    const expected = priceFor(signup.club, signup.plan) * 100
    if (link.status !== 'paid' || (link.amount_paid || 0) < expected || String(link.reference_id) !== String(signup._id)) {
      return res.json({ paid: false, ...who(signup) })
    }

    // Atomic flip so the emails go out exactly once, even if verify is hit twice.
    const updated = await ClubSignup.findOneAndUpdate(
      { _id: signup._id, paymentStatus: { $ne: 'paid' } },
      { paymentStatus: 'paid', paymentId: payment?.payment_id || '', amountPaid: (link.amount_paid || 0) / 100, paidAt: new Date() },
      { new: true }
    )
    if (updated) router.sendEmails(updated)
    res.json({ paid: true, ...who(signup) })
  } catch (e) {
    console.error('Club verify error:', e?.error?.description || e?.message || e)
    res.status(500).json({ message: 'Could not check the payment. Please try again.' })
  }
})

export default router
