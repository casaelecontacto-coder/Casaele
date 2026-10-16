import ClubSignup from '../models/ClubSignup.js'
import { makeSignupRouter } from './signupRouter.js'

export default makeSignupRouter({
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
  confirmation: (e) => ({
    subject: 'You\'re signed up for Club de Conversación',
    message: `Thanks for signing up for the ${e.club || 'Club de Conversación'} club${e.plan ? `, ${e.plan} plan` : ''}. We'll be in touch with the next steps.`
  })
})
