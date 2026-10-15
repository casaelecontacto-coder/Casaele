import ClubSignup from '../models/ClubSignup.js'
import { makeSignupRouter } from './signupRouter.js'

export default makeSignupRouter({
  Model: ClubSignup,
  title: 'New Club de Conversación signup',
  adminLabel: 'Conversation Club',
  fields: [
    { key: 'club', label: 'Club' },
    { key: 'plan', label: 'Plan' }
  ],
  // The same person can't sign up twice for the same club and plan.
  dedupeBy: ['club', 'plan'],
  confirmation: (e) => ({
    subject: 'You\'re signed up for Club de Conversación',
    message: `Thanks for signing up for the ${e.club || 'Club de Conversación'} club${e.plan ? `, ${e.plan} plan` : ''}. We'll be in touch with the next steps.`
  })
})
