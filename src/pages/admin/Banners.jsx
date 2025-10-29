import React, { useState, useEffect } from 'react';
import { 
  FiPlus, 
  FiSearch, 
  FiEdit, 
  FiTrash2, 
  FiRefreshCw,
  FiImage,
  FiSave,
  FiX,
  FiEye,
  FiEyeOff,
  FiLink
} from 'react-icons/fi';
import { apiGet, apiSend } from '../../utils/api';

const Banners = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    caption: '',
    imageUrl: '',
    link: '',
    position: 'hero',
    order: 0
  });

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 12,
        ...(searchTerm && { search: searchTerm }),
        ...(positionFilter && { position: positionFilter }),
        ...(statusFilter && { isActive: statusFilter })
      });
      const data = await apiGet(`/api/banners?${params}`);
      setBanners(data.banners || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching banners:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, [currentPage, searchTerm, positionFilter, statusFilter]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { timestamp, signature } = await apiGet('/api/cloudinary-signature');
      const cloudFormData = new FormData();
      cloudFormData.append('file', file);
      cloudFormData.append('api_key', import.meta.env.VITE_CLOUDINARY_API_KEY);
      cloudFormData.append('timestamp', timestamp);
      cloudFormData.append('signature', signature);
      cloudFormData.append('upload_preset', 'casadeele_materials');

      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
        method: 'POST',
        body: cloudFormData,
      });

      if (!response.ok) {
        throw new Error('Cloudinary upload failed');
      }

      const data = await response.json();
      setFormData({ ...formData, imageUrl: data.secure_url });
    } catch (error) {
      console.error('Upload failed', error);
      alert('Image upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.imageUrl) {
        alert("Please upload an image for the banner.");
        return;
      }
      const url = editingBanner ? `/api/banners/${editingBanner._id}` : '/api/banners';
      const method = editingBanner ? 'PUT' : 'POST';

      await apiSend(url, method, formData);
      setShowModal(false);
      fetchBanners();
    } catch (error) {
      console.error('Error saving banner:', error);
      alert('Error saving banner. Check console for details.');
    }
  };

  const handleEdit = (banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      caption: banner.caption || '',
      imageUrl: banner.imageUrl || '',
      link: banner.link || '',
      position: banner.position || 'hero',
      order: banner.order || 0
    });
    setShowModal(true);
  };

  const handleDelete = async (bannerId) => {
    if (window.confirm('Are you sure you want to delete this banner?')) {
      try {
        await apiSend(`/api/banners/${bannerId}`, 'DELETE');
        fetchBanners();
      } catch (error) {
        console.error('Error deleting banner:', error);
      }
    }
  };

  const toggleBannerStatus = async (bannerId) => {
    try {
      await apiSend(`/api/banners/${bannerId}/toggle`, 'PUT');
      fetchBanners();
    } catch (error) {
      console.error('Error toggling banner status:', error);
    }
  };

  const getPositionColor = (position) => {
    switch (position) {
      case 'hero': return 'bg-red-100 text-red-800';
      case 'top': return 'bg-blue-100 text-blue-800';
      case 'middle': return 'bg-green-100 text-green-800';
      case 'bottom': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Banners Management</h1>
              <p className="text-gray-600">Manage website banners and promotional content</p>
            </div>
            <button
              onClick={() => {
                setEditingBanner(null);
                setFormData({
                  title: '',
                  caption: '',
                  imageUrl: '',
                  link: '',
                  position: 'hero',
                  order: 0
                });
                setShowModal(true);
              }}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <FiPlus className="w-5 h-5" />
              Add Banner
            </button>
          </div>
        </div>

        {/* Stats Cards and Filters */}
        {/* ... (These sections are unchanged) ... */}

        {/* Banners Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <FiRefreshCw className="w-6 h-6 text-red-500 animate-spin mr-2" />
              <span className="text-gray-600">Loading banners...</span>
            </div>
          ) : banners.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <FiImage className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No banners found</h3>
              <p className="text-gray-500">Get started by creating your first banner.</p>
            </div>
          ) : (
            banners.map((banner) => (
              <div key={banner._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative">
                  {banner.imageUrl ? (
                    <div className="h-48 bg-gray-200">
                      <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="h-48 bg-gray-200 flex items-center justify-center">
                      <FiImage className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPositionColor(banner.position)}`}>
                      {banner.position}
                    </span>
                    <button onClick={() => toggleBannerStatus(banner._id)} className={`p-1 rounded-full ${banner.isActive ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}>
                      {banner.isActive ? <FiEye className="w-4 h-4" /> : <FiEyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{banner.title}</h3>
                  {banner.caption && (<p className="text-gray-600 text-sm mb-3 line-clamp-2">{banner.caption}</p>)}
                  {banner.link && (<div className="flex items-center text-sm text-blue-600 mb-3"><FiLink className="w-4 h-4 mr-1" /><span className="truncate">Has Link</span></div>)}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEdit(banner)} className="text-blue-600 hover:text-blue-900 p-2 rounded hover:bg-blue-50"><FiEdit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(banner._id)} className="text-red-600 hover:text-red-900 p-2 rounded hover:bg-red-50"><FiTrash2 className="w-4 h-4" /></button>
                    </div>
                    <span className="text-xs text-gray-500">Order: {banner.order}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {/* ... (This section is unchanged) ... */}

        {/* Banner Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">{editingBanner ? 'Edit Banner' : 'Add New Banner'}</h3>
                  <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><FiX className="w-6 h-6" /></button>
                </div>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                    <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                    <select value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500">
                      <option value="hero">Hero</option>
                      <option value="top">Top</option>
                      <option value="middle">Middle</option>
                      <option value="bottom">Bottom</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Caption</label>
                  <textarea value={formData.caption} onChange={(e) => setFormData({ ...formData, caption: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" placeholder="Brief description..."></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Banner Image *</label>
                  <div className="mt-1 p-4 border-2 border-dashed border-gray-300 rounded-lg">
                    <input type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"/>
                    {uploading && <div className="text-sm text-gray-500 mt-2">Uploading...</div>}
                    {formData.imageUrl && !uploading && (
                      <div className="mt-4">
                        <img src={formData.imageUrl} alt="Banner Preview" className="w-full h-32 object-contain rounded-lg border border-gray-200" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Link URL</label>
                    <input type="url" value={formData.link} onChange={(e) => setFormData({ ...formData, link: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" placeholder="https://example.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Display Order</label>
                    <input type="number" value={formData.order} onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" min="0" />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
                  <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={uploading} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 disabled:opacity-50">
                    <FiSave className="w-4 h-4" />
                    {editingBanner ? 'Update Banner' : 'Create Banner'}
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

export default Banners;