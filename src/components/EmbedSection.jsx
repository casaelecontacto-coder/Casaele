import React, { useEffect, useState } from 'react'

export default function EmbedSection({ type }) {
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [loadingIds, setLoadingIds] = useState({})

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/embeds', { headers: buildAuth() })
        const data = await res.json()
        const filtered = type ? data.filter(d => d.type === type) : data
        setItems(filtered)
      } catch (e) {
        setError('Failed to load embeds')
      }
    }
    load()
  }, [type])

  return (
    <div className="space-y-6">
      {error ? <div className="text-sm text-red-600">{error}</div> : null}
      {items.map(item => (
        <div key={item._id} className="rounded-xl bg-white shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <div className="text-sm font-medium text-gray-900">{item.title}</div>
            <div className="text-xs text-gray-500">{item.type}</div>
          </div>
          <div className="relative aspect-video w-full">
            {loadingIds[item._id] && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-sm">
                <svg className="h-6 w-6 animate-spin text-red-600" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              </div>
            )}
            <IframeContainer html={item.embedCode} onReady={() => setLoadingIds(s => ({ ...s, [item._id]: false }))} onStart={() => setLoadingIds(s => ({ ...s, [item._id]: true }))} />
          </div>
        </div>
      ))}
    </div>
  )
}

function buildAuth() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function IframeContainer({ html, onReady, onStart }) {
  const ref = React.useRef(null)
  useEffect(() => {
    onStart?.()
    const node = ref.current
    if (!node) return
    const iframe = node.querySelector('iframe')
    if (iframe) {
      const onLoad = () => onReady?.()
      iframe.addEventListener('load', onLoad)
      const t = setTimeout(() => onReady?.(), 1500)
      return () => { iframe.removeEventListener('load', onLoad); clearTimeout(t) }
    }
    const t = setTimeout(() => onReady?.(), 800)
    return () => clearTimeout(t)
  }, [html])
  return <div ref={ref} className="w-full h-full" dangerouslySetInnerHTML={{ __html: html }} />
}



