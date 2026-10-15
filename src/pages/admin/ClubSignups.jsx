import SignupsManager from './SignupsManager'

export default function ClubSignups() {
  return (
    <SignupsManager
      title="Conversation Club"
      endpoint="/api/club-signups"
      columns={[{ key: 'club', label: 'Club' }, { key: 'plan', label: 'Plan' }]}
    />
  )
}
