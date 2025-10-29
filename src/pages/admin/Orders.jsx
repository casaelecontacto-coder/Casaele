import React, { useState, useEffect } from 'react';
import {
  FiSearch,
  FiEye,
  FiTrash2,
  FiEdit, 
  FiPackage,
  FiRefreshCw,
  FiDollarSign,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle
} from 'react-icons/fi';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Processing'); // <-- THIS IS THE CHANGED LINE
  const [paymentFilter, setPaymentFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [totalOrdersCount, setTotalOrdersCount] = useState(0);
  const [stats, setStats] = useState({ completed: 0, pending: 0, failed: 0 });

  // =====================================================================
  // FETCH ORDERS
  // =====================================================================
  const fetchOrders = async () => {
    setLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
        ...(paymentFilter && { paymentStatus: paymentFilter })
      });

      // --- FIX #1: Use the full Base URL for robustness ---
      const url = `${import.meta.env.VITE_API_BASE_URL}/api/orders?${params.toString()}`;


      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      
      // --- FIX #2: Correctly handle JSON response ---
      if (response.ok) {
        // If response is OK, parse it as JSON
        const data = await response.json();

        if (data && data.orders) {
          console.log(`[DEBUG] fetchOrders: ✅ SUCCESS! Found ${data.orders.length} orders.`);
          console.log('[DEBUG] fetchOrders: Total orders:', data.totalOrders);
          console.log('[DEBUG] fetchOrders: Total pages:', data.totalPages);
        } else {
          console.error('[DEBUG] fetchOrders: ⚠️ API OK, but "data.orders" is missing or undefined.');
          console.log('[DEBUG] fetchOrders: Possible cause: backend returned wrong JSON shape or unauthorized access.');
        }

        const fetchedOrders = data.orders || [];
        setOrders(fetchedOrders);
        setTotalPages(data.totalPages || 1);
        setTotalOrdersCount(data.totalOrders || 0);

        const completed = fetchedOrders.filter(o => o.isDelivered).length;
        const pending = fetchedOrders.filter(o => !o.isPaid && o.paymentResult?.status !== 'failed').length;
        const failed = fetchedOrders.filter(o => o.paymentResult?.status === 'failed').length;
        setStats({ completed, pending, failed });

      } else {
        // If response is NOT OK, get the error message as text
        const errorBody = await response.text();
        console.error(`[DEBUG] fetchOrders: ❌ FAILED! Response not OK (${response.status}).`);
        console.error('[DEBUG] fetchOrders: Error body:', errorBody);
        setOrders([]);
        // Optionally, throw an error to be caught by the catch block
        throw new Error(`Server responded with ${response.status}: ${errorBody}`);
      }
      // --- END OF FIXES ---

    } catch (error) {
      console.error('[DEBUG] fetchOrders: 💥 CATCH BLOCK ERROR (e.g., network error or thrown error):', error);
      setOrders([]);
    } finally {
      setLoading(false);
      console.log('--- [DEBUG] fetchOrders: FINISHED ---');
    }
  };

  // =====================================================================
  // EFFECTS + HANDLERS (unchanged)
  // =====================================================================
  useEffect(() => {
    fetchOrders();
  }, [currentPage, searchTerm, statusFilter, paymentFilter]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/orders/${orderId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) fetchOrders();
      } catch (error) {
        console.error('Error deleting order:', error);
      }
    }
  };

  const getSyntheticStatus = (order) => {
    if (order.isDelivered) return 'delivered';
    if (order.isPaid) return 'processing';
    if (order.paymentResult?.status === 'failed') return 'failed';
    return 'pending';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered': return <FiCheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
      case 'shipped': return <FiPackage className="w-4 h-4 text-blue-500" />;
      case 'pending': return <FiClock className="w-4 h-4 text-yellow-500" />;
      case 'failed': return <FiXCircle className="w-4 h-4 text-red-500" />;
      case 'cancelled': return <FiXCircle className="w-4 h-4 text-gray-500" />;
      default: return <FiAlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPaymentStatus = (order) => {
    return order.paymentResult?.status || (order.isPaid ? 'completed' : 'pending');
  };

  const getPaymentStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <FiCheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending': return <FiClock className="w-4 h-4 text-yellow-500" />;
      case 'failed': return <FiXCircle className="w-4 h-4 text-red-500" />;
      case 'refunded': return <FiRefreshCw className="w-4 h-4 text-blue-500" />;
      default: return <FiAlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Orders Management</h1>
          <p className="text-gray-600">Manage and track all customer orders</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{totalOrdersCount || 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FiDollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.completed}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <FiCheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.pending}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <FiClock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.failed}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <FiXCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search orders by ID, customer name, email..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">All Payments</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
              <button
                onClick={fetchOrders}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <FiRefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <FiRefreshCw className="w-6 h-6 text-red-500 animate-spin mr-2" />
              <span className="text-gray-600">Loading orders...</span>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product(s)</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                          No orders found.
                        </td>
                      </tr>
                    ) : (
                      orders.map((order) => {
                        const syntheticStatus = getSyntheticStatus(order);
                        const paymentStatus = getPaymentStatus(order);
                        
                        return (
                          <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                            {/* Order ID */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-medium text-gray-900">{order.razorpayOrderId || order._id}</span>
                            </td>
                            {/* Customer */}
                            <td className="px-6 py-4 whitespace-nowJrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{order.shippingAddress?.fullName || 'N/A'}</div>
                                <div className="text-sm text-gray-500">{order.shippingAddress?.email || 'N/A'}</div>
                              </div>
                            </td>
                            {/* Product */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {order.orderItems[0]?.name || 'N/A'}
                                {order.orderItems.length > 1 && ` + ${order.orderItems.length - 1} more`}
                              </div>
                              <div className="text-sm text-gray-500">Items: {order.orderItems?.length || 0}</div>
                            </td>
                            {/* Amount */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-medium text-gray-900">₹{order.totalPrice?.toFixed(2) || '0.00'}</span>
                            </td>
                            {/* Status */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(syntheticStatus)}
                                <span className="text-sm text-gray-900 capitalize">{syntheticStatus}</span>
                              </div>
                            </td>
                            {/* Payment */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                {getPaymentStatusIcon(paymentStatus)}
                                <span className="text-sm text-gray-900 capitalize">{paymentStatus}</span>
                              </div>
                            </td>
                            {/* Date */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(order.createdAt)}
                            </td>
                            {/* Actions */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedOrder(order);
                                    setShowModal(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                >
                                  <FiEye className="w-4 h-4" />
                                </button>
                                <select
                                  value={syntheticStatus} // Show current synthetic status
                                  onChange={(e) => handleStatusChange(order._id, e.target.value)}
                                  className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-red-500"
                                >
                                  <option value="pending">Pending</option>
                                  <option value="processing">Processing</option>
                                  <option value="shipped">Shipped</option>
                                  <option value="delivered">Delivered</option>
                                  <option value="cancelled">Cancelled</option>
                                </select>
                                <button
                                  onClick={() => handleDeleteOrder(order._id)}
                                  className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                                >
                                  <FiTrash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Page <span className="font-medium">{currentPage}</span> of{' '}
                          <span className="font-medium">{totalPages}</span>
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                          <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                          >
                            Previous
                          </button>
                          <button
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
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

        {/* Order Details Modal */}
        {showModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Order Details</h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FiXCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>
              {/* Modal Body */}
              <div className="p-6 space-y-6">
                {/* Order Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Order ID</label>
                    <p className="text-sm text-gray-900">{selectedOrder.razorpayOrderId || selectedOrder._id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Order Date</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedOrder.createdAt)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Order Status</label>
                    <p className="text-sm text-gray-900 capitalize">{capitalize(getSyntheticStatus(selectedOrder))}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Payment Status</label>
                    <p className="text-sm text-gray-900 capitalize">{capitalize(getPaymentStatus(selectedOrder))}</p>
                  </div>
                </div>

                {/* Customer Details */}
                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-1">Customer Details</label>
                  <div className="bg-gray-50 p-3 rounded-md border border-gray-200 space-y-1">
                    <p className="text-sm text-gray-900">Name: {selectedOrder.shippingAddress?.fullName || 'N/A'}</p>
                    <p className="text-sm text-gray-900">Email: {selectedOrder.shippingAddress?.email || 'N/A'}</p>
                    <p className="text-sm text-gray-900">Phone: {selectedOrder.shippingAddress?.phone || 'N/A'}</p>
                  </div>
                </div>

                {/* Shipping Address */}
                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-1">Shipping Address</label>
                  <div className="bg-gray-50 p-3 rounded-md border border-gray-200 space-y-1">
                    <p className="text-sm text-gray-900">{selectedOrder.shippingAddress?.address || 'N/A'}</p>
                    <p className="text-sm text-gray-900">
                      {selectedOrder.shippingAddress?.city || ''}, {selectedOrder.shippingAddress?.state || ''} {selectedOrder.shippingAddress?.postalCode || ''}
                    </p>
                    <p className="text-sm text-gray-900">{selectedOrder.shippingAddress?.country || ''}</p>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-2">Order Items ({selectedOrder.orderItems?.length || 0})</label>
                  <div className="border border-gray-200 rounded-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-gray-600">Item</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-600">Qty</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-600">Price</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-600">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedOrder.orderItems?.map((item, index) => (
                          <tr key={item.product || index}>
                            <td className="px-4 py-2">{item.name || 'N/A'}</td>
                            <td className="px-4 py-2">{item.qty || 0}</td>
                            <td className="px-4 py-2">₹{item.price?.toFixed(2) || '0.00'}</td>
                            <td className="px-4 py-2">₹{(item.qty * item.price).toFixed(2) || '0.00'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Totals */}
                <div className="text-right space-y-1 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">Items Price: ₹{selectedOrder.itemsPrice?.toFixed(2) || '0.00'}</p>
                  <p className="text-sm text-gray-600">Tax: ₹{selectedOrder.taxPrice?.toFixed(2) || '0.00'}</p>
                  <p className="text-sm text-gray-600">Shipping: ₹{selectedOrder.shippingPrice?.toFixed(2) || '0.00'}</p>
                  <p className="text-lg font-semibold text-gray-900">Total Amount: ₹{selectedOrder.totalPrice?.toFixed(2) || '0.00'}</p>
                </div>

                {/* Close Button */}
                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;