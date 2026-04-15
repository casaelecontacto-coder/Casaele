import React, { useEffect, useState, useRef } from 'react'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import { apiGet, apiSend } from '../../utils/api'
import { exportChapterToExcel, exportAllChaptersToExcel } from '../../utils/excelExport'

function useAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export default function Embeds() {
  const [items, setItems] = useState([])
  const [chapters, setChapters] = useState([])
  const [selectedChapter, setSelectedChapter] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ title: '', type: 'H5P', embedCode: '', chapterId: '' })
  const [editingId, setEditingId] = useState(null)
  const [page, setPage] = useState(1)
  const [uploadingHtml, setUploadingHtml] = useState(false)
  const [htmlFile, setHtmlFile] = useState(null)
  const [showChapterModal, setShowChapterModal] = useState(false)
  const [chapterForm, setChapterForm] = useState({ name: '', description: '' })
  const [editingChapterId, setEditingChapterId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortOrder, setSortOrder] = useState('newest') // 'newest', 'oldest', 'a-z', 'z-a'
  const fileInputRef = useRef(null)
  const pageSize = 5
  const headers = useAuthHeaders()

  // Fetch chapters
  async function fetchChapters() {
    try {
      const response = await apiGet('/api/chapters')
      if (response.success) {
        setChapters(response.chapters)
      }
    } catch (e) {
      console.error('Failed to load chapters:', e)
    }
  }

  // Fetch embeds
  async function fetchEmbeds() {
    try {
      setLoading(true)
      const url = selectedChapter
        ? `/api/embeds?chapterId=${selectedChapter}&all=true`
        : '/api/embeds?all=true'
      const data = await apiGet(url)
      setItems(data)
    } catch (e) {
      setError(e?.message || 'Failed to load embeds')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchChapters()
    fetchEmbeds()
  }, [])

  useEffect(() => {
    fetchEmbeds()
  }, [selectedChapter])

  // Form handlers
  function onChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  function onChapterFormChange(e) {
    const { name, value } = e.target
    setChapterForm(f => ({ ...f, [name]: value }))
  }

  // Handle HTML file selection
  function onHtmlFileChange(e) {
    const file = e.target.files[0]
    if (file) {
      if (!file.name.endsWith('.html')) {
        setError('Please select a valid HTML file')
        setHtmlFile(null)
        return
      }
      setHtmlFile(file)
      setError('')
    }
  }

  // Upload HTML file
  async function onUploadHtml(e) {
    e.preventDefault()
    if (!htmlFile) {
      setError('Please select an HTML file first')
      return
    }

    try {
      setUploadingHtml(true)
      setError('')

      const formData = new FormData()
      formData.append('htmlFile', htmlFile)

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
      const response = await fetch(`${apiBaseUrl}/api/uploads/html-file`, {
        method: 'POST',
        headers: headers,
        body: formData
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || 'Upload failed')
      }

      setForm(f => ({ ...f, embedCode: result.url }))
      setHtmlFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      setError('')
      alert('HTML file uploaded successfully! The URL has been added to the embed code field.')
    } catch (e) {
      setError(e?.message || 'HTML upload failed')
    } finally {
      setUploadingHtml(false)
    }
  }

  // Create/Update Chapter
  async function onSubmitChapter(e) {
    e.preventDefault()
    try {
      setError('')
      const method = editingChapterId ? 'PUT' : 'POST'
      const url = editingChapterId ? `/api/chapters/${editingChapterId}` : '/api/chapters'
      const response = await apiSend(url, method, chapterForm)

      setChapterForm({ name: '', description: '' })
      setEditingChapterId(null)
      setShowChapterModal(false)
      fetchChapters()
    } catch (e) {
      setError(e?.message || 'Failed to save chapter')
    }
  }

  // Delete Chapter
  async function onDeleteChapter(id) {
    if (!confirm('Delete this chapter? Embeds will be moved to uncategorized.')) return
    try {
      await apiSend(`/api/chapters/${id}`, 'DELETE')
      if (selectedChapter === id) {
        setSelectedChapter(null)
      }
      fetchChapters()
      fetchEmbeds()
    } catch (e) {
      setError(e?.message || 'Delete failed')
    }
  }

  // Export Chapter Data
  async function onExportChapter(chapterId) {
    try {
      const response = await apiGet(`/api/chapters/${chapterId}/export`)
      if (response.success) {
        exportChapterToExcel(response.data)
      }
    } catch (e) {
      setError(e?.message || 'Export failed')
    }
  }

  // Export All Chapters
  function onExportAllChapters() {
    exportAllChaptersToExcel(chapters)
  }

  async function onSubmit(e) {
    e.preventDefault()
    try {
      setError('')
      const method = editingId ? 'PUT' : 'POST'
      const url = editingId ? `/api/embeds/${editingId}` : '/api/embeds'

      const payload = {
        ...form,
        chapterId: form.chapterId || null
      }

      const res = await apiSend(url, method, payload)
      setForm({ title: '', type: 'H5P', embedCode: '', chapterId: '' })
      setEditingId(null)
      fetchEmbeds()
      fetchChapters()
    } catch (e) {
      setError(e?.message || 'Save failed')
    }
  }

  async function onDelete(id) {
    if (!confirm('This will permanently delete. Are you sure?')) return
    try {
      await apiSend(`/api/embeds/${id}`, 'DELETE')
      setItems(items.filter(i => i._id !== id))
      fetchChapters()
    } catch (e) {
      setError(e?.message || 'Delete failed')
    }
  }

  async function handleToggleActive(id, currentIsActive) {
    try {
      const newActive = currentIsActive === false ? true : false;
      const updated = await apiSend(`/api/embeds/${id}/toggle-active`, 'PATCH', { isActive: newActive });
      setItems(prev => prev.map(item => item._id === id ? { ...item, isActive: updated.isActive } : item));
    } catch (error) {
      console.error('Error toggling visibility:', error);
      alert('Failed to toggle visibility');
    }
  }

  function onEdit(item) {
    setEditingId(item._id)
    setForm({
      title: item.title,
      type: item.type,
      embedCode: item.embedCode,
      chapterId: item.chapterId?._id || item.chapterId || ''
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function onEditChapter(chapter) {
    setEditingChapterId(chapter._id)
    setChapterForm({ name: chapter.name, description: chapter.description })
    setShowChapterModal(true)
  }

  // Filter and sort items
  const filteredAndSortedItems = React.useMemo(() => {
    let result = [...items];

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      result = result.filter(item =>
        item.title?.toLowerCase().includes(searchLower) ||
        item.type?.toLowerCase().includes(searchLower) ||
        item.chapterId?.name?.toLowerCase().includes(searchLower)
      );
    }

    // Apply sort
    switch (sortOrder) {
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'a-z':
        result.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        break;
      case 'z-a':
        result.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
        break;
      default:
        break;
    }

    return result;
  }, [items, searchTerm, sortOrder]);

  // Reset page when search/sort changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm, sortOrder]);

  // Embed preview
  function Preview({ code }) {
    const [isLoading, setIsLoading] = useState(true)
    const wrapRef = useRef(null)

    useEffect(() => {
      setIsLoading(true)
      const node = wrapRef.current
      if (!node) return
      const iframe = node.querySelector('iframe')
      if (iframe) {
        const onLoad = () => setIsLoading(false)
        iframe.addEventListener('load', onLoad)
        const t = setTimeout(() => setIsLoading(false), 1500)
        return () => { iframe.removeEventListener('load', onLoad); clearTimeout(t) }
      }
      const t = setTimeout(() => setIsLoading(false), 800)
      return () => clearTimeout(t)
    }, [code])

    if (!code) return null
    return (
      <div className="relative rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-sm">
            <svg className="h-6 w-6 animate-spin text-red-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          </div>
        )}
        <div className="aspect-video w-full">
          <div ref={wrapRef} className="w-full h-full p-0 m-0" dangerouslySetInnerHTML={{ __html: code }} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-6 min-h-screen">
      {/* Sidebar - Chapters */}
      <div className="w-64 flex-shrink-0 space-y-4">
        <div className="rounded-xl bg-white shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Chapters</h2>
            <button
              onClick={() => { setShowChapterModal(true); setEditingChapterId(null); setChapterForm({ name: '', description: '' }); }}
              className="text-sm text-red-700 hover:underline"
            >
              + New
            </button>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => setSelectedChapter(null)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                selectedChapter === null
                  ? 'bg-red-50 text-red-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              All Embeds
            </button>

            <button
              onClick={() => setSelectedChapter('uncategorized')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                selectedChapter === 'uncategorized'
                  ? 'bg-red-50 text-red-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Uncategorized
            </button>

            {chapters.map(chapter => (
              <div key={chapter._id} className="group">
                <button
                  onClick={() => setSelectedChapter(chapter._id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                    selectedChapter === chapter._id
                      ? 'bg-red-50 text-red-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{chapter.name}</span>
                    <span className="ml-2 text-xs text-gray-500">({chapter.embedCount || 0})</span>
                  </div>
                </button>
                <div className="hidden group-hover:flex items-center gap-1 mt-1 px-3">
                  <button onClick={() => onEditChapter(chapter)} className="text-xs text-gray-600 hover:text-gray-900">Edit</button>
                  <span className="text-gray-300">•</span>
                  <button onClick={() => onExportChapter(chapter._id)} className="text-xs text-gray-600 hover:text-gray-900">Export</button>
                  <span className="text-gray-300">•</span>
                  <button onClick={() => onDeleteChapter(chapter._id)} className="text-xs text-red-600 hover:text-red-900">Delete</button>
                </div>
              </div>
            ))}
          </div>

          {chapters.length > 0 && (
            <button
              onClick={onExportAllChapters}
              className="mt-4 w-full px-3 py-2 text-sm text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
            >
              📊 Export All Chapters
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">
            {selectedChapter === null
              ? 'All Embeds'
              : selectedChapter === 'uncategorized'
              ? 'Uncategorized Embeds'
              : chapters.find(c => c._id === selectedChapter)?.name || 'Chapter Embeds'}
          </h1>
        </div>

        {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">{String(error)}</div>}

        {/* Form */}
        <form onSubmit={onSubmit} className="rounded-xl bg-white shadow-sm border border-gray-200 p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                name="title"
                value={form.title}
                onChange={onChange}
                required
                placeholder="e.g., Speaking Exercise"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-600 focus:ring-2 focus:ring-red-200 transition-all shadow-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                name="type"
                value={form.type}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-600 focus:ring-2 focus:ring-red-200 transition-all shadow-sm outline-none"
              >
                <option value="H5P">H5P</option>
                <option value="AI">AI</option>
                <option value="HTML">HTML</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chapter</label>
              <select
                name="chapterId"
                value={form.chapterId}
                onChange={onChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-600 focus:ring-2 focus:ring-red-200 transition-all shadow-sm outline-none"
              >
                <option value="">Uncategorized</option>
                {chapters.map(chapter => (
                  <option key={chapter._id} value={chapter._id}>{chapter.name}</option>
                ))}
              </select>
            </div>

            {/* HTML File Upload Section */}
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload HTML Activity File</label>
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".html"
                  onChange={onHtmlFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-md border-2 border-dashed border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:border-gray-400 transition"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  {htmlFile ? htmlFile.name : 'Choose HTML File'}
                </button>
                <button
                  type="button"
                  onClick={onUploadHtml}
                  disabled={!htmlFile || uploadingHtml}
                  className="inline-flex items-center px-4 py-2 rounded-md bg-red-700 text-white hover:bg-red-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingHtml ? (
                    <>
                      <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                      Uploading...
                    </>
                  ) : (
                    'Upload HTML'
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">Upload an HTML file to automatically add its URL to the embed code field</p>
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Embed Code / URL</label>
              <textarea
                name="embedCode"
                rows="5"
                value={form.embedCode}
                onChange={onChange}
                placeholder="Paste iframe/script snippet here, or upload an HTML file above"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-600 focus:ring-2 focus:ring-red-200 transition-all shadow-sm outline-none resize-none"
              />
              <p className="mt-1 text-xs text-gray-500">You can paste an iframe, script tag, or a direct URL to an HTML file</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 rounded-md bg-red-700 text-white hover:bg-red-800 transition"
            >
              {editingId ? 'Update' : 'Add'} Embed
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => { setEditingId(null); setForm({ title: '', type: 'H5P', embedCode: '', chapterId: '' }) }}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Cancel edit
              </button>
            )}
          </div>
        </form>

        {/* List */}
        <div className="rounded-xl bg-white shadow-sm border border-gray-200">
          {/* Search and Sort Controls */}
          <div className="px-4 py-3 border-b border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-700">
                Embeds ({filteredAndSortedItems.length}{searchTerm && ` of ${items.length}`})
              </div>
              <button onClick={fetchEmbeds} className="text-sm text-red-700 hover:underline">Refresh</button>
            </div>

            {/* Search and Sort Row */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search Input */}
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search embeds by title, type, or chapter..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:border-red-600 focus:ring-2 focus:ring-red-200 transition-all outline-none"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Sort Dropdown */}
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm focus:border-red-600 focus:ring-2 focus:ring-red-200 transition-all outline-none bg-white min-w-[160px]"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="a-z">Title: A → Z</option>
                <option value="z-a">Title: Z → A</option>
              </select>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {loading && <div className="p-4 text-sm text-gray-500">Loading…</div>}
            {!loading && filteredAndSortedItems.length === 0 && (
              <div className="p-4 text-sm text-gray-500">
                {searchTerm ? `No embeds found matching "${searchTerm}"` : 'No embeds yet.'}
              </div>
            )}
            {filteredAndSortedItems
              .slice((page - 1) * pageSize, page * pageSize)
              .map(item => (
              <div key={item._id} className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium text-gray-900">{item.title}</div>
                      {item.isActive === false && <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">Hidden</span>}
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.type}
                      {item.chapterId && ` • ${item.chapterId.name}`}
                      {` • ${new Date(item.createdAt).toLocaleString()}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => onEdit(item)} className="text-sm text-gray-700 hover:underline">Edit</button>
                    <button
                      onClick={() => handleToggleActive(item._id, item.isActive)}
                      className={item.isActive === false ? "text-yellow-600 hover:text-yellow-800" : "text-gray-400 hover:text-gray-600"}
                      title={item.isActive === false ? "Show to users" : "Hide from users"}
                    >
                      {item.isActive === false ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                    </button>
                    <button onClick={() => onDelete(item._id)} className="text-sm text-red-700 hover:underline">Delete</button>
                  </div>
                </div>
                <Preview code={item.embedCode} />
              </div>
            ))}
          </div>

          {/* Pagination */}
          {filteredAndSortedItems.length > pageSize && (
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between text-sm">
              <div className="text-gray-500">Page {page} of {Math.ceil(filteredAndSortedItems.length / pageSize)}</div>
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1 rounded border text-gray-700 disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  disabled={page >= Math.ceil(filteredAndSortedItems.length / pageSize)}
                  onClick={() => setPage(p => Math.min(Math.ceil(filteredAndSortedItems.length / pageSize), p + 1))}
                  className="px-3 py-1 rounded border text-gray-700 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chapter Modal */}
      {showChapterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {editingChapterId ? 'Edit Chapter' : 'New Chapter'}
            </h2>
            <form onSubmit={onSubmitChapter} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chapter Name</label>
                <input
                  name="name"
                  value={chapterForm.name}
                  onChange={onChapterFormChange}
                  required
                  placeholder="e.g., Unit 1: Greetings"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-600 focus:ring-2 focus:ring-red-200 transition-all shadow-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <textarea
                  name="description"
                  value={chapterForm.description}
                  onChange={onChapterFormChange}
                  rows="3"
                  placeholder="Brief description of this chapter"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-600 focus:ring-2 focus:ring-red-200 transition-all shadow-sm outline-none resize-none"
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 rounded-md bg-red-700 text-white hover:bg-red-800 transition"
                >
                  {editingChapterId ? 'Update' : 'Create'} Chapter
                </button>
                <button
                  type="button"
                  onClick={() => { setShowChapterModal(false); setEditingChapterId(null); setChapterForm({ name: '', description: '' }); }}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
