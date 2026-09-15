// src/pages/admin/ManageAdmins.jsx

import React, { useState, useEffect } from 'react';
import { 
  FiPlus, 
  FiSearch, 
  FiRefreshCw,
  FiMail,
  FiCheckCircle,
  FiTrash2,
  FiUser,
  FiShield,
  FiAlertCircle
} from 'react-icons/fi';
// CORRECTED: Import the API utility
import { apiGet, apiSend } from '../../utils/api';

const ManageAdmins = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(searchTerm && { search: searchTerm })
      });

      // CORRECTED: Use apiGet to fetch data
      const data = await apiGet(`/api/admins?${params}`);
      
      setAdmins(data.admins || []);
      setTotalPages(data.totalPages || 1);
      
    } catch (error) {
      console.error('Error fetching admins:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to fetch admins' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, [currentPage, searchTerm]);

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (!formData.email.trim() || !formData.password.trim()) {
      setMessage({ type: 'error', text: 'Email and password are required' });
      return;
    }

    setIsCreating(true);
    setMessage({ type: '', text: '' });

    try {
      // CORRECTED: Use apiSend to post data
      const data = await apiSend('/api/admins/create', 'POST', formData);

      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        setShowCreateModal(false);
        setFormData({ email: '', password: '' });
        fetchAdmins();
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      console.error('Error creating admin:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to create admin' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    if (window.confirm('Are you sure you want to delete this admin? This will remove their access permanently.')) {
      try {
        // CORRECTED: Use apiSend for DELETE request
        const data = await apiSend(`/api/admins/${adminId}`, 'DELETE');

        if (data.success) {
          setMessage({ type: 'success', text: data.message });
          fetchAdmins();
        } else {
          setMessage({ type: 'error', text: data.message });
        }
      } catch (error) {
        console.error('Error deleting admin:', error);
        setMessage({ type: 'error', text: 'Failed to delete admin' });
      }
    }
  };

  // ... (rest of the component's JSX is unchanged and correct)
  return (
    <div className="p-6 bg-casa-cream/40 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-casa-ink mb-2">Manage Admins</h1>
              <p className="text-casa-ink/65">Create and manage admin accounts</p>
            </div>
            <button
              onClick={() => {
                setFormData({ email: '', password: '' });
                setShowCreateModal(true);
              }}
              className="bg-casa-red text-white px-6 py-3 rounded-xl hover:bg-casa-redDark transition-colors flex items-center gap-2"
            >
              <FiPlus className="w-5 h-5" />
              Create Admin
            </button>
          </div>
        </div>

        {/* Message Display */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-xl ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-casa-red/8 border border-casa-red/25 text-casa-red'
          }`}>
            <div className="flex items-center gap-2">
              {message.type === 'success' ? <FiCheckCircle className="w-5 h-5" /> : <FiAlertCircle className="w-5 h-5" />}
              <span>{message.text}</span>
            </div>
          </div>
        )}
        
        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border border-casa-ink/12 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-casa-ink/40 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search admins by email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-casa-ink/20 rounded-xl focus:ring-2 focus:ring-casa-red focus:border-transparent"
                />
              </div>
            </div>
            <button
              onClick={fetchAdmins}
              className="px-6 py-3 bg-casa-red text-white rounded-xl hover:bg-casa-redDark transition-colors flex items-center gap-2"
            >
              <FiRefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Admins Table */}
        <div className="bg-white rounded-xl shadow-sm border border-casa-ink/12 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-casa-cream/40 border-b border-casa-ink/12">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-casa-ink/50 uppercase tracking-wider">Admin Email</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-casa-ink/50 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-casa-ink/50 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-casa-ink/50 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                    <tr><td colSpan="4" className="text-center py-10">Loading...</td></tr>
                ) : admins.map((admin) => (
                  <tr key={admin._id} className="hover:bg-casa-cream/40 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-casa-ink">{admin.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${admin.role === 'super-admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                            {admin.role === 'super-admin' ? <FiShield className="w-3 h-3"/> : <FiUser className="w-3 h-3"/>}
                            {admin.role}
                        </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-casa-ink/50">
                      {new Date(admin.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {admin.role !== 'super-admin' && (
                        <button
                          onClick={() => handleDeleteAdmin(admin._id)}
                          className="text-casa-red hover:text-red-900 p-2 rounded hover:bg-casa-red/8"
                          title="Delete Admin"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Admin Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="p-6 border-b border-casa-ink/12">
                <h3 className="text-lg font-semibold text-casa-ink">Create New Admin</h3>
              </div>
              <form onSubmit={handleCreateAdmin} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-casa-ink/75 mb-2">Email Address *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-casa-ink/20 rounded-xl focus:ring-2 focus:ring-casa-red focus:border-transparent"
                    placeholder="admin@example.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-casa-ink/75 mb-2">Password *</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-casa-ink/20 rounded-xl focus:ring-2 focus:ring-casa-red focus:border-transparent"
                    placeholder="Min. 6 characters"
                    required
                  />
                </div>
                <div className="flex items-center justify-end gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-casa-ink/20 rounded-xl text-casa-ink/75 hover:bg-casa-cream/40"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="px-4 py-2 bg-casa-red text-white rounded-xl hover:bg-casa-redDark disabled:opacity-50 flex items-center gap-2"
                  >
                    {isCreating ? <FiRefreshCw className="w-4 h-4 animate-spin" /> : <FiPlus className="w-4 h-4" />}
                    {isCreating ? 'Creating...' : 'Create Admin'}
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

export default ManageAdmins;