import { useEffect, useState } from 'react'
import { apiGet, apiSend } from '../../utils/api'

// Shared admin table for "someone signed up" collections (club signups,
// 1:1 consultation requests). Each page passes its endpoint and extra columns.
export default function SignupsManager({ title, endpoint, columns, hint, details }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actingId, setActingId] = useState('')
  const [viewing, setViewing] = useState(null)

  useEffect(() => {
    apiGet(endpoint)
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch((e) => setError(e?.message || 'Failed to load'))
      .finally(() => setLoading(false))
  }, [endpoint])

  const setStatus = async (id, status) => {
    try {
      setActingId(id)
      setItems((prev) => prev.map((x) => (x._id === id ? { ...x, status } : x)))
      await apiSend(`${endpoint}/${id}/status`, 'PUT', { status })
    } catch (e) { alert(e?.message || 'Action failed') }
    finally { setActingId('') }
  }

  const remove = async (id) => {
    try {
      setActingId(id)
      setItems((prev) => prev.filter((x) => x._id !== id))
      await apiSend(`${endpoint}/${id}`, 'DELETE')
    } catch (e) { alert(e?.message || 'Delete failed') }
    finally { setActingId('') }
  }

  const fresh = items.filter((x) => x.status !== 'contacted').length
  const colSpan = columns.length + 5

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{title}</h1>
      {error && <div className="text-sm text-casa-red">{error}</div>}
      <div className="rounded-xl bg-white shadow-sm border border-casa-ink/12 overflow-x-auto">
        <div className="p-3 border-b text-sm text-casa-ink/65">
          {items.length} total · {fresh} not contacted yet.{hint ? ` ${hint}` : ''}
        </div>
        <table className="min-w-full text-left">
          <thead className="bg-casa-cream/40 text-casa-ink/65 text-sm">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              {columns.map((c) => <th key={c.key} className="px-4 py-3">{c.label}</th>)}
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td className="px-4 py-3" colSpan={colSpan}>Loading...</td></tr>
            ) : items.length === 0 ? (
              <tr><td className="px-4 py-3 text-casa-ink/65" colSpan={colSpan}>Nobody yet.</td></tr>
            ) : items.map((x) => (
              <tr key={x._id} className="hover:bg-casa-cream/40">
                <td className="px-4 py-3 font-medium text-casa-ink">{x.name}</td>
                <td className="px-4 py-3 text-casa-ink/75"><a href={`mailto:${x.email}`} className="hover:underline">{x.email}</a></td>
                {columns.map((c) => <td key={c.key} className="px-4 py-3 text-casa-ink/75">{x[c.key] || '-'}</td>)}
                <td className="px-4 py-3 text-casa-ink/75">{new Date(x.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3"><span className={`px-2 py-1 text-xs rounded-full ${x.status === 'contacted' ? 'bg-green-50 text-green-700' : 'bg-casa-cream/60 text-casa-ink/75'}`}>{x.status === 'contacted' ? 'contacted' : 'new'}</span></td>
                <td className="px-4 py-3 space-x-2 whitespace-nowrap">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none text-casa-ink/80">
                    <input
                      type="checkbox"
                      checked={x.status === 'contacted'}
                      disabled={actingId === x._id}
                      onChange={(e) => setStatus(x._id, e.target.checked ? 'contacted' : 'new')}
                      className="w-4 h-4 accent-green-600"
                    />
                    Contacted
                  </label>
                  {details && <button onClick={() => setViewing(x)} className="px-3 py-1 rounded bg-casa-cream/60 text-casa-ink hover:bg-casa-cream">Answers</button>}
                  <button disabled={actingId === x._id} onClick={() => { if (confirm('Delete this entry?')) remove(x._id) }} className="px-3 py-1 rounded bg-casa-red/8 text-casa-red hover:bg-red-100 disabled:opacity-60">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {viewing && details && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setViewing(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-casa-ink/12 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-casa-ink">{viewing.name}</h2>
              <button onClick={() => setViewing(null)} aria-label="Close" className="inline-flex items-center justify-center w-8 h-8 rounded-xl text-casa-ink/50 hover:bg-casa-cream/60"><span className="text-xl leading-none">×</span></button>
            </div>
            <div className="p-6 space-y-4">
              {[['Email', 'email'], ...details.map((d) => [d.label, d.key])].map(([label, key]) => (
                <div key={key}>
                  <p className="text-sm text-casa-ink/65">{label}</p>
                  <p className="text-casa-ink whitespace-pre-wrap">{viewing[key] || '-'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
