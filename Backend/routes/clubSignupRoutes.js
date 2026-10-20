import ClubSignup from '../models/ClubSignup.js'
import { makeSignupRouter } from './signupRouter.js'
import { addPayment } from './signupPayment.js'

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

addPayment(router, {
  Model: ClubSignup,
  priceFor: (s) => priceFor(s.club, s.plan),
  describe: (s) => `Conversation Club - ${s.club} - ${s.plan}`,
  who: (s) => ({ name: s.name, club: s.club, plan: s.plan })
})

export default router
