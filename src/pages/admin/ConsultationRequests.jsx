import SignupsManager from './SignupsManager'

export default function ConsultationRequests() {
  return (
    <SignupsManager
      title="1:1 Consultations"
      endpoint="/api/consultations"
      columns={[{ key: 'duration', label: 'Length' }, { key: 'role', label: 'Role' }, { key: 'situation', label: 'Situation' }]}
    />
  )
}
