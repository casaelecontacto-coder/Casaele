import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiImage, FiX, FiFile, FiDollarSign } from 'react-icons/fi';
import { apiGet, apiSend } from '../../utils/api';
import LazyTinyMCE from '../../components/Admin/LazyTinyMCE';
import Spinner from '../../components/Common/Spinner';

const Magazines = () => {
  const [magazines, setMagazines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMagazine, setEditingMagazine] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    coverImageUrl: '',
    pdfUrl: '',
    category: '',
    accessType: 'free',
    price: 0,
    discountPrice: 0,
    complementaryMaterialUrl: '',
    complementaryMaterialName: '',
    donateLink: '',
    subscribeLink: '',
    preorderLink: '',
    isActive: true,
  });
  const [uploadingMaterial, setUploadingMaterial] = useState(false);

  // Multi-currency pricing state
  const [pricesUSD, setPricesUSD] = useState({ price: 0, discountPrice: 0 });
  const [pricesEUR, setPricesEUR] = useState({ price: 0, discountPrice: 0 });
  const [pricesINR, setPricesINR] = useState({ price: 0, discountPrice: 0 });

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      description: '',
      coverImageUrl: '',
      pdfUrl: '',
      category: '',
      accessType: 'free',
      price: 0,
      discountPrice: 0,
      complementaryMaterialUrl: '',
      complementaryMaterialName: '',
      donateLink: '',
      subscribeLink: '',
      preorderLink: '',
      isActive: true,
    });
    setPricesUSD({ price: 0, discountPrice: 0 });
    setPricesEUR({ price: 0, discountPrice: 0 });
    setPricesINR({ price: 0, discountPrice: 0 });
    setEditingMagazine(null);
  };

  const fetchMagazines = async () => {
    setLoading(true);
    try {
      const data = await apiGet('/api/magazines?all=true&limit=100');
      setMagazines(data.magazines || []);
    } catch (error) {
      console.error('Error fetching magazines:', error);
      setMagazines([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMagazines();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (!formData.coverImageUrl) {
        alert('Please upload a cover image.');
        setIsSaving(false);
        return;
      }
      if (!formData.pdfUrl) {
        alert('Please upload a PDF file.');
        setIsSaving(false);
        return;
      }

      const payload = {
        ...formData,
        prices: {
          USD: pricesUSD,
          EUR: pricesEUR,
          INR: pricesINR,
        },
      };

      const url = editingMagazine ? `/api/magazines/${editingMagazine._id}` : '/api/magazines';
      const method = editingMagazine ? 'PUT' : 'POST';
      const saved = await apiSend(url, method, payload);

      if (editingMagazine) {
        setMagazines(prev => prev.map(m => (m._id === saved._id ? saved : m)));
      } else {
        setMagazines(prev => [saved, ...prev]);
      }

      setShowModal(false);
      resetForm();
      setSuccessMsg(editingMagazine ? 'Magazine updated!' : 'Magazine created!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error('Failed to save magazine:', error);
      alert('Failed to save magazine. Check console for details.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (magazine) => {
    setEditingMagazine(magazine);
    setFormData({
      title: magazine.title || '',
      slug: magazine.slug || '',
      description: magazine.description || '',
      coverImageUrl: magazine.coverImageUrl || '',
      pdfUrl: magazine.pdfUrl || '',
      category: magazine.category || '',
      accessType: magazine.accessType || 'free',
      price: magazine.price || 0,
      discountPrice: magazine.discountPrice || 0,
      complementaryMaterialUrl: magazine.complementaryMaterialUrl || '',
      complementaryMaterialName: magazine.complementaryMaterialName || '',
      donateLink: magazine.donateLink || '',
      subscribeLink: magazine.subscribeLink || '',
      preorderLink: magazine.preorderLink || '',
      isActive: magazine.isActive !== false,
    });
    setPricesUSD(magazine.prices?.USD || { price: 0, discountPrice: 0 });
    setPricesEUR(magazine.prices?.EUR || { price: 0, discountPrice: 0 });
    setPricesINR(magazine.prices?.INR || { price: 0, discountPrice: 0 });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this magazine?')) {
      try {
        await apiSend(`/api/magazines/${id}`, 'DELETE');
        setMagazines(prev => prev.filter(m => m._id !== id));
        setSuccessMsg('Magazine deleted successfully');
        setTimeout(() => setSuccessMsg(''), 3000);
      } catch (error) {
        console.error('Error deleting magazine:', error);
        alert('Failed to delete magazine.');
      }
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {successMsg && (
          <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">
            {successMsg}
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Magazines</h1>
              <p className="text-gray-600">Upload and manage your flipbook magazines</p>
            </div>
            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <FiPlus className="w-5 h-5" /> Add Magazine
            </button>
          </div>
        </div>

        {/* Magazines Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full flex items-center justify-center py-12"><Spinner /> Loading magazines...</div>
          ) : magazines.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <FiFile className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No magazines found</h3>
              <p className="text-gray-500">Get started by uploading your first magazine.</p>
            </div>
          ) : (
            magazines.map((magazine) => (
              <div key={magazine._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                {magazine.coverImageUrl ? (
                  <div className="h-48 bg-gray-200">
                    <img src={magazine.coverImageUrl} alt={magazine.title} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="h-48 bg-gray-200 flex items-center justify-center">
                    <FiImage className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1">{magazine.title}</h3>
                    {!magazine.isActive && (
                      <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">Draft</span>
                    )}
                  </div>
                  {magazine.description && (
                    <div className="text-gray-600 text-sm mb-3 line-clamp-2 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: magazine.description }} />
                  )}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {magazine.category && (
                      <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-700 rounded-full">{magazine.category}</span>
                    )}
                    <span className={`px-2 py-0.5 text-xs rounded-full ${magazine.accessType === 'paid' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {magazine.accessType === 'paid' ? 'Paid' : 'Free'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>{new Date(magazine.publishedAt || magazine.createdAt).toLocaleDateString()}</span>
                    {magazine.accessType === 'paid' && (
                      <span className="flex items-center gap-1"><FiDollarSign className="w-4 h-4" />{magazine.discountPrice || magazine.price || 0}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEdit(magazine)} className="text-blue-600 hover:text-blue-900 p-2 rounded hover:bg-blue-50">
                        <FiEdit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(magazine._id)} className="text-red-600 hover:text-red-900 p-2 rounded hover:bg-red-50">
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {magazine.pdfUrl && (
                      <a href={magazine.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-red-600 hover:text-red-800 text-xs font-medium">
                        View PDF
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Magazine Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">{editingMagazine ? 'Edit Magazine' : 'Add New Magazine'}</h3>
                <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                  <FiX className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Title + Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                    <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <input type="text" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500" placeholder="e.g., Monthly Issue, Special Edition..." />
                  </div>
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL Slug</label>
                  <input type="text" value={formData.slug || ''} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder={formData.title ? formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : 'auto-generated-from-title'} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 font-mono text-sm" />
                  <p className="mt-1 text-xs text-gray-500">Leave blank to auto-generate from title.</p>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <div className="mt-1 rounded-lg overflow-hidden border border-gray-200 focus-within:border-red-600 focus-within:ring-2 focus-within:ring-red-100 transition-all duration-200">
                    <LazyTinyMCE
                      apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
                      value={formData.description}
                      onEditorChange={(v) => setFormData({ ...formData, description: v })}
                      init={{
                        height: 250,
                        menubar: false,
                        plugins: 'link lists table code fullscreen image media',
                        toolbar:
                          'undo redo | formatselect | bold italic underline | alignleft aligncenter alignright | bullist numlist | link image media | code',
                        placeholder: 'Brief description of the magazine issue...',
                        content_style:
                          'body { font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; font-size:14px; color:#111827; background-color:#fff }'
                      }}
                    />
                  </div>
                </div>

                {/* Cover Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image *</label>
                  {formData.coverImageUrl ? (
                    <div className="relative inline-block mb-2">
                      <img src={formData.coverImageUrl} alt="Cover" className="h-40 rounded-lg object-cover border border-gray-200" />
                      <button type="button" onClick={() => setFormData(prev => ({ ...prev, coverImageUrl: '' }))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600">
                        <FiX className="w-3 h-3" />
                      </button>
                    </div>
                  ) : null}
                  <input type="file" accept="image/*" onChange={handleCoverUpload} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100" />
                  {uploadingCover && <p className="text-sm text-gray-500 mt-1 animate-pulse">Uploading cover image...</p>}
                </div>

                {/* PDF Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Magazine PDF *</label>
                  {formData.pdfUrl ? (
                    <div className="flex items-center gap-3 mb-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <FiFile className="w-5 h-5 text-green-600" />
                      <span className="text-sm text-green-800 flex-1 truncate">PDF uploaded</span>
                      <a href={formData.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-green-700 underline">Preview</a>
                      <button type="button" onClick={() => setFormData(prev => ({ ...prev, pdfUrl: '' }))} className="text-red-500 hover:text-red-700">
                        <FiX className="w-4 h-4" />
                      </button>
                    </div>
                  ) : null}
                  <input type="file" accept="application/pdf" onChange={handlePdfUpload} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100" />
                  {uploadingPdf && <p className="text-sm text-gray-500 mt-1 animate-pulse">Uploading PDF...</p>}
                </div>

                {/* Complementary Material Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Complementary Material (ZIP)</label>
                  {formData.complementaryMaterialUrl ? (
                    <div className="flex items-center gap-3 mb-2 p-3 bg-teal-50 border border-teal-200 rounded-lg">
                      <FiFile className="w-5 h-5 text-teal-600" />
                      <span className="text-sm text-teal-800 flex-1 truncate">{formData.complementaryMaterialName || 'Material uploaded'}</span>
                      <button type="button" onClick={() => setFormData(prev => ({ ...prev, complementaryMaterialUrl: '', complementaryMaterialName: '' }))} className="text-red-500 hover:text-red-700">
                        <FiX className="w-4 h-4" />
                      </button>
                    </div>
                  ) : null}
                  <input
                    type="file"
                    accept=".zip,application/zip,application/x-zip-compressed"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadingMaterial(true);
                      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
                      try {
                        const uploadFormData = new FormData();
                        uploadFormData.append('file', file);
                        const token = localStorage.getItem('authToken');
                        const response = await fetch(`${apiBaseUrl}/api/uploads/magazine-material`, {
                          method: 'POST',
                          headers: token ? { Authorization: `Bearer ${token}` } : {},
                          body: uploadFormData,
                        });
                        if (!response.ok) throw new Error('Upload failed');
                        const data = await response.json();
                        setFormData(prev => ({ ...prev, complementaryMaterialUrl: data.url, complementaryMaterialName: file.name }));
                      } catch (error) {
                        console.error('Material upload error:', error);
                        alert('Material upload failed.');
                      } finally {
                        setUploadingMaterial(false);
                        e.target.value = '';
                      }
                    }}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                  />
                  {uploadingMaterial && <p className="text-sm text-gray-500 mt-1 animate-pulse">Uploading material...</p>}
                </div>

                {/* Action Button Links */}
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-3">
                  <h4 className="text-sm font-semibold text-gray-800">Action Button Links</h4>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Donate Link</label>
                    <input type="url" value={formData.donateLink} onChange={(e) => setFormData({ ...formData, donateLink: e.target.value })} placeholder="https://..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-red-500 focus:border-red-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Subscribe Link</label>
                    <input type="url" value={formData.subscribeLink} onChange={(e) => setFormData({ ...formData, subscribeLink: e.target.value })} placeholder="https://..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-red-500 focus:border-red-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Pre-order Physical Copies Link</label>
                    <input type="url" value={formData.preorderLink} onChange={(e) => setFormData({ ...formData, preorderLink: e.target.value })} placeholder="https://..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-red-500 focus:border-red-500" />
                  </div>
                </div>

                {/* Access Type Toggle */}
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3">Access Type</h4>
                  <div className="flex items-center gap-4">
                    <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${formData.accessType === 'free' ? 'bg-green-50 border-green-300 text-green-700' : 'bg-white border-gray-300 text-gray-600'}`}>
                      <input type="radio" name="accessType" value="free" checked={formData.accessType === 'free'} onChange={(e) => setFormData({ ...formData, accessType: e.target.value })} className="accent-green-600" />
                      <span className="font-medium text-sm">Free</span>
                    </label>
                    <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${formData.accessType === 'paid' ? 'bg-red-50 border-red-300 text-red-700' : 'bg-white border-gray-300 text-gray-600'}`}>
                      <input type="radio" name="accessType" value="paid" checked={formData.accessType === 'paid'} onChange={(e) => setFormData({ ...formData, accessType: e.target.value })} className="accent-red-600" />
                      <span className="font-medium text-sm">Paid</span>
                    </label>
                  </div>
                </div>

                {/* Pricing Section - Only show when paid */}
                {formData.accessType === 'paid' && (
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
                    <h4 className="text-sm font-semibold text-gray-800">Pricing</h4>

                    {/* Default Price */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Default Price *</label>
                        <input type="number" min="0" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-red-500 focus:border-red-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Discount Price</label>
                        <input type="number" min="0" step="0.01" value={formData.discountPrice} onChange={(e) => setFormData({ ...formData, discountPrice: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-red-500 focus:border-red-500" />
                      </div>
                    </div>

                    {/* Multi-currency Prices */}
                    <div className="space-y-3">
                      <p className="text-xs text-gray-500 font-medium">Multi-Currency Pricing (Optional)</p>
                      {[
                        { label: 'USD ($)', state: pricesUSD, setter: setPricesUSD },
                        { label: 'EUR (\u20AC)', state: pricesEUR, setter: setPricesEUR },
                        { label: 'INR (\u20B9)', state: pricesINR, setter: setPricesINR },
                      ].map(({ label, state, setter }) => (
                        <div key={label} className="grid grid-cols-3 gap-3 items-center">
                          <span className="text-xs font-medium text-gray-600">{label}</span>
                          <input type="number" min="0" step="0.01" value={state.price} onChange={(e) => setter({ ...state, price: parseFloat(e.target.value) || 0 })} placeholder="Price" className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-red-500 focus:border-red-500" />
                          <input type="number" min="0" step="0.01" value={state.discountPrice} onChange={(e) => setter({ ...state, discountPrice: parseFloat(e.target.value) || 0 })} placeholder="Sale" className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-red-500 focus:border-red-500" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Active Toggle */}
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                  <span className="text-sm font-medium text-gray-700">
                    {formData.isActive ? 'Published' : 'Draft'}
                  </span>
                </div>

                {/* Submit */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSaving || uploadingCover || uploadingPdf} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-2">
                    {isSaving ? 'Saving...' : (editingMagazine ? 'Update Magazine' : 'Create Magazine')}
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

export default Magazines;
