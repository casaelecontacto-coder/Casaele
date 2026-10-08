import { useEffect, useMemo, useState } from 'react'
import { FiTrash2 } from 'react-icons/fi'
import { apiGet, apiSend } from '../../utils/api'

// Moderation view for the comments learners post under each course chapter
// (the "Comments" box in the chapter reader on Course Chapters). Separate from
// Feedback, which is the school-wide testimonial/review feed.
export default function ChapterComments() {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [chapter, setChapter] = useState('all')
  const [query, setQuery] = useState('')
  const [busyId, setBusyId] = useState('')

  const load = () => {
    setLoading(true)
    setError('')
    apiGet('/api/chapter-comments/admin/all')
      .then((d) => setComments(d.comments || []))
      .catch((e) => setError(e?.message || 'Failed to load comments'))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const chapters = useMemo(() => {
    const seen = new Map()
    comments.forEach((c) => { if (c.chapter) seen.set(c.chapter._id, c.chapter.title) })
    return [...seen].sort((a, b) => a[1].localeCompare(b[1]))
  }, [comments])

  // Threads: pinned first, then newest first; replies oldest first under their root.
  const threads = useMemo(() => {
    const q = query.trim().toLowerCase()
    const inChapter = (c) => chapter === 'all' || c.chapter?._id === chapter
    const matches = (c) => !q || c.text.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
    const replies = {}
    comments.filter((c) => c.parent).forEach((c) => { (replies[c.parent] = replies[c.parent] || []).push(c) })
    Object.values(replies).forEach((r) => r.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)))
    return comments
      .filter((c) => !c.parent && inChapter(c))
      .map((root) => ({ root, replies: replies[root._id] || [] }))
      .filter(({ root, replies: r }) => matches(root) || r.some(matches))
      .sort((a, b) => (b.root.pinned - a.root.pinned) || (new Date(b.root.createdAt) - new Date(a.root.createdAt)))
  }, [comments, chapter, query])

  const togglePin = async (c) => {
    setBusyId(c._id)
    try {
      await apiSend(`/api/chapter-comments/${c._id}/pin`, 'PATCH', { pinned: !c.pinned })
      // The server unpins any other pinned comment in the same chapter.
      setComments((prev) => prev.map((x) => {
        if (x._id === c._id) return { ...x, pinned: !c.pinned }
        if (!c.pinned && x.chapter?._id === c.chapter?._id) return { ...x, pinned: false }
        return x
      }))
    } catch (e) { alert(e?.message || 'Could not update the comment') }
    finally { setBusyId('') }
  }

  const remove = async (c, replyCount) => {
    const extra = replyCount ? ` Its ${replyCount} repl${replyCount === 1 ? 'y' : 'ies'} will be deleted too.` : ''
    if (!window.confirm(`Delete this comment by ${c.name}?${extra}`)) return
    setBusyId(c._id)
    try {
      const data = await apiSend(`/api/chapter-comments/${c._id}`, 'DELETE')
      const gone = new Set((data.deletedIds || [c._id]).map(String))
      setComments((prev) => prev.filter((x) => !gone.has(String(x._id))))
    } catch (e) { alert(e?.message || 'Could not delete the comment') }
    finally { setBusyId('') }
  }

  const fmt = (d) => new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })

  const Row = ({ c, replyCount = 0, isReply }) => (
    <div className={`flex gap-3 py-3 ${isReply ? 'ml-10 border-l-2 border-casa-ink/10 pl-4' : ''}`}>
      {c.photoUrl
        ? <img src={c.photoUrl} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
        : <div className="w-8 h-8 rounded-full bg-casa-ink/10 flex items-center justify-center text-xs font-semibold shrink-0">{c.name.slice(0, 1).toUpperCase()}</div>}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
          <strong>{c.name}</strong>
          {c.replyToName && <span className="text-casa-red">@{c.replyToName}</span>}
          <span className="text-casa-ink/50 text-xs">{fmt(c.createdAt)}</span>
          {c.pinned && <span className="text-xs font-semibold bg-amber-100 text-amber-800 rounded-full px-2 py-0.5">📌 Pinned</span>}
        </div>
        <p className="mt-1 text-sm whitespace-pre-wrap break-words">{c.text}</p>
      </div>
      <div className="flex items-start gap-1 shrink-0">
        {!isReply && (
          <button disabled={busyId === c._id} onClick={() => togglePin(c)} className="text-xs px-2.5 py-1.5 rounded-lg border border-casa-ink/15 hover:bg-amber-50 disabled:opacity-50">
            {c.pinned ? 'Unpin' : 'Pin'}
          </button>
        )}
        <button disabled={busyId === c._id} onClick={() => remove(c, replyCount)} aria-label="Delete comment" className="p-2 rounded-lg text-casa-red hover:bg-casa-red/8 disabled:opacity-50">
          <FiTrash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Chapter Comments</h1>
        <p className="text-sm text-casa-ink/65 mt-1">Everything learners post under chapters. Pin one comment per chapter to keep it on top, or delete the ones that aren't okay.</p>
      </div>
      {error && <div className="text-sm text-casa-red">{error}</div>}

      <div className="flex flex-wrap gap-3">
        <select value={chapter} onChange={(e) => setChapter(e.target.value)} className="px-3 py-2 border border-casa-ink/20 rounded-xl text-sm bg-white">
          <option value="all">All chapters</option>
          {chapters.map(([id, title]) => <option key={id} value={id}>{title}</option>)}
        </select>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search text or name…" className="flex-1 min-w-[200px] px-3 py-2 border border-casa-ink/20 rounded-xl text-sm" />
        <button onClick={load} className="px-3 py-2 text-sm rounded-xl border border-casa-ink/20 bg-white hover:bg-casa-cream/40">Refresh</button>
      </div>

      {loading ? (
        <div className="text-sm text-casa-ink/50">Loading…</div>
      ) : threads.length === 0 ? (
        <div className="rounded-xl bg-white border border-casa-ink/12 p-8 text-center text-casa-ink/50 text-sm">No comments{query || chapter !== 'all' ? ' match this filter' : ' yet'}.</div>
      ) : (
        <div className="space-y-4">
          {threads.map(({ root, replies }) => (
            <div key={root._id} className={`rounded-xl bg-white shadow-sm border px-4 ${root.pinned ? 'border-amber-300' : 'border-casa-ink/12'}`}>
              <div className="pt-3 text-xs font-semibold uppercase tracking-wide text-casa-ink/50">
                {root.chapter ? `${root.chapter.title}${root.chapter.level ? ` · ${root.chapter.level}` : ''}` : 'Deleted chapter'}
              </div>
              <div className="divide-y divide-casa-ink/10">
                <Row c={root} replyCount={replies.length} />
                {replies.map((r) => <Row key={r._id} c={r} isReply />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
