import React, { useState, useEffect } from 'react';
import { apiGet, apiSend } from '../../utils/api';
import { 
  FiSearch, 
  FiRefreshCw,
  FiMail,
  FiUser,
  FiCalendar,
  FiCheckCircle,
  FiXCircle,
  FiTrash2,
  FiDownload,
  FiFilter,
  FiEye,
  FiEyeOff
} from 'react-icons/fi';

const Subscribers = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedSubscriber, setSelectedSubscriber] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { isActive: statusFilter })
      });
      const data = await apiGet(`/api/subscribers?${params}`);
      setSubscribers(data.subscribers || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching subscribers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, [currentPage, searchTerm, statusFilter]);

  const handleUnsubscribe = async (subscriberId) => {
    if (window.confirm('Are you sure you want to unsubscribe this user?')) {
      try {
        await apiSend(`/api/subscribers/${subscriberId}/unsubscribe`, 'PUT');
        fetchSubscribers();
      } catch (error) {
        console.error('Error unsubscribing user:', error);
      }
    }
  };

  const handleDelete = async (subscriberId) => {
    if (window.confirm('Are you sure you want to delete this subscriber?')) {
      try {
        await apiSend(`/api/subscribers/${subscriberId}`, 'DELETE');
        fetchSubscribers();
      } catch (error) {
        console.error('Error deleting subscriber:', error);
      }
    }
  };

  const handleViewDetails = (subscriber) => {
    setSelectedSubscriber(subscriber);
    setShowModal(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportSubscribers = () => {
    const csvContent = [
      ['Name', 'Email', 'Status', 'Subscribed At', 'Source', 'Tags'].join(','),
      ...subscribers.map(sub => [
        sub.name,
        sub.email,
        sub.isActive ? 'Active' : 'Inactive',
        formatDate(sub.subscribedAt),
        sub.source || 'website',
        (sub.tags || []).join(';')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscribers-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 bg-casa-cream/40 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-casa-ink mb-2">Subscribers Management</h1>
              <p className="text-casa-ink/65">Manage your newsletter and email subscribers</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={exportSubscribers}
                className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <FiDownload className="w-5 h-5" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-casa-ink/12 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-casa-ink/65">Total Subscribers</p>
                <p className="text-2xl font-bold text-casa-ink">{subscribers.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <FiMail className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-casa-ink/12 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-casa-ink/65">Active Subscribers</p>
                <p className="text-2xl font-bold text-green-600">
                  {subscribers.filter(s => s.isActive).length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <FiCheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-casa-ink/12 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-casa-ink/65">Unsubscribed</p>
                <p className="text-2xl font-bold text-casa-red">
                  {subscribers.filter(s => !s.isActive).length}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-xl">
                <FiXCircle className="w-6 h-6 text-casa-red" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-casa-ink/12 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-casa-ink/65">This Month</p>
                <p className="text-2xl font-bold text-purple-600">
                  {subscribers.filter(s => {
                    const subscribed = new Date(s.subscribedAt);
                    const now = new Date();
                    return subscribed.getMonth() === now.getMonth() && subscribed.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <FiCalendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-casa-ink/12 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-casa-ink/40 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search subscribers by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-casa-ink/20 rounded-xl focus:ring-2 focus:ring-casa-red focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border border-casa-ink/20 rounded-xl focus:ring-2 focus:ring-casa-red focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
              <button
                onClick={fetchSubscribers}
                className="px-6 py-3 bg-casa-red text-white rounded-xl hover:bg-casa-redDark transition-colors flex items-center gap-2"
              >
                <FiRefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Subscribers Table */}
        <div className="bg-white rounded-xl shadow-sm border border-casa-ink/12 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <FiRefreshCw className="w-6 h-6 text-red-500 animate-spin mr-2" />
              <span className="text-casa-ink/65">Loading subscribers...</span>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-casa-cream/40 border-b border-casa-ink/12">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-casa-ink/50 uppercase tracking-wider">Subscriber</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-casa-ink/50 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-casa-ink/50 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-casa-ink/50 uppercase tracking-wider">Source</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-casa-ink/50 uppercase tracking-wider">Subscribed</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-casa-ink/50 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {subscribers.map((subscriber) => (
                      <tr key={subscriber._id} className="hover:bg-casa-cream/40 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="p-2 bg-red-100 rounded-xl mr-3">
                              <FiUser className="w-4 h-4 text-casa-red" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-casa-ink">{subscriber.name}</div>
                              {subscriber.tags && subscriber.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {subscriber.tags.slice(0, 2).map((tag, index) => (
                                    <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-casa-cream/60 text-casa-ink">
                                      {tag}
                                    </span>
                                  ))}
                                  {subscriber.tags.length > 2 && (
                                    <span className="text-xs text-casa-ink/50">+{subscriber.tags.length - 2} more</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-casa-ink">{subscriber.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {subscriber.isActive ? (
                              <FiCheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <FiXCircle className="w-4 h-4 text-red-500" />
                            )}
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              subscriber.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-casa-redDark'
                            }`}>
                              {subscriber.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-casa-ink capitalize">{subscriber.source || 'website'}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-casa-ink/50">
                          {formatDate(subscriber.subscribedAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewDetails(subscriber)}
                              className="text-blue-600 hover:text-blue-900 p-2 rounded hover:bg-blue-50"
                            >
                              <FiEye className="w-4 h-4" />
                            </button>
                            {subscriber.isActive && (
                              <button
                                onClick={() => handleUnsubscribe(subscriber._id)}
                                className="text-yellow-600 hover:text-yellow-900 p-2 rounded hover:bg-yellow-50"
                                title="Unsubscribe"
                              >
                                <FiEyeOff className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(subscriber._id)}
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

        {/* Subscriber Details Modal */}
        {showModal && selectedSubscriber && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-casa-ink/12">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-casa-ink">Subscriber Details</h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-casa-ink/40 hover:text-gray-600"
                  >
                    <FiXCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-casa-ink/50">Name</label>
                    <p className="text-sm text-casa-ink">{selectedSubscriber.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-casa-ink/50">Email</label>
                    <p className="text-sm text-casa-ink">{selectedSubscriber.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-casa-ink/50">Status</label>
                    <p className={`text-sm font-medium ${
                      selectedSubscriber.isActive ? 'text-green-600' : 'text-casa-red'
                    }`}>
                      {selectedSubscriber.isActive ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-casa-ink/50">Source</label>
                    <p className="text-sm text-casa-ink capitalize">{selectedSubscriber.source || 'website'}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-casa-ink/50">Subscribed At</label>
                  <p className="text-sm text-casa-ink">{formatDate(selectedSubscriber.subscribedAt)}</p>
                </div>
                {selectedSubscriber.unsubscribedAt && (
                  <div>
                    <label className="text-sm font-medium text-casa-ink/50">Unsubscribed At</label>
                    <p className="text-sm text-casa-ink">{formatDate(selectedSubscriber.unsubscribedAt)}</p>
                  </div>
                )}
                {selectedSubscriber.tags && selectedSubscriber.tags.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-casa-ink/50">Tags</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedSubscriber.tags.map((tag, index) => (
                        <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-casa-redDark">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Subscribers;