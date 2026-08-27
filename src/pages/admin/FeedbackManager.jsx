import { useEffect, useMemo, useState } from 'react'
import { apiGet, apiSend } from '../../utils/api'
import { FaCheck, FaTimes, FaTrash } from 'react-icons/fa'

// Merged view over what used to be two separate admin pages (Comments,
// Reviews) — both now live in the same Feedback collection on the
// backend (Backend/models/Feedback.js). A "comment" is a plain note left
// on a material/chapter page; a "review" additionally carries a star
// rating and the course it's about.
export default function FeedbackManager() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actingId, setActingId] = useState('')
  const [filter, setFilter] = useState('all') // all | comment | review

  const load = () => {
    setLoading(true)
    setError('')
    apiGet('/api/feedback')
      .then(setItems)
      .catch((e) => setError(e?.message || 'Failed to load'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const act = async (id, action) => {
    try {
      setActingId(id)

      if (action === 'delete') {
        setItems((prev) => prev.filter((x) => x._id !== id))
        await apiSend(`/api/feedback/${id}`, 'DELETE')
        return
      }

      const status = action === 'approve' ? 'approved' : 'rejected'
      setItems((prev) => prev.map((x) => (x._id === id ? { ...x, status } : x)))
      await apiSend(`/api/feedback/${id}`, 'PUT', { status })
    } catch (e) {
      alert(e?.message || 'Action failed')
      load() // resync — the optimistic update above may be wrong now
    } finally {
      setActingId('')
    }
  }

  const filtered = useMemo(() => {
    if (filter === 'all') return items
    return items.filter((i) => i.type === filter)
  }, [items, filter])

  const counts = useMemo(() => ({
    all: items.length,
    comment: items.filter((i) => i.type === 'comment').length,
    review: items.filter((i) => i.type === 'review').length,
  }), [items])

  const statusChip = (status) => (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
      status === 'approved' ? 'bg-green-100 text-green-800'
      : status === 'rejected' ? 'bg-red-100 text-red-800'
      : 'bg-yellow-100 text-yellow-800'
    }`}>{status}</span>
  )

  const typeChip = (type) => (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
      type === 'review' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'
    }`}>{type === 'review' ? 'Review' : 'Comment'}</span>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Feedback</h1>
        <p className="text-sm text-gray-500 mt-1">Comments and course reviews, moderated in one place.</p>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="flex items-center gap-2">
        {[
          { key: 'all', label: `All (${counts.all})` },
          { key: 'comment', label: `Comments (${counts.comment})` },
          { key: 'review', label: `Reviews (${counts.review})` },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
              filter === f.key
                ? 'bg-red-700 text-white border-red-700'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
        <button
          onClick={load}
          disabled={loading}
          className="ml-auto px-3 py-1.5 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 text-sm"
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <div className="rounded-xl bg-white shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full text-left">
          <thead className="bg-gray-50 text-gray-600 text-sm">
            <tr>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Message</th>
              <th className="px-4 py-3">Rating</th>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td className="px-4 py-3" colSpan={8}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td className="px-4 py-3 text-gray-500" colSpan={8}>Nothing here.</td></tr>
            ) : filtered.map((f) => (
              <tr key={f._id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{typeChip(f.type)}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{f.name}</td>
                <td className="px-4 py-3 text-gray-700 max-w-sm truncate" title={f.text}>{f.text}</td>
                <td className="px-4 py-3 text-gray-700">{f.rating ? `${f.rating} ★` : '—'}</td>
                <td className="px-4 py-3 text-gray-700">{f.course?.title || '—'}</td>
                <td className="px-4 py-3 text-gray-700">{new Date(f.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">{statusChip(f.status)}</td>
                <td className="px-4 py-3 space-x-2 whitespace-nowrap">
                  {f.status !== 'approved' && (
                    <button
                      disabled={actingId === f._id}
                      onClick={() => act(f._id, 'approve')}
                      title="Approve"
                      className="p-2 rounded bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-60 transition"
                    >
                      <FaCheck />
                    </button>
                  )}
                  {f.status !== 'rejected' && (
                    <button
                      disabled={actingId === f._id}
                      onClick={() => act(f._id, 'reject')}
                      title="Reject"
                      className="p-2 rounded bg-yellow-50 text-yellow-700 hover:bg-yellow-100 disabled:opacity-60 transition"
                    >
                      <FaTimes />
                    </button>
                  )}
                  <button
                    disabled={actingId === f._id}
                    onClick={() => { if (confirm('Delete this permanently?')) act(f._id, 'delete') }}
                    title="Delete"
                    className="p-2 rounded bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-60 transition"
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
