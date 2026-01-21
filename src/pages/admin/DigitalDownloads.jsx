import React, { useState, useEffect } from 'react';
import { FiDownload, FiMail, FiRefreshCw, FiSearch, FiEye, FiCalendar, FiFilter } from 'react-icons/fi';
import { apiGet, apiSend } from '../../utils/api';
import Spinner from '../../components/Common/Spinner';

const DigitalDownloads = () => {
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDownloads, setTotalDownloads] = useState(0);
  const [selectedDownload, setSelectedDownload] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  // Fetch downloads
  const fetchDownloads = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter })
      });

      const data = await apiGet(`/api/digital-downloads/admin?${params}`);
      setDownloads(data.downloads || []);
      setTotalPages(data.totalPages || 1);
      setTotalDownloads(data.total || 0);
    } catch (error) {
      console.error('Error fetching downloads:', error);
      setDownloads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDownloads();
  }, [currentPage, statusFilter]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        fetchDownloads();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset download count
  const handleResetCount = async (downloadId) => {
    if (!window.confirm('Are you sure you want to reset the download count for this record?')) {
      return;
    }

    try {
      setActionLoading(downloadId);
      await apiSend(`/api/digital-downloads/admin/reset/${downloadId}`, 'POST');
      fetchDownloads();
      alert('Download count reset successfully');
    } catch (error) {
      console.error('Error resetting download count:', error);
      alert(`Failed to reset count: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // View download history
  const handleViewHistory = (download) => {
    setSelectedDownload(download);
    setShowHistoryModal(true);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'exhausted':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'revoked':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Digital Downloads Management</h1>
          <p className="text-gray-600">Monitor and manage customer download access</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Records</p>
                <p className="text-2xl font-bold text-gray-900">{totalDownloads}</p>
              </div>
              <FiDownload className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {downloads.filter(d => d.status === 'active').length}
                </p>
              </div>
              <FiDownload className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Exhausted</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {downloads.filter(d => d.status === 'exhausted').length}
                </p>
              </div>
              <FiDownload className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Expired</p>
                <p className="text-2xl font-bold text-red-600">
                  {downloads.filter(d => d.status === 'expired').length}
                </p>
              </div>
              <FiDownload className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by email, order ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="w-full md:w-48">
              <div className="relative">
                <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-red-500 focus:border-red-500 appearance-none"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="exhausted">Exhausted</option>
                  <option value="expired">Expired</option>
                  <option value="revoked">Revoked</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Downloads Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <Spinner />
              <p className="mt-4 text-gray-600">Loading downloads...</p>
            </div>
          ) : downloads.length === 0 ? (
            <div className="p-12 text-center">
              <FiDownload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No downloads found</h3>
              <p className="text-gray-500">No download records match your filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product & Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Downloads
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expires
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {downloads.map((download) => (
                    <tr key={download._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{download.productName}</p>
                          <p className="text-sm text-gray-500">{download.customerEmail}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        #{download.orderId.slice(-8)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="text-sm">
                            <span className={`font-semibold ${
                              download.downloadCount >= download.maxDownloads
                                ? 'text-red-600'
                                : 'text-gray-900'
                            }`}>
                              {download.downloadCount}
                            </span>
                            <span className="text-gray-500"> / {download.maxDownloads}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(download.status)}`}>
                          {download.status.charAt(0).toUpperCase() + download.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(download.expiresAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewHistory(download)}
                            className="text-blue-600 hover:text-blue-900 p-2 rounded hover:bg-blue-50"
                            title="View History"
                          >
                            <FiEye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleResetCount(download._id)}
                            disabled={actionLoading === download._id}
                            className="text-green-600 hover:text-green-900 p-2 rounded hover:bg-green-50 disabled:opacity-50"
                            title="Reset Download Count"
                          >
                            {actionLoading === download._id ? (
                              <Spinner size="sm" />
                            ) : (
                              <FiRefreshCw className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <nav className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </nav>
          </div>
        )}

        {/* History Modal */}
        {showHistoryModal && selectedDownload && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
                <h3 className="text-lg font-semibold text-gray-900">Download History</h3>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>
              <div className="p-6">
                {/* Download Info */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">{selectedDownload.productName}</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Customer</p>
                      <p className="font-medium text-gray-900">{selectedDownload.customerName}</p>
                      <p className="text-gray-600">{selectedDownload.customerEmail}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Order ID</p>
                      <p className="font-medium text-gray-900">#{selectedDownload.orderId.slice(-8)}</p>
                    </div>
                  </div>
                </div>

                {/* Download Events */}
                <h4 className="font-semibold text-gray-900 mb-4">Download Events ({selectedDownload.downloads.length})</h4>
                {selectedDownload.downloads.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No downloads yet</p>
                ) : (
                  <div className="space-y-4">
                    {selectedDownload.downloads.map((event, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{event.fileName}</p>
                            <p className="text-sm text-gray-600 mt-1">
                              {formatDate(event.downloadedAt)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              IP: {event.ipAddress}
                            </p>
                          </div>
                          <span className="text-sm font-medium text-red-600">
                            #{selectedDownload.downloads.length - index}
                          </span>
                        </div>
                      </div>
                    ))}
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

export default DigitalDownloads;
