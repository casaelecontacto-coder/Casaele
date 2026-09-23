import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiImage, FiX, FiFile, FiEye, FiEyeOff } from 'react-icons/fi';
import { apiGet, apiSend } from '../../utils/api';
import LazyTinyMCE from '../../components/Admin/LazyTinyMCE';
import Spinner from '../../components/Common/Spinner';

// Texts are Magazine documents with contentType: 'text' — the same
// collection the "Magazines" admin section manages, filtered/locked here so
// editors have a dedicated place for the single, standalone pieces that
// appear in the "Texts" section of the El Desvelo (editorial) page, without
// wading through full issues and comics. See Backend/models/Magazine.js and
// El Desvelo.dc.html's `loose` binding (GET /api/magazines, contentType==='text').
const Texts = () => {
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingText, setEditingText] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadingEmbedHtml, setUploadingEmbedHtml] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    coverImageUrl: '',
    pdfUrl: '',
    category: '',
    isActive: true,
    // Exactly one of pdfUrl/readLinkUrl/readEmbedUrl is actually used,
    // picked by readSourceType — see Backend/models/Magazine.js.
    readSourceType: 'pdf',
    readLinkUrl: '',
    readEmbedUrl: '',
  });

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      description: '',
      coverImageUrl: '',
      pdfUrl: '',
      category: '',
      isActive: true,
      readSourceType: 'pdf',
      readLinkUrl: '',
      readEmbedUrl: '',
    });
    setEditingText(null);
  };

  // Switching source type clears the other two so stale values from a
  // previous choice can't linger and get saved alongside the new one.
  const setSourceType = (type) => {
    setFormData(prev => ({
      ...prev,
      readSourceType: type,
      pdfUrl: type === 'pdf' ? prev.pdfUrl : '',
      readLinkUrl: type === 'link' ? prev.readLinkUrl : '',
      readEmbedUrl: type === 'embed' ? prev.readEmbedUrl : '',
    }));
  };

  const fetchTexts = async () => {
    setLoading(true);
    try {
      const data = await apiGet('/api/magazines?all=true&limit=100');
      const all = data.magazines || [];
      setTexts(all.filter((m) => m.contentType === 'text'));
    } catch (error) {
      console.error('Error fetching texts:', error);
      setTexts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTexts();
  }, []);

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = 'casadeele_materials';

    try {
      const cloudFormData = new FormData();
      cloudFormData.append('file', file);
      cloudFormData.append('upload_preset', uploadPreset);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: cloudFormData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Upload failed');
      }

      const data = await response.json();
      setFormData(prev => ({ ...prev, coverImageUrl: data.secure_url }));
    } catch (error) {
      console.error('Cover upload error:', error);
      alert(`Cover upload failed: ${error.message}`);
    } finally {
      setUploadingCover(false);
    }
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file.');
      return;
    }

    setUploadingPdf(true);
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const token = localStorage.getItem('authToken');
      const response = await fetch(`${apiBaseUrl}/api/uploads/magazine-pdf`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: uploadFormData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      const data = await response.json();
      setFormData(prev => ({ ...prev, pdfUrl: data.url }));
    } catch (error) {
      console.error('PDF upload error:', error);
      alert(`PDF upload failed: ${error.message}`);
    } finally {
      setUploadingPdf(false);
      e.target.value = '';
    }
  };

  const handleEmbedHtmlUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.html')) {
      alert('Please select a valid HTML file');
      return;
    }

    setUploadingEmbedHtml(true);
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('htmlFile', file);

      const token = localStorage.getItem('authToken');
      const response = await fetch(`${apiBaseUrl}/api/uploads/html-file`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: uploadFormData,
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.message || 'Upload failed');
      setFormData(prev => ({ ...prev, readEmbedUrl: result.url }));
    } catch (error) {
      console.error('HTML embed upload error:', error);
      alert(`HTML embed upload failed: ${error.message}`);
    } finally {
      setUploadingEmbedHtml(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (!formData.coverImageUrl) {
        alert('Please upload a cover image.');
        setIsSaving(false);
        return;
      }
      if (formData.readSourceType === 'pdf' && !formData.pdfUrl) {
        alert('Please upload a PDF file.');
        setIsSaving(false);
        return;
      }
      if (formData.readSourceType === 'link' && !formData.readLinkUrl.trim()) {
        alert('Please enter a link.');
        setIsSaving(false);
        return;
      }
      if (formData.readSourceType === 'embed' && !formData.readEmbedUrl) {
        alert('Please upload an HTML embed file.');
        setIsSaving(false);
        return;
      }

      const payload = { ...formData, contentType: 'text' };

      const url = editingText ? `/api/magazines/${editingText._id}` : '/api/magazines';
      const method = editingText ? 'PUT' : 'POST';
      const saved = await apiSend(url, method, payload);

      if (editingText) {
        setTexts(prev => prev.map(t => (t._id === saved._id ? saved : t)));
      } else {
        setTexts(prev => [saved, ...prev]);
      }

      setShowModal(false);
      resetForm();
      setSuccessMsg(editingText ? 'Text updated!' : 'Text created!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error('Failed to save text:', error);
      alert('Failed to save text. Check console for details.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (text) => {
    setEditingText(text);
    setFormData({
      title: text.title || '',
      slug: text.slug || '',
      description: text.description || '',
      coverImageUrl: text.coverImageUrl || '',
      pdfUrl: text.pdfUrl || '',
      category: text.category || '',
      isActive: text.isActive !== false,
      readSourceType: text.readSourceType || 'pdf',
      readLinkUrl: text.readLinkUrl || '',
      readEmbedUrl: text.readEmbedUrl || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('This will permanently delete. Are you sure?')) {
      try {
        await apiSend(`/api/magazines/${id}`, 'DELETE');
        setTexts(prev => prev.filter(t => t._id !== id));
        setSuccessMsg('Text deleted successfully');
        setTimeout(() => setSuccessMsg(''), 3000);
      } catch (error) {
        console.error('Error deleting text:', error);
        alert('Failed to delete text.');
      }
    }
  };

  const handleToggleActive = async (id, currentIsActive) => {
    try {
      const newActive = currentIsActive === false ? true : false;
      const updated = await apiSend(`/api/magazines/${id}/toggle-active`, 'PATCH', { isActive: newActive });
      setTexts(prev => prev.map(item => item._id === id ? { ...item, isActive: updated.isActive } : item));
    } catch (error) {
      console.error('Error toggling visibility:', error);
      alert('Failed to toggle visibility');
    }
  };

  return (
    <div className="p-6 bg-casa-cream/40 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {successMsg && (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">
            {successMsg}
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-casa-ink mb-2">Texts</h1>
              <p className="text-casa-ink/65">Single pieces handed out in class, kept here afterwards — shown in the "Texts" section of the editorial page.</p>
            </div>
            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              className="bg-casa-red text-white px-6 py-3 rounded-xl hover:bg-casa-redDark transition-colors flex items-center gap-2"
            >
              <FiPlus className="w-5 h-5" /> Add Text
            </button>
          </div>
        </div>

        {/* Texts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full flex items-center justify-center py-12"><Spinner /> Loading texts...</div>
          ) : texts.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <FiFile className="w-12 h-12 text-casa-ink/40 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-casa-ink mb-2">No texts found</h3>
              <p className="text-casa-ink/50">Get started by adding your first text.</p>
            </div>
          ) : (
            texts.map((text) => (
              <div key={text._id} className="bg-white rounded-xl shadow-sm border border-casa-ink/12 overflow-hidden hover:shadow-md transition-shadow">
                {text.coverImageUrl ? (
                  <div className="h-48 bg-gray-200">
                    <img src={text.coverImageUrl} alt={text.title} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="h-48 bg-gray-200 flex items-center justify-center">
                    <FiImage className="w-12 h-12 text-casa-ink/40" />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-casa-ink line-clamp-2 flex-1">{text.title}</h3>
                    {text.isActive === false && (
                      <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">Hidden</span>
                    )}
                  </div>
                  {text.description && (
                    <div className="text-casa-ink/65 text-sm mb-3 line-clamp-2 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: text.description }} />
                  )}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">Text</span>
                    {text.category && (
                      <span className="px-2 py-0.5 text-xs bg-gray-200 text-casa-ink/75 rounded-full">{text.category}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm text-casa-ink/50 mb-4">
                    <span>{new Date(text.publishedAt || text.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEdit(text)} className="text-blue-600 hover:text-blue-900 p-2 rounded hover:bg-blue-50">
                        <FiEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(text._id, text.isActive)}
                        className={text.isActive === false ? "text-yellow-600 hover:text-yellow-800 p-2 rounded hover:bg-yellow-50" : "text-casa-ink/40 hover:text-gray-600 p-2 rounded hover:bg-casa-cream/40"}
                        title={text.isActive === false ? "Show to users" : "Hide from users"}
                      >
                        {text.isActive === false ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                      </button>
                      <button onClick={() => handleDelete(text._id)} className="text-casa-red hover:text-red-900 p-2 rounded hover:bg-casa-red/8">
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {text.readSourceType === 'link' && text.readLinkUrl && (
                      <a href={text.readLinkUrl} target="_blank" rel="noopener noreferrer" className="text-casa-red hover:text-casa-redDark text-xs font-medium">
                        View Link
                      </a>
                    )}
                    {text.readSourceType === 'embed' && text.readEmbedUrl && (
                      <a href={text.readEmbedUrl} target="_blank" rel="noopener noreferrer" className="text-casa-red hover:text-casa-redDark text-xs font-medium">
                        Preview Embed
                      </a>
                    )}
                    {(!text.readSourceType || text.readSourceType === 'pdf') && text.pdfUrl && (
                      <a href={text.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-casa-red hover:text-casa-redDark text-xs font-medium">
                        View PDF
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Text Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-casa-ink/12 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-casa-ink">{editingText ? 'Edit Text' : 'Add New Text'}</h3>
                <button onClick={() => { setShowModal(false); resetForm(); }} className="text-casa-ink/40 hover:text-gray-600">
                  <FiX className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Title + Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-casa-ink/75 mb-1">Title *</label>
                    <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2 border border-casa-ink/20 rounded-xl focus:ring-casa-red focus:border-casa-red" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-casa-ink/75 mb-1">Level / Category</label>
                    <input type="text" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-3 py-2 border border-casa-ink/20 rounded-xl focus:ring-casa-red focus:border-casa-red" placeholder="e.g., A2, Grammar sheet..." />
                  </div>
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-sm font-medium text-casa-ink/75 mb-1">URL Slug</label>
                  <input type="text" value={formData.slug || ''} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder={formData.title ? formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : 'auto-generated-from-title'} className="w-full px-3 py-2 border border-casa-ink/20 rounded-xl focus:ring-casa-red focus:border-casa-red font-mono text-sm" />
                  <p className="mt-1 text-xs text-casa-ink/50">Leave blank to auto-generate from title.</p>
                </div>

                {/* Description (shown as the excerpt on the Texts card) */}
                <div>
                  <label className="block text-sm font-medium text-casa-ink/75 mb-1">Excerpt / Description</label>
                  <div className="mt-1 rounded-xl overflow-hidden border border-casa-ink/12 focus-within:border-red-600 focus-within:ring-2 focus-within:ring-red-100 transition-all duration-200">
                    <LazyTinyMCE
                      apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
                      value={formData.description}
                      onEditorChange={(v) => setFormData({ ...formData, description: v })}
                      init={{
                        height: 200,
                        menubar: false,
                        plugins: 'link lists table code fullscreen',
                        toolbar:
                          'undo redo | formatselect | bold italic underline | bullist numlist | link | code',
                        placeholder: 'Short excerpt shown on the text card...',
                        content_style:
                          'body { font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; font-size:14px; color:#111827; background-color:#fff }'
                      }}
                    />
                  </div>
                </div>

                {/* Cover Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-casa-ink/75 mb-1">Cover Image *</label>
                  {formData.coverImageUrl ? (
                    <div className="relative inline-block mb-2">
                      <img src={formData.coverImageUrl} alt="Cover" className="h-40 rounded-xl object-cover border border-casa-ink/12" />
                      <button type="button" onClick={() => setFormData(prev => ({ ...prev, coverImageUrl: '' }))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-casa-redDark">
                        <FiX className="w-3 h-3" />
                      </button>
                    </div>
                  ) : null}
                  <input type="file" accept="image/*" onChange={handleCoverUpload} className="w-full text-sm text-casa-ink/50 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100" />
                  {uploadingCover && <p className="text-sm text-casa-ink/50 mt-1 animate-pulse">Uploading cover image...</p>}
                </div>

                {/* Content Source */}
                <div>
                  <label className="block text-sm font-medium text-casa-ink/75 mb-1">Content Source *</label>
                  <p className="text-xs text-casa-ink/50 mb-2">How readers access this text — pick exactly one.</p>
                  <div className="flex flex-wrap gap-3 mb-4">
                    {[
                      { value: 'pdf', label: 'PDF file' },
                      { value: 'link', label: 'Link' },
                      { value: 'embed', label: 'HTML embed' },
                    ].map((opt) => (
                      <label key={opt.value} className={`flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer transition-colors ${formData.readSourceType === opt.value ? 'bg-casa-red/8 border-red-300 text-casa-red' : 'bg-white border-casa-ink/20 text-casa-ink/65'}`}>
                        <input type="radio" name="readSourceType" value={opt.value} checked={formData.readSourceType === opt.value} onChange={() => setSourceType(opt.value)} className="accent-red-600" />
                        {opt.label}
                      </label>
                    ))}
                  </div>

                  {formData.readSourceType === 'pdf' && (
                    <div>
                      {formData.pdfUrl ? (
                        <div className="flex items-center gap-3 mb-2 p-3 bg-green-50 border border-green-200 rounded-xl">
                          <FiFile className="w-5 h-5 text-green-600" />
                          <span className="text-sm text-green-800 flex-1 truncate">PDF uploaded</span>
                          <a href={formData.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-green-700 underline">Preview</a>
                          <button type="button" onClick={() => setFormData(prev => ({ ...prev, pdfUrl: '' }))} className="text-red-500 hover:text-casa-redDark">
                            <FiX className="w-4 h-4" />
                          </button>
                        </div>
                      ) : null}
                      <input type="file" accept="application/pdf" onChange={handlePdfUpload} className="w-full text-sm text-casa-ink/50 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100" />
                      {uploadingPdf && <p className="text-sm text-casa-ink/50 mt-1 animate-pulse">Uploading PDF...</p>}
                    </div>
                  )}

                  {formData.readSourceType === 'link' && (
                    <div>
                      <input
                        type="url"
                        value={formData.readLinkUrl}
                        onChange={(e) => setFormData({ ...formData, readLinkUrl: e.target.value })}
                        placeholder="https://..."
                        className="w-full px-3 py-2 border border-casa-ink/20 rounded-xl text-sm focus:ring-casa-red focus:border-casa-red"
                      />
                      <p className="mt-1 text-xs text-casa-ink/50">Opens in a new tab. Readers still need to be logged in.</p>
                    </div>
                  )}

                  {formData.readSourceType === 'embed' && (
                    <div>
                      {formData.readEmbedUrl ? (
                        <div className="flex items-center gap-3 mb-2 p-3 bg-teal-50 border border-teal-200 rounded-xl">
                          <FiFile className="w-5 h-5 text-teal-600" />
                          <span className="text-sm text-teal-800 flex-1 truncate">HTML embed uploaded</span>
                          <a href={formData.readEmbedUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-teal-700 underline">Preview</a>
                          <button type="button" onClick={() => setFormData(prev => ({ ...prev, readEmbedUrl: '' }))} className="text-red-500 hover:text-casa-redDark">
                            <FiX className="w-4 h-4" />
                          </button>
                        </div>
                      ) : null}
                      <input type="file" accept=".html" onChange={handleEmbedHtmlUpload} className="w-full text-sm text-casa-ink/50 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100" />
                      {uploadingEmbedHtml && <p className="text-sm text-casa-ink/50 mt-1 animate-pulse">Uploading HTML file...</p>}
                      <p className="mt-1 text-xs text-casa-ink/50">Renders inline on the page when readers click "Read the text".</p>
                    </div>
                  )}
                </div>

                {/* Active Toggle */}
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                  <span className="text-sm font-medium text-casa-ink/75">
                    {formData.isActive ? 'Published' : 'Draft'}
                  </span>
                </div>

                {/* Submit */}
                <div className="flex justify-end gap-3 pt-4 border-t border-casa-ink/12">
                  <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="px-4 py-2 text-casa-ink/75 bg-casa-cream/60 rounded-xl hover:bg-gray-200 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSaving || uploadingCover || uploadingPdf} className="px-6 py-2 bg-casa-red text-white rounded-xl hover:bg-casa-redDark disabled:opacity-50 transition-colors flex items-center gap-2">
                    {isSaving ? 'Saving...' : (editingText ? 'Update Text' : 'Create Text')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Texts;
