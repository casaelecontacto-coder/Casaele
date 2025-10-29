// src/components/CartCheckout/StripeCheckoutForm.jsx
import React from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const StripeCheckoutForm = ({ clientSecret, totalPrice }) => {
    const stripe = useStripe();
    const elements = useElements();

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!stripe || !elements) return;

        const result = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: elements.getElement(CardElement),
                billing_details: {
                    name: 'Jenny Rosen', 
                },
            },
        });

        if (result.error) {
            console.log(result.error.message);
        } else {
            if (result.paymentIntent.status === 'succeeded') {
                alert('Payment Successful!');
            }
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <CardElement />
            <button type="submit" disabled={!stripe} className="bg-[rgba(173,21,24,1)] text-white py-3 w-full mt-4 rounded">
                Pay ${totalPrice}
            </button>
        </form>
    );
};

export default StripeCheckoutForm;