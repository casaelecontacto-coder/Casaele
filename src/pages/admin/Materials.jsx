import { useEffect, useState } from 'react';
import { FiEye, FiEyeOff, FiTrash2 } from 'react-icons/fi';
import { apiGet, apiSend } from '../../utils/api';

export default function Materials() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  
  // Form state with all categorization fields
  const [form, setForm] = useState({
    title: '',
    slug: '',
    author: '',
    description: '', 
    category: '', 
    subCategory: '', 
    theme: '', 
    level: '', 
    country: '', 
    fileUrl: '', 
    tags: '', 
    imageSource: '', 
    embedIds: [],
    bannerImageUrl: '', 
    dropdownTitle: '', 
  })
  
  const [embeds, setEmbeds] = useState([])
  const [chapters, setChapters] = useState([])
  const [selectedChapterFilter, setSelectedChapterFilter] = useState('all')
  const [embedSearchTerm, setEmbedSearchTerm] = useState('')
  const [materialEmbeds, setMaterialEmbeds] = useState([])
  const [uploading, setUploading] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [imgMode, setImgMode] = useState('local');
  const [pinUrl, setPinUrl] = useState('');
  const [pinPreview, setPinPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [uploadingEmbedHtml, setUploadingEmbedHtml] = useState(null);

  // HTML file upload for embed items
  const handleEmbedHtmlUpload = async (index, file) => {
    if (!file || !file.name.endsWith('.html')) {
      alert('Please select a valid HTML file');
      return;
    }
    setUploadingEmbedHtml(index);
    try {
      const formData = new FormData();
      formData.append('htmlFile', file);
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${apiBaseUrl}/api/uploads/html-file`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.message || 'Upload failed');
      updateMaterialEmbed(index, 'embedCode', result.url);
      // Keep the user-selected type (AI/H5P/HTML). H5P/AI render inside the dropdown
      // accordion; only the explicit "HTML File" type renders full-width on the page.
    } catch (e) {
      alert(e?.message || 'HTML upload failed');
    } finally {
      setUploadingEmbedHtml(null);
    }
  };

  useEffect(() => {
    Promise.all([
      apiGet('/api/materials?all=true'),
      apiGet('/api/embeds?all=true'),
      apiGet('/api/chapters')
    ]).then(([materialsData, embedsData, chaptersData]) => {
      const materials = Array.isArray(materialsData) ? materialsData : materialsData.materials || [];
      setItems(materials)
      setEmbeds(embedsData)
      setChapters(chaptersData.chapters || [])
    }).catch((error) => {
      console.error('Error fetching data:', error);
      setError(error.message || 'Failed to load materials');
      setItems([])
      setEmbeds([])
      setChapters([])
    }).finally(() => setLoading(false))
  }, [])

  // Handler for the card image
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const maxSize = 10 * 1024 * 1024; 
    if (file.size > maxSize) {
      alert(`File size too large. Please select a file smaller than 10MB.`);
      e.target.value = ''; 
      return;
    }
    
    setUploading(true);
    try {
      const { timestamp, signature } = await apiGet('/api/cloudinary-signature');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', import.meta.env.VITE_CLOUDINARY_API_KEY);
      formData.append('timestamp', timestamp);
      formData.append('signature', signature);
      formData.append('upload_preset', 'casadeele_materials');
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Cloudinary upload failed');
      const data = await response.json();
      setForm({ ...form, fileUrl: data.secure_url, imageSource: 'local' });
    } catch (error) {
      alert('Card Image upload failed.');
    } finally {
      setUploading(false);
    }
  };

  // Handler for the banner image
  const handleBannerFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const maxSize = 10 * 1024 * 1024; 
    if (file.size > maxSize) {
      alert(`File size too large. Please select a file smaller than 10MB.`);
      e.target.value = ''; 
      return;
    }
    
    setUploadingBanner(true);
    try {
      const { timestamp, signature } = await apiGet('/api/cloudinary-signature');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', import.meta.env.VITE_CLOUDINARY_API_KEY);
      formData.append('timestamp', timestamp);
      formData.append('signature', signature);
      formData.append('upload_preset', 'casadeele_materials');
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Cloudinary upload failed');
      const data = await response.json();
      setForm({ ...form, bannerImageUrl: data.secure_url });
    } catch (error) {
      alert('Banner Image upload failed.');
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleSave = async () => {
    try {
      setErrorMsg('');
      setSaving(true);
      
      // FIX: Filter out embeds that already have an _id so they aren't created again
      const newEmbedsToCreate = materialEmbeds.filter(
        embed => !embed._id && embed.title.trim() && embed.embedCode.trim()
      );

      const payload = {
        ...form,
        tags: form.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        imageSource: form.imageSource || (imgMode === 'pinterest' ? 'pinterest' : 'local'),
        embeds: newEmbedsToCreate, // Only send new embeds to be created
        bannerImageUrl: form.bannerImageUrl, 
        dropdownTitle: form.dropdownTitle || 'Ejercicios', 
      };

      const saved = editing
        ? await apiSend(`/api/materials/${editing._id}`, 'PUT', payload)
        : await apiSend('/api/materials', 'POST', payload);

      if (editing) setItems(items.map(x => x._id === saved._id ? saved : x));
      else setItems([saved, ...items]);

      setModalOpen(false);
      setMaterialEmbeds([]); 
    } catch (err) {
      console.error('Save error:', err);
      let msg = 'Failed to save material';
      if (err?.message?.includes('request entity too large')) {
        msg = 'File size too large. Please reduce image sizes and try again.';
      } else if (err?.message?.includes('413')) {
        msg = 'Request too large. Please reduce file sizes and try again.';
      } else if (err?.message) {
        msg = err.message;
      }
      setErrorMsg(msg);
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (material) => {
    setEditing(material);
    setForm({
      title: material.title || '',
      slug: material.slug || '',
      author: material.author || '',
      description: material.description || '',
      category: material.category || '',
      subCategory: material.subCategory || '',
      theme: material.theme || '',
      level: material.level || '',
      country: material.country || '',
      fileUrl: material.fileUrl || '',
      tags: Array.isArray(material.tags) ? material.tags.join(', ') : '',
      embedIds: material.embedIds?.map(e => e._id) || [],
      imageSource: material.imageSource || '',
      bannerImageUrl: material.bannerImageUrl || '', 
      dropdownTitle: material.dropdownTitle || '', 
    });
    
    // FIX: Include the _id when loading existing embeds so we know they exist
    const existingEmbeds = material.embedIds?.map(embed => ({
      _id: embed._id, 
      title: embed.title || '',
      type: embed.type || 'AI',
      embedCode: embed.embedCode || ''
    })) || [];
    setMaterialEmbeds(existingEmbeds);
    
    setModalOpen(true);
  }
  
  const handleEmbedSelection = (embedId) => {
    setForm(prevForm => {
      const newEmbedIds = prevForm.embedIds.includes(embedId)
        ? prevForm.embedIds.filter(id => id !== embedId)
        : [...prevForm.embedIds, embedId];
      return { ...prevForm, embedIds: newEmbedIds };
    });
  };

  const addMaterialEmbed = () => setMaterialEmbeds(prev => [...prev, { title: '', type: 'AI', embedCode: '' }]);
  
  const updateMaterialEmbed = (index, field, value) => setMaterialEmbeds(prev => prev.map((embed, i) => i === index ? { ...embed, [field]: value } : embed));
  
  // FIX: If removing an existing embed, ensure it's also removed from the form.embedIds list
  const removeMaterialEmbed = (index) => {
    const embedToRemove = materialEmbeds[index];
    if (embedToRemove && embedToRemove._id) {
       setForm(prevForm => ({
         ...prevForm,
         embedIds: prevForm.embedIds.filter(id => id !== embedToRemove._id)
       }));
    }
    setMaterialEmbeds(prev => prev.filter((_, i) => i !== index));
  };

  const handleToggleActive = async (id, currentIsActive) => {
    try {
      const newActive = currentIsActive === false ? true : false;
      const updated = await apiSend(`/api/materials/${id}/toggle-active`, 'PATCH', { isActive: newActive });
      setItems(prev => prev.map(item => item._id === id ? { ...item, isActive: updated.isActive } : item));
    } catch (error) {
      console.error('Error toggling visibility:', error);
      alert('Failed to toggle visibility');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Materials</h1>
      <div className="rounded-xl bg-white shadow-sm border border-gray-200 overflow-hidden">
        {/* ... (Header and Error handling unchanged) ... */}
        <div className="p-3 border-b flex justify-between items-center">
          <div className="text-sm text-gray-600">Manage learning materials</div>
          <button
            onClick={() => { 
              setEditing(null); 
              setForm({
                title: '',
                slug: '',
                author: '',
                description: '', 
                category: '', 
                subCategory: '', 
                theme: '', 
                level: '', 
                country: '', 
                fileUrl: '', 
                tags: '',
                embedIds: [],
                imageSource: '',
                bannerImageUrl: '', 
                dropdownTitle: '', 
              }); 
              setImgMode('local');
              setPinUrl('');
              setPinPreview(null);
              setMaterialEmbeds([]);
              setModalOpen(true);
            }}
            className="px-3 py-1.5 rounded-md bg-red-700 text-white hover:bg-red-800"
          >
            Add Material
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">Error: {error}</p>
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                Promise.all([
                  apiGet('/api/materials?all=true'),
                  apiGet('/api/embeds?all=true'),
                  apiGet('/api/chapters')
                ]).then(([materialsData, embedsData, chaptersData]) => {
                  const materials = Array.isArray(materialsData) ? materialsData : materialsData.materials || [];
                  setItems(materials)
                  setEmbeds(embedsData)
                  setChapters(chaptersData.chapters || [])
                }).catch((error) => {
                  setError(error.message || 'Failed to load materials');
                  setItems([])
                  setEmbeds([])
                  setChapters([])
                }).finally(() => setLoading(false))
              }}
              className="mt-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        <table className="min-w-full text-left">
          <thead className="bg-gray-50 text-gray-600 text-sm">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Author</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Sub Category</th>
              <th className="px-4 py-3">Theme</th>
              <th className="px-4 py-3">Level</th>
              <th className="px-4 py-3">Country</th>
              <th className="px-4 py-3">Embeds</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-3"><div className="h-4 w-56 bg-gray-100 animate-pulse rounded" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-24 bg-gray-100 animate-pulse rounded" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-20 bg-gray-100 animate-pulse rounded" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-20 bg-gray-100 animate-pulse rounded" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-16 bg-gray-100 animate-pulse rounded" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-20 bg-gray-100 animate-pulse rounded" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-16 bg-gray-100 animate-pulse rounded" /></td>
                  <td className="px-4 py-3"><div className="h-8 w-24 bg-gray-100 animate-pulse rounded" /></td>
                </tr>
              ))
            ) : (Array.isArray(items) ? items : []).map((m) => (
              <tr key={m._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">
                  <div className="flex items-center gap-2">
                    {m.title}
                    {m.isActive === false && <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">Hidden</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-700">{m.author || '-'}</td>
                <td className="px-4 py-3 text-gray-700">{m.category || '-'}</td>
                <td className="px-4 py-3 text-gray-700">{m.subCategory || '-'}</td>
                <td className="px-4 py-3 text-gray-700">{m.theme || '-'}</td>
                <td className="px-4 py-3 text-gray-700">{m.level || '-'}</td>
                <td className="px-4 py-3 text-gray-700">{m.country || '-'}</td>
                <td className="px-4 py-3 text-gray-700">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium">{m.embedIds?.length || 0}</span>
                    <span className="text-xs text-gray-500">embeds</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEditModal(m)} className="px-3 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100 transition">Edit</button>
                    <button
                      onClick={() => handleToggleActive(m._id, m.isActive)}
                      className={m.isActive === false ? "text-yellow-600 hover:text-yellow-800" : "text-gray-400 hover:text-gray-600"}
                      title={m.isActive === false ? "Show to users" : "Hide from users"}
                    >
                      {m.isActive === false ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                    </button>
                    <button onClick={async () => { if (window.confirm('This will permanently delete. Are you sure?')) { await apiSend(`/api/materials/${m._id}`, 'DELETE'); setItems(items.filter(x => x._id !== m._id)) } }} className="text-red-600 hover:text-red-900">
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="text-lg font-semibold">{editing ? 'Edit material' : 'Add material'}</div>
            {errorMsg ? <div className="text-sm text-red-600">{errorMsg}</div> : null}

            <div className="grid grid-cols-1 gap-3">
              {[
                { label: 'Title', key: 'title' },
                { label: 'URL Slug', key: 'slug', placeholder: 'auto-generated-from-title (leave blank for auto)' },
                { label: 'Author', key: 'author', placeholder: 'e.g., Dr. Maria Rodriguez, CasaDeELE Team' },
                { label: 'Short Description (for cards)', key: 'description' },
                { label: 'Room/Category', key: 'category', placeholder: 'e.g., Grammar, Vocabulary, Conversation' },
                { label: 'Sub Category', key: 'subCategory', placeholder: 'e.g., Verbs, Nouns, Adjectives' },
                { label: 'Theme/Genre', key: 'theme', placeholder: 'e.g., Business, Travel, Academic' },
                { label: 'Level', key: 'level', placeholder: 'e.g., A1, A2, B1, B2, C1, C2' },
                { label: 'Country', key: 'country', placeholder: 'e.g., Spain, Mexico, Argentina' },
                { label: 'Tags (comma-separated)', key: 'tags', placeholder: 'e.g., A2, Listening, Culture' }
              ].map(f => (
                <label key={f.key} className="block">
                  <span className="text-sm text-gray-700">{f.label}</span>
                  <input
                    value={form[f.key]}
                    onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    placeholder={f.placeholder || ''}
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 focus:border-red-500 focus:ring-2 focus:ring-red-400/50 transition duration-150 px-3 py-2 text-sm placeholder-gray-400 hover:border-gray-400"
                  />
                </label>
              ))}

              
              {/* Multiple Embeds Section */}
              <div className="block">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-700">Add Multiple Embeds (AI/H5P Content)</span>
                  <button type="button" onClick={addMaterialEmbed} className="px-3 py-1.5 text-xs bg-red-700 text-white rounded-md hover:bg-red-800 transition">
                    + Add Another Embed
                  </button>
                </div>
                {materialEmbeds.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                    <p className="text-sm">No embeds added yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto border rounded-lg p-3">
                    {materialEmbeds.map((embed, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-600">Embed #{index + 1} {embed._id && '(Existing)'}</span>
                            <button
                            type="button"
                            onClick={() => removeMaterialEmbed(index)}
                            className="text-xs text-red-600 hover:text-red-800"
                            >
                            Remove
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <label className="block">
                            <span className="text-sm text-gray-700">Title</span>
                            <input
                                value={embed.title}
                                onChange={e => updateMaterialEmbed(index, 'title', e.target.value)}
                                placeholder="e.g., Exercise 1"
                                className="mt-1 w-full rounded-lg border border-gray-300 bg-white focus:border-red-500 focus:ring-2 focus:ring-red-400/50 transition duration-150 px-3 py-2 text-sm placeholder-gray-400"
                                disabled={!!embed._id}
                            />
                            </label>
                            <label className="block">
                            <span className="text-sm text-gray-700">Type</span>
                            <select
                                value={embed.type}
                                onChange={e => updateMaterialEmbed(index, 'type', e.target.value)}
                                className="mt-1 w-full rounded-lg border border-gray-300 bg-white focus:border-red-500 focus:ring-2 focus:ring-red-400/50 transition duration-150 px-3 py-2 text-sm"
                                disabled={!!embed._id}
                            >
                                <option value="AI">AI Content</option>
                                <option value="H5P">H5P Content</option>
                                <option value="HTML">HTML File</option>
                            </select>
                            </label>
                        </div>
                        {/* HTML File Upload */}
                        {!embed._id && (
                          <div className="mt-3">
                            <span className="text-sm text-gray-700">Upload HTML File</span>
                            <div className="flex items-center gap-2 mt-1">
                              <input
                                type="file"
                                accept=".html"
                                onChange={(e) => {
                                  const file = e.target.files[0];
                                  if (file) handleEmbedHtmlUpload(index, file);
                                  e.target.value = '';
                                }}
                                className="flex-1 text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                                disabled={uploadingEmbedHtml === index}
                              />
                              {uploadingEmbedHtml === index && <span className="text-xs text-gray-500 animate-pulse">Uploading...</span>}
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Upload an HTML file to auto-fill the embed code field</p>
                          </div>
                        )}
                        <label className="block mt-3">
                            <span className="text-sm text-gray-700">Embed Code / URL</span>
                            <textarea
                            value={embed.embedCode}
                            onChange={e => updateMaterialEmbed(index, 'embedCode', e.target.value)}
                            placeholder="Paste your <iframe> or <script> code here, or upload an HTML file above"
                            rows="4"
                            className="mt-1 w-full rounded-lg border border-gray-300 bg-white focus:border-red-500 focus:ring-2 focus:ring-red-400/50 transition duration-150 px-3 py-2 text-sm placeholder-gray-400"
                            disabled={!!embed._id}
                            />
                        </label>
                        {embed._id && <p className="text-xs text-orange-600 mt-1">To update the content of this embed, please delete it and create a new one.</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Embed Selection with Chapter Filter */}
              <div className="block">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-700 font-medium">Select Embeds from Library</span>
                  <span className="text-xs text-gray-500">{form.embedIds.length} selected</span>
                </div>

                {/* Search and Filter Controls */}
                <div className="flex flex-col sm:flex-row gap-2 mb-3">
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search embeds..."
                      value={embedSearchTerm}
                      onChange={(e) => setEmbedSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-400/50 outline-none"
                    />
                  </div>

                  {/* Chapter Filter Dropdown */}
                  <select
                    value={selectedChapterFilter}
                    onChange={(e) => setSelectedChapterFilter(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-400/50 outline-none bg-white min-w-[150px]"
                  >
                    <option value="all">All Chapters</option>
                    <option value="uncategorized">Uncategorized</option>
                    {chapters.map(chapter => (
                      <option key={chapter._id} value={chapter._id}>{chapter.name}</option>
                    ))}
                  </select>
                </div>

                {/* Embed List */}
                <div className="border rounded-lg max-h-60 overflow-y-auto">
                  {(() => {
                    // Filter embeds based on search and chapter
                    let filteredEmbeds = embeds.filter(embed => {
                      const matchesSearch = !embedSearchTerm.trim() ||
                        embed.title?.toLowerCase().includes(embedSearchTerm.toLowerCase()) ||
                        embed.type?.toLowerCase().includes(embedSearchTerm.toLowerCase());

                      // Get the chapter ID as a string for comparison
                      const embedChapterId = embed.chapterId?._id?.toString?.() ||
                                            embed.chapterId?._id ||
                                            (typeof embed.chapterId === 'string' ? embed.chapterId : null);

                      const matchesChapter = selectedChapterFilter === 'all' ||
                        (selectedChapterFilter === 'uncategorized' && !embed.chapterId) ||
                        (embedChapterId === selectedChapterFilter);

                      return matchesSearch && matchesChapter;
                    });

                    if (filteredEmbeds.length === 0) {
                      return (
                        <div className="p-4 text-center text-gray-500 text-sm">
                          {embedSearchTerm || selectedChapterFilter !== 'all'
                            ? 'No embeds match your filters'
                            : 'No embeds available'}
                        </div>
                      );
                    }

                    // Group by chapter for better organization
                    const groupedEmbeds = {};
                    filteredEmbeds.forEach(embed => {
                      const chapterName = embed.chapterId?.name || 'Uncategorized';
                      if (!groupedEmbeds[chapterName]) {
                        groupedEmbeds[chapterName] = [];
                      }
                      groupedEmbeds[chapterName].push(embed);
                    });

                    return Object.entries(groupedEmbeds).map(([chapterName, chapterEmbeds]) => (
                      <div key={chapterName}>
                        <div className="px-3 py-2 bg-gray-50 text-xs font-semibold text-gray-600 sticky top-0 border-b">
                          {chapterName} ({chapterEmbeds.length})
                        </div>
                        <div className="divide-y divide-gray-100">
                          {chapterEmbeds.map(embed => (
                            <label
                              key={embed._id}
                              className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 transition ${
                                form.embedIds.includes(embed._id) ? 'bg-red-50' : ''
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={form.embedIds.includes(embed._id)}
                                onChange={() => handleEmbedSelection(embed._id)}
                                className="rounded text-red-600 focus:ring-red-500"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm text-gray-800 truncate">{embed.title}</div>
                                <div className="text-xs text-gray-500">{embed.type}</div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    ));
                  })()}
                </div>

                {/* Quick Actions */}
                {form.embedIds.length > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, embedIds: [] })}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Clear all selections
                    </button>
                  </div>
                )}
              </div>

              {/* Dropdown Title Input */}
              <label className="block">
                <span className="text-sm text-gray-700">Dropdown Title</span>
                <input
                  value={form.dropdownTitle}
                  onChange={e => setForm({ ...form, dropdownTitle: e.target.value })}
                  placeholder="e.g., Ejercicios, Activities"
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 focus:border-red-500 focus:ring-2 focus:ring-red-400/50 transition duration-150 px-3 py-2 text-sm placeholder-gray-400 hover:border-gray-400"
                />
                <p className="text-xs text-gray-500 mt-1">Title for the exercises dropdown on the detail page. Defaults to 'Ejercicios' if left empty.</p>
              </label>

              {/* Card Image Section */}
              <div className="block">
                <span className="text-sm text-gray-700">Card Image Source</span>
                <div className="mt-2 flex gap-4">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="imgMode" value="local" checked={imgMode === 'local'} onChange={() => setImgMode('local')} className="text-red-600"/>
                    <span className="text-sm">Upload</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="imgMode" value="pinterest" checked={imgMode === 'pinterest'} onChange={() => setImgMode('pinterest')} className="text-red-600"/>
                    <span className="text-sm">Pinterest URL</span>
                  </label>
                </div>
              </div>

              {imgMode === 'local' ? (
                <label className="block">
                  <span className="text-sm text-gray-700">Card Image Upload (for material list)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 cursor-pointer transition"
                  />
                  {uploading && <div className="text-sm text-gray-500 mt-1">Uploading Card Image...</div>}
                  {form.fileUrl && !uploading && (<div className="text-sm text-green-600 mt-1">Card image upload complete.</div>)}
                </label>
              ) : (
                <div className="grid gap-2">
                  <label className="block">
                    <span className="text-sm text-gray-700">Pinterest URL</span>
                    <input
                      value={pinUrl}
                      onChange={e => setPinUrl(e.target.value)}
                      placeholder="https://www.pinterest.com/pin/..."
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 focus:border-red-500 focus:ring-2 focus:ring-red-400/50 transition duration-150 px-3 py-2 text-sm placeholder-gray-400 hover:border-gray-400"
                    />
                  </label>
                </div>
              )}

              {(form.fileUrl || pinPreview) && (
                <div className="mt-2 border rounded-lg p-2">
                  <div className="text-xs text-gray-500 mb-1">Card Image Preview</div>
                  <img src={form.fileUrl || pinPreview?.image} alt="preview" className="max-h-40 object-contain rounded-md border border-gray-200" />
                </div>
              )}

              {/* Banner Image Uploader */}
              <label className="block">
                <span className="text-sm text-gray-700">Banner Image Upload (for detail page)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBannerFileChange}
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer transition"
                />
                {uploadingBanner && <div className="text-sm text-gray-500 mt-1">Uploading Banner Image...</div>}
                {form.bannerImageUrl && !uploadingBanner && (<div className="text-sm text-green-600 mt-1">Banner image upload complete.</div>)}
              </label>
              
              {form.bannerImageUrl && (
                <div className="mt-2 border rounded-lg p-2">
                  <div className="text-xs text-gray-500 mb-1">Banner Image Preview</div>
                  <img src={form.bannerImageUrl} alt="banner preview" className="max-h-40 object-contain rounded-md border border-gray-200" />
                </div>
              )}

            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setModalOpen(false)} className="px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200">Cancel</button>
              <button 
                onClick={handleSave} 
                disabled={uploading || uploadingBanner || saving} 
                className="px-3 py-1.5 rounded-md bg-red-700 text-white hover:bg-red-800 disabled:opacity-60"
              >
                {saving ? 'Saving…' : (uploading || uploadingBanner ? 'Uploading...' : 'Save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
