import { useEffect, useState } from 'react'
import { apiGet, apiSend } from '../../utils/api'

export default function TestimonialsManager() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actingId, setActingId] = useState('')
  const [actingType, setActingType] = useState('')
  const [selectedTestimonial, setSelectedTestimonial] = useState(null)

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
      {error && <div className="text-sm text-casa-red">{error}</div>}
      <div className="rounded-xl bg-white shadow-sm border border-casa-ink/12 overflow-hidden">
        <div className="p-3 border-b text-sm text-casa-ink/65">Moderate user testimonials</div>
        <table className="min-w-full text-left">
          <thead className="bg-casa-cream/40 text-casa-ink/65 text-sm">
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
              <tr key={t._id} className="hover:bg-casa-cream/40">
                <td className="px-4 py-3 font-medium text-casa-ink">{t.name}</td>
                <td className="px-4 py-3 text-casa-ink/75 max-w-md truncate cursor-pointer hover:text-blue-600" title="Click to view full message" onClick={() => setSelectedTestimonial(t)}>{t.message}</td>
                <td className="px-4 py-3 text-casa-ink/75">{t.rating || '-'}</td>
                <td className="px-4 py-3 text-casa-ink/75">{new Date(t.date || t.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3"><span className={`px-2 py-1 text-xs rounded-full ${t.status==='approved'?'bg-green-50 text-green-700':t.status==='rejected'?'bg-casa-red/8 text-casa-red':'bg-casa-cream/60 text-casa-ink/75'}`}>{t.status}</span></td>
                <td className="px-4 py-3 space-x-2">
                  {t.status !== 'approved' && (
                    <button disabled={actingId===t._id} onClick={() => act(t._id, 'approve')} className="px-3 py-1 rounded bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-60">{actingId===t._id && actingType==='approve' ? 'Approving...' : 'Approve'}</button>
                  )}
                  {t.status !== 'rejected' && (
                    <button disabled={actingId===t._id} onClick={() => act(t._id, 'reject')} className="px-3 py-1 rounded bg-yellow-50 text-yellow-700 hover:bg-yellow-100 disabled:opacity-60">{actingId===t._id && actingType==='reject' ? 'Rejecting...' : 'Reject'}</button>
                  )}
                  <button disabled={actingId===t._id} onClick={() => { if (confirm('Delete this testimonial?')) act(t._id, 'delete') }} className="px-3 py-1 rounded bg-casa-red/8 text-casa-red hover:bg-red-100 disabled:opacity-60">{actingId===t._id && actingType==='delete' ? 'Deleting...' : 'Delete'}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {selectedTestimonial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-casa-ink/12 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-casa-ink">Testimonial Details</h2>
              <button onClick={() => setSelectedTestimonial(null)} aria-label="Close testimonial" className="inline-flex items-center justify-center w-8 h-8 rounded-xl text-casa-ink/50 hover:bg-casa-cream/60">
                <span className="text-xl leading-none">×</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-casa-ink/65">Name</p>
                <p className="text-casa-ink font-medium">{selectedTestimonial.name}</p>
              </div>
              <div>
                <p className="text-sm text-casa-ink/65">Email</p>
                <p className="text-casa-ink">{selectedTestimonial.email}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-casa-ink/65">Country</p>
                  <p className="text-casa-ink">{selectedTestimonial.country}</p>
                </div>
                <div>
                  <p className="text-sm text-casa-ink/65">Profession</p>
                  <p className="text-casa-ink">{selectedTestimonial.profession}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-casa-ink/65">Level</p>
                  <p className="text-casa-ink">{selectedTestimonial.level}</p>
                </div>
                <div>
                  <p className="text-sm text-casa-ink/65">Rating</p>
                  <p className="text-casa-ink">{selectedTestimonial.rating || '-'}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-casa-ink/65">Message</p>
                <p className="text-casa-ink whitespace-pre-wrap bg-casa-cream/40 p-3 rounded border border-casa-ink/12 mt-1">{selectedTestimonial.message}</p>
              </div>
              <div>
                <p className="text-sm text-casa-ink/65">Status</p>
                <p className={`inline-block px-3 py-1 text-xs rounded-full font-medium ${selectedTestimonial.status==='approved'?'bg-green-50 text-green-700':selectedTestimonial.status==='rejected'?'bg-casa-red/8 text-casa-red':'bg-casa-cream/60 text-casa-ink/75'}`}>{selectedTestimonial.status}</p>
              </div>
              <div>
                <p className="text-sm text-casa-ink/65">Date</p>
                <p className="text-casa-ink">{new Date(selectedTestimonial.date || selectedTestimonial.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="border-t border-casa-ink/12 p-6 flex justify-end gap-3">
              <button onClick={() => setSelectedTestimonial(null)} className="px-4 py-2 border border-casa-ink/20 rounded-xl text-casa-ink/75 hover:bg-casa-cream/40">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


