import ConsultationRequest from '../models/ConsultationRequest.js'
import { makeSignupRouter } from './signupRouter.js'
import { addPayment } from './signupPayment.js'

// Prices live here, not in the browser, so nobody can pay less by editing the page.
export const CONSULTATION_PRICES = { 30: 549, 60: 999 }
const priceFor = (s) => CONSULTATION_PRICES[parseInt(s.duration, 10)] || 0

const router = makeSignupRouter({
  Model: ConsultationRequest,
  title: 'New 1:1 consultation request',
  adminLabel: '1:1 Consultations',
  fields: [
    { key: 'duration', label: 'Length' },
    { key: 'role', label: 'Who they are', max: 200 },
    { key: 'situation', label: 'Where they are with Spanish', max: 200 },
    { key: 'whatsapp', label: 'WhatsApp', max: 40 },
    { key: 'age', label: 'Age', max: 10 },
    { key: 'dream', label: 'Why they are learning Spanish and what they want to achieve', max: 2000 },
    { key: 'gremlin', label: 'What stops them speaking confidently (the gremlin)', max: 2000 },
    { key: 'notes', label: 'Anything else to know before the call', max: 2000 }
  ],
  // The team alert and the confirmation email go out once the payment is confirmed.
  deferEmails: true,
  confirmation: (e) => {
    const len = String(e.duration || '').replace(/\s*minutes?/i, '-minute').trim()
    return {
      subject: 'We received your consultation request',
      message: `We received your payment and your request for a${len ? ` ${len}` : ''} consultation. We'll contact you shortly.`
    }
  }
})

addPayment(router, {
  Model: ConsultationRequest,
  priceFor,
  describe: (s) => `1:1 Spanish consultation - ${s.duration}`,
  who: (s) => ({ name: s.name, duration: s.duration })
})

export default router
