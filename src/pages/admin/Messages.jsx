import React, { useState, useEffect } from 'react';
import { 
  FiSearch, 
  FiRefreshCw,
  FiMail,
  FiUser,
  FiCalendar,
  FiMessageSquare,
  FiTrash2,
  FiDownload,
  FiFilter,
  FiEye,
  FiX,
  FiClock,
  FiCheckCircle
} from 'react-icons/fi';

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter })
      });

      const response = await fetch(`/api/forms?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.forms || data || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [currentPage, searchTerm, statusFilter]);

  const handleDelete = async (messageId) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`/api/forms/${messageId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          fetchMessages();
        }
      } catch (error) {
        console.error('Error deleting message:', error);
      }
    }
  };

  const handleViewDetails = (message) => {
    setSelectedMessage(message);
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

  const exportMessages = () => {
    const csvContent = [
      ['Name', 'Email', 'Subject', 'Message', 'Submitted At', 'Status'].join(','),
      ...messages.map(msg => [
        msg.name || 'N/A',
        msg.email || 'N/A',
        msg.subject || 'N/A',
        (msg.message || '').replace(/"/g, '""'),
        formatDate(msg.createdAt || msg.submittedAt),
        msg.status || 'new'
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contact-messages-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'read': return 'bg-blue-100 text-blue-800';
      case 'replied': return 'bg-green-100 text-green-800';
      case 'archived': return 'bg-casa-cream/60 text-casa-ink';
      default: return 'bg-red-100 text-casa-redDark';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'read': return <FiCheckCircle className="w-4 h-4 text-blue-500" />;
      case 'replied': return <FiMessageSquare className="w-4 h-4 text-green-500" />;
      case 'archived': return <FiClock className="w-4 h-4 text-casa-ink/50" />;
      default: return <FiMail className="w-4 h-4 text-red-500" />;
    }
  };

  return (
    <div className="p-6 bg-casa-cream/40 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-casa-ink mb-2">Messages Management</h1>
              <p className="text-casa-ink/65">View and manage contact form submissions</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={exportMessages}
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
                <p className="text-sm font-medium text-casa-ink/65">Total Messages</p>
                <p className="text-2xl font-bold text-casa-ink">{messages.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <FiMail className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-casa-ink/12 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-casa-ink/65">New Messages</p>
                <p className="text-2xl font-bold text-casa-red">
                  {messages.filter(m => !m.status || m.status === 'new').length}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-xl">
                <FiMail className="w-6 h-6 text-casa-red" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-casa-ink/12 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-casa-ink/65">Read Messages</p>
                <p className="text-2xl font-bold text-blue-600">
                  {messages.filter(m => m.status === 'read').length}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <FiCheckCircle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-casa-ink/12 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-casa-ink/65">This Month</p>
                <p className="text-2xl font-bold text-purple-600">
                  {messages.filter(m => {
                    const created = new Date(m.createdAt || m.submittedAt);
                    const now = new Date();
                    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
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
                  placeholder="Search messages by name, email, or subject..."
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
                <option value="new">New</option>
                <option value="read">Read</option>
                <option value="replied">Replied</option>
                <option value="archived">Archived</option>
              </select>
              <button
                onClick={fetchMessages}
                className="px-6 py-3 bg-casa-red text-white rounded-xl hover:bg-casa-redDark transition-colors flex items-center gap-2"
              >
                <FiRefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Messages Table */}
        <div className="bg-white rounded-xl shadow-sm border border-casa-ink/12 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <FiRefreshCw className="w-6 h-6 text-red-500 animate-spin mr-2" />
              <span className="text-casa-ink/65">Loading messages...</span>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-casa-cream/40 border-b border-casa-ink/12">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-casa-ink/50 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-casa-ink/50 uppercase tracking-wider">Subject</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-casa-ink/50 uppercase tracking-wider">Message</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-casa-ink/50 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-casa-ink/50 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-casa-ink/50 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {messages.map((message) => (
                      <tr key={message._id} className="hover:bg-casa-cream/40 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="p-2 bg-red-100 rounded-xl mr-3">
                              <FiUser className="w-4 h-4 text-casa-red" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-casa-ink">{message.name || 'Anonymous'}</div>
                              <div className="text-sm text-casa-ink/50">{message.email || 'No email'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-casa-ink max-w-xs truncate">
                            {message.subject || 'No subject'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-casa-ink max-w-xs truncate">
                            {message.message || message.content || 'No message content'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(message.status || 'new')}
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(message.status || 'new')}`}>
                              {(message.status || 'new').charAt(0).toUpperCase() + (message.status || 'new').slice(1)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-casa-ink/50">
                          {formatDate(message.createdAt || message.submittedAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewDetails(message)}
                              className="text-blue-600 hover:text-blue-900 p-2 rounded hover:bg-blue-50"
                            >
                              <FiEye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(message._id)}
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

        {/* Message Details Modal */}
        {showModal && selectedMessage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-casa-ink/12">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-casa-ink">Message Details</h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-casa-ink/40 hover:text-gray-600"
                  >
                    <FiX className="w-6 h-6" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-casa-ink/50">Name</label>
                    <p className="text-sm text-casa-ink">{selectedMessage.name || 'Anonymous'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-casa-ink/50">Email</label>
                    <p className="text-sm text-casa-ink">{selectedMessage.email || 'No email provided'}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-casa-ink/50">Subject</label>
                  <p className="text-sm text-casa-ink">{selectedMessage.subject || 'No subject'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-casa-ink/50">Message</label>
                  <div className="mt-1 p-4 bg-casa-cream/40 rounded-xl">
                    <p className="text-sm text-casa-ink whitespace-pre-wrap">
                      {selectedMessage.message || selectedMessage.content || 'No message content'}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-casa-ink/50">Status</label>
                    <p className={`text-sm font-medium ${
                      selectedMessage.status === 'read' ? 'text-blue-600' :
                      selectedMessage.status === 'replied' ? 'text-green-600' :
                      selectedMessage.status === 'archived' ? 'text-casa-ink/65' :
                      'text-casa-red'
                    }`}>
                      {(selectedMessage.status || 'new').charAt(0).toUpperCase() + (selectedMessage.status || 'new').slice(1)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-casa-ink/50">Submitted At</label>
                    <p className="text-sm text-casa-ink">{formatDate(selectedMessage.createdAt || selectedMessage.submittedAt)}</p>
                  </div>
                </div>
                {selectedMessage.phone && (
                  <div>
                    <label className="text-sm font-medium text-casa-ink/50">Phone</label>
                    <p className="text-sm text-casa-ink">{selectedMessage.phone}</p>
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

export default Messages;