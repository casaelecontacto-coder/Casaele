import ConsultationRequest from '../models/ConsultationRequest.js'
import { makeSignupRouter } from './signupRouter.js'

export default makeSignupRouter({
  Model: ConsultationRequest,
  title: 'New 1:1 consultation request',
  adminLabel: '1:1 Consultations',
  fields: [{ key: 'duration', label: 'Length' }]
})
