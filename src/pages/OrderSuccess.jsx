import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiCheckCircle } from 'react-icons/fi';

function OrderSuccess() {
  const location = useLocation();
  const orderId = location.state?.orderId; // Get order ID passed during navigation

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 py-12 bg-gray-50">
      <FiCheckCircle className="w-16 h-16 text-green-500 mb-6" />
      <h1 className="text-3xl font-bold text-gray-800 mb-3">Payment Successful!</h1>
      <p className="text-gray-600 mb-4">Thank you for your purchase.</p>
      {orderId && (
         <p className="text-sm text-gray-500 mb-6">Your Order ID is: <strong>{orderId}</strong></p>
      )}
      <p className="text-gray-600 mb-8">You will receive an email confirmation shortly.</p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Link 
           to="/courses" // Link to courses page
           className="px-6 py-3 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium"
         >
           Continue Shopping Courses
        </Link>
         <Link 
           to="/" // Link to home page
           className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
         >
           Go to Homepage
        </Link>
      </div>
    </div>
  );
}

export default OrderSuccess;