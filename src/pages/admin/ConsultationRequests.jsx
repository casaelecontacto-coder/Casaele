import SignupsManager from './SignupsManager'

export default function ConsultationRequests() {
  return (
    <SignupsManager
      title="1:1 Consultations"
      endpoint="/api/consultations"
      columns={[{ key: 'duration', label: 'Length' }, { key: 'role', label: 'Role' }, { key: 'situation', label: 'Situation' }, { key: 'paymentStatus', label: 'Payment' }]}
      details={[
        { key: 'duration', label: 'Length' },
        { key: 'role', label: 'Role' },
        { key: 'situation', label: 'Situation' },
        { key: 'whatsapp', label: 'WhatsApp' },
        { key: 'age', label: 'Age' },
        { key: 'dream', label: 'Why Spanish, and what they want to achieve' },
        { key: 'gremlin', label: 'What stops them speaking confidently' },
        { key: 'notes', label: 'Anything else before the call' },
        { key: 'paymentStatus', label: 'Payment' },
        { key: 'amountPaid', label: 'Amount paid (INR)' },
        { key: 'paymentId', label: 'Razorpay payment id' }
      ]}
    />
  )
}
