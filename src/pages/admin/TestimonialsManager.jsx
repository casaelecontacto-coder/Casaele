import { useEffect, useState } from 'react'
import { apiGet, apiSend } from '../../utils/api'

export default function TestimonialsManager() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actingId, setActingId] = useState('')
  const [actingType, setActingType] = useState('')

  const load = () => {
    setLoading(true)
    apiGet('/api/testimonials')
      .then(setItems)
      .catch(e => setError(e?.message || 'Failed to load'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const act = async (id, action) => {
    try {
      setActingId(id)
      setActingType(action)
      const url = action === 'approve' ? `/api/testimonials/approve/${id}` : action === 'reject' ? `/api/testimonials/reject/${id}` : `/api/testimonials/${id}`
      const method = action === 'delete' ? 'DELETE' : 'PUT'

      // Optimistic UI
      if (action === 'approve' || action === 'reject') {
        const newStatus = action === 'approve' ? 'approved' : 'rejected'
        setItems(prev => prev.map(x => x._id === id ? { ...x, status: newStatus } : x))
      } else if (action === 'delete') {
        setItems(prev => prev.filter(x => x._id !== id))
      }

      await apiSend(url, method)
    } catch (e) { alert(e?.message || 'Action failed') }
    finally { setActingId(''); setActingType('') }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Testimonials Manager</h1>
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div className="rounded-xl bg-white shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-3 border-b text-sm text-gray-600">Moderate user testimonials</div>
        <table className="min-w-full text-left">
          <thead className="bg-gray-50 text-gray-600 text-sm">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Message</th>
              <th className="px-4 py-3">Rating</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td className="px-4 py-3" colSpan={6}>Loading...</td></tr>
            ) : items.map(t => (
              <tr key={t._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{t.name}</td>
                <td className="px-4 py-3 text-gray-700 max-w-md truncate" title={t.message}>{t.message}</td>
                <td className="px-4 py-3 text-gray-700">{t.rating || '-'}</td>
                <td className="px-4 py-3 text-gray-700">{new Date(t.date || t.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3"><span className={`px-2 py-1 text-xs rounded-full ${t.status==='approved'?'bg-green-50 text-green-700':t.status==='rejected'?'bg-red-50 text-red-700':'bg-gray-100 text-gray-700'}`}>{t.status}</span></td>
                <td className="px-4 py-3 space-x-2">
                  {t.status !== 'approved' && (
                    <button disabled={actingId===t._id} onClick={() => act(t._id, 'approve')} className="px-3 py-1 rounded bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-60">{actingId===t._id && actingType==='approve' ? 'Approving...' : 'Approve'}</button>
                  )}
                  {t.status !== 'rejected' && (
                    <button disabled={actingId===t._id} onClick={() => act(t._id, 'reject')} className="px-3 py-1 rounded bg-yellow-50 text-yellow-700 hover:bg-yellow-100 disabled:opacity-60">{actingId===t._id && actingType==='reject' ? 'Rejecting...' : 'Reject'}</button>
                  )}
                  <button disabled={actingId===t._id} onClick={() => { if (confirm('Delete this testimonial?')) act(t._id, 'delete') }} className="px-3 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-60">{actingId===t._id && actingType==='delete' ? 'Deleting...' : 'Delete'}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}


