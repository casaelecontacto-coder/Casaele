import ConsultationRequest from '../models/ConsultationRequest.js'
import { makeSignupRouter } from './signupRouter.js'

export default makeSignupRouter({
  Model: ConsultationRequest,
  title: 'New 1:1 consultation request',
  adminLabel: '1:1 Consultations',
  fields: [{ key: 'duration', label: 'Length' }],
  confirmation: (e) => {
    const len = String(e.duration || '').replace(/\s*minutes?/i, '-minute').trim()
    return {
      subject: 'We received your consultation request',
      message: `We received your request for a${len ? ` ${len}` : ''} consultation. We'll contact you shortly.`
    }
  }
})
