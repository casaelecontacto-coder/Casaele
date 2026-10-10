import { useEffect, useState } from 'react'
import { apiGet, apiSend } from '../../utils/api'

export default function WaitlistManager() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actingId, setActingId] = useState('')

  useEffect(() => {
    apiGet('/api/waitlist')
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch((e) => setError(e?.message || 'Failed to load'))
      .finally(() => setLoading(false))
  }, [])

  const setStatus = async (id, status) => {
    try {
      setActingId(id)
      setItems((prev) => prev.map((x) => (x._id === id ? { ...x, status } : x)))
      await apiSend(`/api/waitlist/${id}/status`, 'PUT', { status })
    } catch (e) { alert(e?.message || 'Action failed') }
    finally { setActingId('') }
  }

  const remove = async (id) => {
    try {
      setActingId(id)
      setItems((prev) => prev.filter((x) => x._id !== id))
      await apiSend(`/api/waitlist/${id}`, 'DELETE')
    } catch (e) { alert(e?.message || 'Delete failed') }
    finally { setActingId('') }
  }

  const waiting = items.filter((x) => x.status !== 'contacted').length

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Waiting List</h1>
      {error && <div className="text-sm text-casa-red">{error}</div>}
      <div className="rounded-xl bg-white shadow-sm border border-casa-ink/12 overflow-x-auto">
        <div className="p-3 border-b text-sm text-casa-ink/65">
          {items.length} total · {waiting} still waiting. Contact people only when a seat opens.
        </div>
        <table className="min-w-full text-left">
          <thead className="bg-casa-cream/40 text-casa-ink/65 text-sm">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td className="px-4 py-3" colSpan={7}>Loading...</td></tr>
            ) : items.length === 0 ? (
              <tr><td className="px-4 py-3 text-casa-ink/65" colSpan={7}>No one on the waiting list yet.</td></tr>
            ) : items.map((x) => (
              <tr key={x._id} className="hover:bg-casa-cream/40">
                <td className="px-4 py-3 font-medium text-casa-ink">{x.name}</td>
                <td className="px-4 py-3 text-casa-ink/75"><a href={`mailto:${x.email}`} className="hover:underline">{x.email}</a></td>
                <td className="px-4 py-3 text-casa-ink/75">{x.phone || '-'}</td>
                <td className="px-4 py-3 text-casa-ink/75">{x.course || '-'}</td>
                <td className="px-4 py-3 text-casa-ink/75">{new Date(x.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3"><span className={`px-2 py-1 text-xs rounded-full ${x.status === 'contacted' ? 'bg-green-50 text-green-700' : 'bg-casa-cream/60 text-casa-ink/75'}`}>{x.status === 'contacted' ? 'contacted' : 'waiting'}</span></td>
                <td className="px-4 py-3 space-x-2 whitespace-nowrap">
                  {x.status === 'contacted' ? (
                    <button disabled={actingId === x._id} onClick={() => setStatus(x._id, 'waiting')} className="px-3 py-1 rounded bg-yellow-50 text-yellow-700 hover:bg-yellow-100 disabled:opacity-60">Back to waiting</button>
                  ) : (
                    <button disabled={actingId === x._id} onClick={() => setStatus(x._id, 'contacted')} className="px-3 py-1 rounded bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-60">Mark contacted</button>
                  )}
                  <button disabled={actingId === x._id} onClick={() => { if (confirm('Remove this person from the waiting list?')) remove(x._id) }} className="px-3 py-1 rounded bg-casa-red/8 text-casa-red hover:bg-red-100 disabled:opacity-60">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
