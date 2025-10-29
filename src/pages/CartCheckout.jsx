import React, { useState, useEffect } from 'react'; // Import useState, useEffect
import CartSection from '../components/CartCheckout/CartSection';
import BillingDetails from '../components/CartCheckout/BillingDetails';
import { useCart } from '../context/CartContext';
import { apiSend, apiGet } from '../utils/api'; // Import apiSend for POST requests
import { useNavigate } from 'react-router-dom'; // For redirecting after payment
import Spinner from '../components/Common/Spinner'; // For loading state

// Function to load Razorpay script dynamically
const loadRazorpayScript = (src) => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

function CartCheckout() {
  const { cartItems, totalItems, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const [loadingPayment, setLoadingPayment] = useState(false); // Loading state for payment process
  const [paymentError, setPaymentError] = useState(''); // State for payment errors

  // State for Billing Information
  const [billingInfo, setBillingInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India', // Default or make selectable
  });
  
  // State for form validation errors
  const [formErrors, setFormErrors] = useState({});

  // Validate Billing Details
  const validateBillingInfo = () => {
    const errors = {};
    if (!billingInfo.firstName.trim()) errors.firstName = 'First name is required';
    if (!billingInfo.lastName.trim()) errors.lastName = 'Last name is required';
    if (!billingInfo.email.trim() || !/\S+@\S+\.\S+/.test(billingInfo.email)) errors.email = 'Valid email is required';
    if (!billingInfo.phone.trim() || !/^\d{10,}$/.test(billingInfo.phone)) errors.phone = 'Valid phone number is required'; // Basic 10+ digit check
    if (!billingInfo.address.trim()) errors.address = 'Street address is required';
    if (!billingInfo.city.trim()) errors.city = 'City is required';
    if (!billingInfo.state.trim()) errors.state = 'State is required';
    if (!billingInfo.postalCode.trim()) errors.postalCode = 'Postal code is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0; // Return true if no errors
  };


  // --- Updated handleProceedToPayment ---
  const handleProceedToPayment = async () => {
    setPaymentError(''); // Clear previous errors
    
    // 1. Validate Billing Form
    if (!validateBillingInfo()) {
       console.log("Billing validation failed:", formErrors);
       // Scroll to the first error field if needed
       return; 
    }

    setLoadingPayment(true); // Start loading indicator

    try {
      // 2. Load Razorpay Script
      const res = await loadRazorpayScript('https://checkout.razorpay.com/v1/checkout.js');
      if (!res) {
        throw new Error('Razorpay SDK failed to load. Are you online?');
      }

      // 3. Create Razorpay Order via Backend
      // Amount should be in the smallest currency unit (e.g., paise for INR)
      const amountInPaise = Math.round(totalPrice * 100); 
      const orderPayload = { amount: amountInPaise, currency: 'INR' }; // Adjust currency if needed
      
      // *** DEBUG: Log order payload ***
      console.log("Creating Razorpay order with payload:", orderPayload);

      // Use the correct backend endpoint: /api/orders (POST)
      const orderResult = await apiSend('/api/orders', 'POST', orderPayload); 
      
      // *** DEBUG: Log order result ***
      console.log("Razorpay order creation result:", orderResult);

      if (!orderResult || !orderResult.order || !orderResult.order.id) {
        throw new Error('Failed to create Razorpay order.');
      }

      const { id: order_id } = orderResult.order;
      const razorpayKeyId = orderResult.keyId; // Get key from backend response

      if (!razorpayKeyId) {
         throw new Error('Razorpay Key ID not received from backend.');
      }

      // 4. Configure Razorpay Options
      const options = {
        key: razorpayKeyId,
        amount: amountInPaise.toString(), // Amount in paise as string
        currency: 'INR',
        name: 'CasaDeELE', // Your Store Name
        description: 'Course or Product Purchase',
        image: '/Horizontal_1.svg', // Link to your logo (optional)
        order_id: order_id, // From backend
        // --- Payment Handler Callback ---
        handler: async function (response) {
            console.log("Razorpay payment successful:", response);
            setLoadingPayment(true); // Show loading while verifying
            try {
                // 5. Verify Payment Signature via Backend
                const verificationPayload = {
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    // --- Include Billing Info and Cart Items ---
                    billingDetails: billingInfo, 
                    cartItems: cartItems, // Send cart items for order creation on backend
                    totalAmount: totalPrice // Send final amount paid
                };
                
                // Use the correct backend endpoint: /api/orders/verify (POST)
                const verifyResult = await apiSend('/api/orders/verify', 'POST', verificationPayload); 
                
                console.log("Backend verification result:", verifyResult);

                if (verifyResult?.success) {
                    // 6. Payment Verified - Clear Cart & Redirect
                    console.log("Payment Verified Successfully!");
                    clearCart(); // Clear cart from context/localStorage
                    // Redirect to a success page (create this page if it doesn't exist)
                    navigate('/order-success', { state: { orderId: verifyResult.orderId } }); // Pass order ID if needed
                } else {
                     throw new Error(verifyResult?.message || 'Payment verification failed on backend.');
                }
            } catch (verificationError) {
                 console.error("Payment verification failed:", verificationError);
                 setPaymentError(`Payment verification failed: ${verificationError.message}. Please contact support.`);
                 // Don't clear cart here
            } finally {
                 setLoadingPayment(false);
            }
        },
        // --- Prefill User Info ---
        prefill: {
          name: `${billingInfo.firstName} ${billingInfo.lastName}`,
          email: billingInfo.email,
          contact: billingInfo.phone,
        },
        notes: {
          address: `${billingInfo.address}, ${billingInfo.city}, ${billingInfo.state} - ${billingInfo.postalCode}`,
        },
        theme: {
          color: '#E11D48', // Match your theme color (e.g., red-600)
        },
        // --- Modal Close Handler ---
        modal: {
            ondismiss: function() {
                console.log('Razorpay checkout form closed.');
                setLoadingPayment(false); // Stop loading if user closes modal
            }
        }
      };

      // 5. Open Razorpay Checkout Modal
      const paymentObject = new window.Razorpay(options);
      paymentObject.on('payment.failed', function (response) {
          console.error("Razorpay payment failed:", response.error);
          setPaymentError(`Payment Failed: ${response.error.description || response.error.reason || 'Unknown error'}. Please try again.`);
          setLoadingPayment(false);
      });
      paymentObject.open();
      // setLoadingPayment(false); // Keep loading true while modal is open

    } catch (error) {
      console.error('Payment process error:', error);
      setPaymentError(`Error: ${error.message || 'Could not initiate payment.'}`);
      setLoadingPayment(false);
    }
  };
  // --- End handleProceedToPayment ---

  return (
    // <Elements stripe={stripePromise}> // Not using Stripe here
      <div className="bg-gray-100 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Checkout</h1>
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            
            <CartSection /> 

            <div className="w-full lg:w-2/5 xl:w-1/3 space-y-6">
              
              {/* Pass state and handler to BillingDetails */}
              <BillingDetails 
                  billingInfo={billingInfo} 
                  setBillingInfo={setBillingInfo}
                  errors={formErrors} // Pass validation errors
              />

              {/* Order Summary & Proceed Button */}
              {cartItems && cartItems.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                   <h3 className="text-lg font-semibold border-b pb-3 mb-4">Order Summary</h3>
                   <div className="space-y-2 text-sm text-gray-600">
                     <div className="flex justify-between">
                       <span>Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'items'})</span>
                       <span>₹{totalPrice.toFixed(2)}</span>
                     </div>
                     {/* Add Shipping/Discount lines if needed */}
                   </div>
                   <div className="flex justify-between font-semibold text-gray-800 mt-4 pt-4 border-t">
                     <span>Total</span>
                     <span>₹{totalPrice.toFixed(2)}</span> 
                   </div>

                   {/* Display Payment Error */}
                    {paymentError && (
                        <p className="mt-4 text-sm text-red-600 text-center">{paymentError}</p>
                    )}

                   <button 
                      onClick={handleProceedToPayment} 
                      className="mt-6 w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      disabled={!cartItems || cartItems.length === 0 || loadingPayment} // Disable if cart empty or payment loading
                   >
                     {loadingPayment ? <Spinner size="sm" /> : 'Proceed to Payment'} 
                   </button> 
                </div>
              )}
               {/* PaymentMethods component might not be needed if using Razorpay modal */}
               {/* <PaymentMethods /> */}
            </div>
          </div>
        </div>
      </div>
    // </Elements> 
  );
}

export default CartCheckout;