import { useEffect, useState } from 'react';
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
    author: '',
    description: '', 
    category: '', // Room/Category
    subCategory: '', // Sub Category
    theme: '', // Theme/Genre
    level: '', // Level
    country: '', // Country
    fileUrl: '', // This will be the Card Image
    tags: '', 
    imageSource: '', 
    embedIds: [],
    bannerImageUrl: '', // This will be the Banner Image
    dropdownTitle: '', // <-- ADDED: For custom dropdown title
  })
  
  const [embeds, setEmbeds] = useState([])
  const [materialEmbeds, setMaterialEmbeds] = useState([]) 
  const [uploading, setUploading] = useState(false); // For Card Image
  const [uploadingBanner, setUploadingBanner] = useState(false); // For Banner Image
  const [imgMode, setImgMode] = useState('local');
  const [pinUrl, setPinUrl] = useState('');
  const [pinPreview, setPinPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    Promise.all([
      apiGet('/api/materials'),
      apiGet('/api/embeds')
    ]).then(([materialsData, embedsData]) => {
      console.log('Materials data received:', materialsData);
      console.log('Embeds data received:', embedsData);
      
      // Handle both old format (array) and new format (object with materials property)
      const materials = Array.isArray(materialsData) ? materialsData : materialsData.materials || [];
      console.log('Processed materials:', materials);
      
      setItems(materials)
      setEmbeds(embedsData)
    }).catch((error) => {
      console.error('Error fetching data:', error);
      setError(error.message || 'Failed to load materials');
      setItems([])
      setEmbeds([])
    }).finally(() => setLoading(false))
  }, [])

  // Handler for the card image
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file size (limit to 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      alert(`File size too large. Please select a file smaller than 10MB. Current file size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      e.target.value = ''; // Clear the input
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
    
    // Check file size (limit to 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      alert(`File size too large. Please select a file smaller than 10MB. Current file size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      e.target.value = ''; // Clear the input
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
      
      const payload = {
        ...form,
        tags: form.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        imageSource: form.imageSource || (imgMode === 'pinterest' ? 'pinterest' : 'local'),
        embeds: materialEmbeds.filter(embed => embed.title.trim() && embed.embedCode.trim()),
        bannerImageUrl: form.bannerImageUrl, 
        dropdownTitle: form.dropdownTitle || 'Ejercicios', // <-- ADDED: Send to backend, default if empty
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
      
      // Handle specific error types
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
      author: material.author || '',
      description: material.description || '',
      category: material.category || '',
      subCategory: material.subCategory || '', // <-- Make sure all fields are loaded
      theme: material.theme || '',
      level: material.level || '',
      country: material.country || '',
      fileUrl: material.fileUrl || '',
      tags: Array.isArray(material.tags) ? material.tags.join(', ') : '',
      embedIds: material.embedIds?.map(e => e._id) || [],
      imageSource: material.imageSource || '',
      bannerImageUrl: material.bannerImageUrl || '', 
      dropdownTitle: material.dropdownTitle || '', // <-- ADDED: Load existing title
    });
    
    const existingEmbeds = material.embedIds?.map(embed => ({
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
  const removeMaterialEmbed = (index) => setMaterialEmbeds(prev => prev.filter((_, i) => i !== index));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Materials</h1>
      <div className="rounded-xl bg-white shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-3 border-b flex justify-between items-center">
          <div className="text-sm text-gray-600">Manage learning materials</div>
          <button
            onClick={() => { 
              setEditing(null); 
              setForm({ 
                title: '', 
                author: '',
                description: '', 
                category: '', 
                subCategory: '', // <-- Reset
                theme: '', // <-- Reset
                level: '', // <-- Reset
                country: '', // <-- Reset
                fileUrl: '', 
                tags: '',
                embedIds: [],
                imageSource: '',
                bannerImageUrl: '', // Reset
                dropdownTitle: '', // <-- ADDED: Reset
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
                // Retry loading
                Promise.all([
                  apiGet('/api/materials'),
                  apiGet('/api/embeds')
                ]).then(([materialsData, embedsData]) => {
                  const materials = Array.isArray(materialsData) ? materialsData : materialsData.materials || [];
                  setItems(materials)
                  setEmbeds(embedsData)
                }).catch((error) => {
                  setError(error.message || 'Failed to load materials');
                  setItems([])
                  setEmbeds([])
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
                <td className="px-4 py-3 font-medium text-gray-800">{m.title}</td>
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
                <td className="px-4 py-3 space-x-2">
                  <button onClick={() => openEditModal(m)} className="px-3 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100 transition">Edit</button>
                  <button onClick={async () => { await apiSend(`/api/materials/${m._id}`, 'DELETE'); setItems(items.filter(x => x._id !== m._id)) }} className="px-3 py-1 rounded bg-gray-100 text-gray-800 hover:bg-gray-200 transition">Delete</button>
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

              
              {/* Multiple Embeds Section (No change) */}
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
                            <span className="text-xs font-semibold text-gray-600">Embed #{index + 1}</span>
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
                            />
                            </label>
                            <label className="block">
                            <span className="text-sm text-gray-700">Type</span>
                            <select
                                value={embed.type}
                                onChange={e => updateMaterialEmbed(index, 'type', e.target.value)}
                                className="mt-1 w-full rounded-lg border border-gray-300 bg-white focus:border-red-500 focus:ring-2 focus:ring-red-400/50 transition duration-150 px-3 py-2 text-sm"
                            >
                                <option value="AI">AI Content</option>
                                <option value="H5P">H5P Content</option>
                            </select>
                            </label>
                        </div>
                        <label className="block mt-3">
                            <span className="text-sm text-gray-700">Embed Code</span>
                            <textarea
                            value={embed.embedCode}
                            onChange={e => updateMaterialEmbed(index, 'embedCode', e.target.value)}
                            placeholder="Paste your <iframe> or <script> code here"
                            rows="4"
                            className="mt-1 w-full rounded-lg border border-gray-300 bg-white focus:border-red-500 focus:ring-2 focus:ring-red-400/50 transition duration-150 px-3 py-2 text-sm placeholder-gray-400"
                            />
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Legacy Embed Selection (No change) */}
              <div className="block">
                <span className="text-sm text-gray-700">Select Legacy Embeds (from /embeds)</span>
                 <div className="mt-2 grid grid-cols-3 gap-2 border rounded-lg p-2 max-h-40 overflow-y-auto">
                  {embeds.map(embed => (
                    <label key={embed._id} className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100">
                      <input 
                        type="checkbox"
                        checked={form.embedIds.includes(embed._id)}
                        onChange={() => handleEmbedSelection(embed._id)}
                        className="rounded text-red-600 focus:ring-red-500"
                      />
                      <span className="text-sm text-gray-800">{embed.title}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* ADDED: Dropdown Title Input */}
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
                  {/* ... (Pinterest preview logic, etc.) ... */}
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