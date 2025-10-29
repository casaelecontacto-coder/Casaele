import React, { useEffect, useState } from "react";
import { apiGet } from "../../../utils/api";

function CommentList() {
  const [visibleCount, setVisibleCount] = useState(4);
  const [isLatestFirst, setIsLatestFirst] = useState(true);
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    apiGet('/api/comments/approved')
      .then(data => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  const sorted = [...items].sort((a, b) => {
    const dA = new Date(a.date);
    const dB = new Date(b.date);
    return isLatestFirst ? dB - dA : dA - dB;
  });

  return (
    <div className="w-full pt-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 mb-3 sm:mb-0">
          All Comments <span className="text-gray-400 font-medium">({items.length})</span>
        </h2>
        <button onClick={() => setIsLatestFirst((p) => !p)} className="border border-gray-300 rounded-full px-4 py-1 text-sm hover:bg-gray-100 transition-colors">
          {isLatestFirst ? "Latest" : "Oldest"}
        </button>
      </div>

      {/* Comment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-8">
        {loading ? (
          <div className="text-gray-500">Loading comments...</div>
        ) : sorted.slice(0, visibleCount).map((c, i) => (
          <div key={i} className="border border-gray-200 rounded-xl p-6">
            <h4 className="font-semibold text-gray-800 mb-2">{c.name}</h4>
            <p className="text-gray-600 text-base mb-4">"{c.message}"</p>
            <p className="text-xs text-gray-400">Posted on {new Date(c.date).toLocaleDateString()}</p>
          </div>
        ))}
      </div>

      {/* Load More */}
      {visibleCount < items.length && (
        <div className="flex justify-center pt-4">
          <button onClick={() => setVisibleCount((p) => p + 4)} className="border border-gray-300 rounded-full px-6 py-2 text-sm font-medium hover:bg-gray-100 transition-colors">
            Load More Comments
          </button>
        </div>
      )}
    </div>
  );
}

export default CommentList;