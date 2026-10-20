import SignupsManager from './SignupsManager'

export default function ClubSignups() {
  return (
    <SignupsManager
      title="Conversation Club"
      endpoint="/api/club-signups"
      columns={[{ key: 'club', label: 'Club' }, { key: 'plan', label: 'Plan' }, { key: 'paymentStatus', label: 'Payment' }, { key: 'whatsapp', label: 'WhatsApp' }]}
      details={[
        { key: 'club', label: 'Club' },
        { key: 'plan', label: 'Plan' },
        { key: 'paymentStatus', label: 'Payment' },
        { key: 'amountPaid', label: 'Amount paid (INR)' },
        { key: 'paymentId', label: 'Razorpay payment id' },
        { key: 'whatsapp', label: 'WhatsApp' },
        { key: 'age', label: 'Age' },
        { key: 'superpower', label: 'If Spanish were a superpower, what would you want to do with it?' },
        { key: 'confidence', label: 'What would help you speak confidently?' },
        { key: 'culture', label: 'Into Spanish-speaking cultures, people, music, food, films, football, memes…?' }
      ]}
    />
  )
}
