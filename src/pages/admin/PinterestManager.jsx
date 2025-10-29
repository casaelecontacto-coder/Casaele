import React, { useState, useEffect } from 'react';
import { FiExternalLink, FiImage, FiSave, FiTrash2, FiEdit, FiRefreshCw, FiShare2 } from 'react-icons/fi';
import { apiGet, apiSend } from '../../utils/api';

function useAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function PinterestManager() {
  const [pinterestData, setPinterestData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [url, setUrl] = useState('');
  const [mode, setMode] = useState('fetch'); // 'fetch' or 'embed'
  const [fetchedData, setFetchedData] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '' });
  const headers = useAuthHeaders();

  useEffect(() => {
    fetchPinterestData();
  }, []);

  const fetchPinterestData = async () => {
    try {
      setLoading(true);
      const result = await apiGet('/api/pinterest');
      
      if (result.success) {
        setPinterestData(result.data);
      } else {
        setError(result.message || 'Failed to fetch Pinterest data');
      }
    } catch (err) {
      setError('Failed to fetch Pinterest data');
    } finally {
      setLoading(false);
    }
  };

  const handleFetchInfo = async (e) => {
    e.preventDefault();
    if (!url.trim()) {
      setError('Please enter a Pinterest URL');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setFetchedData(null);

      const result = await apiSend('/api/pinterest/fetch', 'POST', { url });

      if (result.success) {
        setFetchedData(result.data);
        setSuccess('Pinterest data fetched successfully!');
      } else {
        setError(result.message || 'Failed to fetch Pinterest data');
      }
    } catch (err) {
      setError('Failed to fetch Pinterest data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveData = async () => {
    if (!fetchedData) return;

    try {
      setLoading(true);
      setError('');

      const result = await apiSend('/api/pinterest/save', 'POST', fetchedData);

      if (result.success) {
        setSuccess('Pinterest data saved successfully!');
        setFetchedData(null);
        setUrl('');
        fetchPinterestData();
      } else {
        setError(result.message || 'Failed to save Pinterest data');
      }
    } catch (err) {
      setError('Failed to save Pinterest data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this Pinterest item?')) return;

    try {
      setLoading(true);
      const result = await apiSend(`/api/pinterest/${id}`, 'DELETE');

      if (result.success) {
        setSuccess('Pinterest item deleted successfully!');
        fetchPinterestData();
      } else {
        setError(result.message || 'Failed to delete Pinterest item');
      }
    } catch (err) {
      setError('Failed to delete Pinterest item');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setEditForm({ title: item.title, description: item.description || '' });
  };

  const handleUpdate = async () => {
    try {
      setLoading(true);
      const result = await apiSend(`/api/pinterest/${editingId}`, 'PUT', editForm);

      if (result.success) {
        setSuccess('Pinterest item updated successfully!');
        setEditingId(null);
        setEditForm({ title: '', description: '' });
        fetchPinterestData();
      } else {
        setError(result.message || 'Failed to update Pinterest item');
      }
    } catch (err) {
      setError('Failed to update Pinterest item');
    } finally {
      setLoading(false);
    }
  };

  const PinterestPreview = ({ data }) => {
    if (!data) return null;

    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start gap-4">
          {data.imageUrl && (
            <div className="flex-shrink-0">
              <img 
                src={data.imageUrl} 
                alt={data.title}
                className="w-24 h-24 object-cover rounded-lg shadow-sm"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 leading-tight">{data.title}</h3>
              <span className="ml-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 flex-shrink-0">
                {data.type}
              </span>
            </div>
            {data.description && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-3 leading-relaxed">{data.description}</p>
            )}
            {data.sourceUrl && (
              <a 
                href={data.sourceUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-red-600 hover:text-red-800 font-medium"
              >
                <FiExternalLink className="w-4 h-4" />
                View on Pinterest
              </a>
            )}
          </div>
        </div>
        
        {/* Embed Preview */}
        <div className="mt-6">
          <div className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            Embed Preview
          </div>
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/50">
            <div 
              className="w-full min-h-[200px] flex items-center justify-center" 
              dangerouslySetInnerHTML={{ __html: data.embedCode }}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/60">
      <div className="space-y-8 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pinterest Manager</h1>
            <p className="text-gray-600 mt-1">Manage and embed Pinterest content</p>
          </div>
          <button 
            onClick={fetchPinterestData}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
          >
            <FiRefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <div className="text-sm font-medium text-red-800">{error}</div>
            </div>
          </div>
        )}
        
        {success && (
          <div className="rounded-lg bg-green-50 border border-green-200 p-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="text-sm font-medium text-green-800">{success}</div>
            </div>
          </div>
        )}

        {/* Fetch Form */}
        <div className="rounded-2xl bg-white shadow-sm border border-gray-200 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <FiImage className="w-4 h-4 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Fetch Pinterest Data</h2>
          </div>
          
          <form onSubmit={handleFetchInfo} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Pinterest URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.pinterest.com/pin/1234567890/ or https://www.pinterest.com/username/board-name/"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-colors"
                required
              />
              <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                Supports individual pins and boards
              </p>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md"
              >
                {loading ? (
                  <FiRefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <FiImage className="w-4 h-4" />
                )}
                {loading ? 'Fetching...' : 'Fetch Info'}
              </button>
            </div>
          </form>

          {/* Fetched Data Preview */}
          {fetchedData && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Fetched Data
                </h3>
                <button
                  onClick={handleSaveData}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm hover:shadow-md"
                >
                  <FiSave className="w-4 h-4" />
                  Save to Collection
                </button>
              </div>
              <PinterestPreview data={fetchedData} />
            </div>
          )}
        </div>

        {/* Saved Pinterest Data */}
        <div className="rounded-2xl bg-white shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-200 bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <FiShare2 className="w-4 h-4 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Saved Pinterest Items</h2>
              <span className="ml-auto px-3 py-1 bg-gray-200 text-gray-700 text-sm font-medium rounded-full">
                {pinterestData.length} items
              </span>
            </div>
          </div>
          
          <div className="p-8">
            {loading && pinterestData.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiRefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
                </div>
                <div className="text-gray-500 font-medium">Loading Pinterest items...</div>
              </div>
            ) : pinterestData.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiShare2 className="w-8 h-8 text-gray-400" />
                </div>
                <div className="text-gray-500 font-medium mb-2">No Pinterest items saved yet</div>
                <div className="text-gray-400 text-sm">Fetch some Pinterest content to get started</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {pinterestData.map((item) => (
                  <div key={item._id} className="group relative bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200">
                    {editingId === item._id ? (
                      <div className="space-y-4">
                        <input
                          type="text"
                          value={editForm.title}
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                          placeholder="Title"
                        />
                        <textarea
                          value={editForm.description}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                          rows="3"
                          placeholder="Description"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleUpdate}
                            disabled={loading}
                            className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 line-clamp-2 leading-tight mb-1">{item.title}</h3>
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                {item.type}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(item.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <FiEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item._id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        {item.imageUrl && (
                          <div className="mb-4">
                            <img 
                              src={item.imageUrl} 
                              alt={item.title}
                              className="w-full h-40 object-cover rounded-lg shadow-sm"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          </div>
                        )}
                        
                        {item.description && (
                          <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed mb-4">{item.description}</p>
                        )}
                        
                        {item.sourceUrl && (
                          <a
                            href={item.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-red-600 hover:text-red-800 font-medium"
                          >
                            <FiExternalLink className="w-4 h-4" />
                            View on Pinterest
                          </a>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
