import React, { useState, useEffect } from 'react';
import {
  FiPlus,
  FiSearch,
  FiEdit,
  FiTrash2,
  FiRefreshCw,
  FiTag,
  FiSave,
  FiX,
  FiHash
} from 'react-icons/fi';
import { apiGet, apiSend } from '../../utils/api'; // Import apiSend

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(searchTerm && { search: searchTerm })
      });

      const data = await apiGet(`/api/categories?${params}`);
      setCategories(data.categories || []);
      setTotalPages(data.totalPages || 1);
    } catch (error){
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [currentPage, searchTerm]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingCategory ? `/api/categories/${editingCategory._id}` : '/api/categories';
      const method = editingCategory ? 'PUT' : 'POST';

      await apiSend(url, method, formData);
      setShowModal(false);
      setEditingCategory(null);
      setFormData({ name: '', description: '' });
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Error saving category');
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await apiSend(`/api/categories/${categoryId}`, 'DELETE');
        fetchCategories();
      } catch (error) {
        console.error('Error deleting category:', error);
        alert('Error deleting category');
      }
    }
  };

  const generateSlug = (name) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  return (
    // ... rest of the component is unchanged
    <div className="p-6 bg-casa-cream/40 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-casa-ink mb-2">Categories Management</h1>
              <p className="text-casa-ink/65">Organize your courses with categories</p>
            </div>
            <button
              onClick={() => {
                setEditingCategory(null);
                setFormData({ name: '', description: '' });
                setShowModal(true);
              }}
              className="bg-casa-red text-white px-6 py-3 rounded-xl hover:bg-casa-redDark transition-colors flex items-center gap-2"
            >
              <FiPlus className="w-5 h-5" />
              Add Category
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-casa-ink/12 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-casa-ink/65">Total Categories</p>
                <p className="text-2xl font-bold text-casa-ink">{categories.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <FiTag className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-casa-ink/12 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-casa-ink/65">Active Categories</p>
                <p className="text-2xl font-bold text-green-600">
                  {categories.filter(c => c.isActive).length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <FiTag className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-casa-ink/12 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-casa-ink/65">This Month</p>
                <p className="text-2xl font-bold text-purple-600">
                  {categories.filter(c => {
                    const created = new Date(c.createdAt);
                    const now = new Date();
                    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <FiHash className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border border-casa-ink/12 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-casa-ink/40 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search categories by name or slug..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-casa-ink/20 rounded-xl focus:ring-2 focus:ring-casa-red focus:border-transparent"
                />
              </div>
            </div>
            <button
              onClick={fetchCategories}
              className="px-6 py-3 bg-casa-red text-white rounded-xl hover:bg-casa-redDark transition-colors flex items-center gap-2"
            >
              <FiRefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Categories Table */}
        <div className="bg-white rounded-xl shadow-sm border border-casa-ink/12 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <FiRefreshCw className="w-6 h-6 text-red-500 animate-spin mr-2" />
              <span className="text-casa-ink/65">Loading categories...</span>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-casa-cream/40 border-b border-casa-ink/12">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-casa-ink/50 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-casa-ink/50 uppercase tracking-wider">Slug</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-casa-ink/50 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-casa-ink/50 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-casa-ink/50 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-casa-ink/50 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {categories.map((category) => (
                      <tr key={category._id} className="hover:bg-casa-cream/40 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="p-2 bg-red-100 rounded-xl mr-3">
                              <FiTag className="w-4 h-4 text-casa-red" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-casa-ink">{category.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-casa-ink/50 font-mono">{category.slug}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-casa-ink max-w-xs truncate">
                            {category.description || 'No description'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            category.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-casa-redDark'
                          }`}>
                            {category.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-casa-ink/50">
                          {new Date(category.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(category)}
                              className="text-blue-600 hover:text-blue-900 p-2 rounded hover:bg-blue-50"
                            >
                              <FiEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(category._id)}
                              className="text-casa-red hover:text-red-900 p-2 rounded hover:bg-casa-red/8"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 border-t border-casa-ink/12 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-4 py-2 border border-casa-ink/20 text-sm font-medium rounded-xl text-casa-ink/75 bg-white hover:bg-casa-cream/40 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-casa-ink/20 text-sm font-medium rounded-xl text-casa-ink/75 bg-white hover:bg-casa-cream/40 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-casa-ink/75">
                          Page <span className="font-medium">{currentPage}</span> of{' '}
                          <span className="font-medium">{totalPages}</span>
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-xl shadow-sm -space-x-px">
                          <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-casa-ink/20 bg-white text-sm font-medium text-casa-ink/50 hover:bg-casa-cream/40 disabled:opacity-50"
                          >
                            Previous
                          </button>
                          <button
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-casa-ink/20 bg-white text-sm font-medium text-casa-ink/50 hover:bg-casa-cream/40 disabled:opacity-50"
                          >
                            Next
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Category Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="p-6 border-b border-casa-ink/12">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-casa-ink">
                    {editingCategory ? 'Edit Category' : 'Add New Category'}
                  </h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-casa-ink/40 hover:text-gray-600"
                  >
                    <FiX className="w-6 h-6" />
                  </button>
                </div>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-casa-ink/75 mb-2">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-casa-ink/20 rounded-xl focus:ring-2 focus:ring-casa-red focus:border-transparent"
                    placeholder="e.g., Beginner Spanish"
                    required
                  />
                  {formData.name && (
                    <p className="mt-1 text-xs text-casa-ink/50">
                      Slug: {generateSlug(formData.name)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-casa-ink/75 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-casa-ink/20 rounded-xl focus:ring-2 focus:ring-casa-red focus:border-transparent"
                    placeholder="Brief description of this category..."
                  />
                </div>

                <div className="flex items-center justify-end gap-4 pt-6 border-t border-casa-ink/12">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2 border border-casa-ink/20 rounded-xl text-casa-ink/75 hover:bg-casa-cream/40"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-casa-red text-white rounded-xl hover:bg-casa-redDark flex items-center gap-2"
                  >
                    <FiSave className="w-4 h-4" />
                    {editingCategory ? 'Update Category' : 'Create Category'}
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

export default Categories;