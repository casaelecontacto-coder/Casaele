import React, { useState } from "react";
import { apiSend } from "../../../utils/api";

function CommentForm() {
  const [name, setName] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setNotice("")
    if (!name.trim() || !message.trim()) {
      setNotice("Please fill name and comment")
      return
    }
    setLoading(true)
    try {
      await apiSend('/api/comments/add', 'POST', { name: name.trim(), message: message.trim() })
      setNotice("Thanks! Your comment is pending approval.")
      setName("")
      setMessage("")
    } catch (e) {
      setNotice(e?.message || 'Failed to submit comment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <input value={name} onChange={e=>setName(e.target.value)} type="text" placeholder="Your Name *" className="border border-gray-300 px-4 py-3 rounded-xl w-full" />
        </div>
        <div className="mb-3">
          <textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="Comment" className="border border-gray-300 rounded-xl px-4 py-3 w-full h-32 resize-none"></textarea>
        </div>
        {notice && <div className="mb-3 text-sm text-gray-600">{notice}</div>}
        <div className="text-center">
          <button disabled={loading} className="bg-[rgba(173,21,24,1)] text-white w-full py-3 rounded-full hover:bg-red-700 transition-colors font-semibold text-lg">
            {loading ? 'Submitting...' : 'Publicar el comentario'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CommentForm;