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
  dedupeBy: ['club', 'plan']
})
