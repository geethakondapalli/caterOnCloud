import React, { useState } from 'react';
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { paymentService } from '../services/payments'; // Adjust the import path as necessary

const StripeCardPayment = ({ amount, orderData, onPaymentSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      // Call your backend to create the PaymentIntent
      const paymentIntent = await paymentService.createPaymentIntent(orderData.id); // should return client_secret

      const cardElement = elements.getElement(CardElement);
      const result = await stripe.confirmCardPayment(paymentIntent.client_secret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: "Biller Name",
            email: "biller@example.com",
            phone: "1234567890",
          },
        },
      });

      if (result.error) {
        setError(result.error.message);
      } else if (result.paymentIntent.status === 'succeeded') {
        onPaymentSuccess(result.paymentIntent);
      }
    } catch (err) {
      console.error(err);
      setError('Something went wrong during payment.');
    }

    setLoading(false);
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Enter Card Details</h3>
      <div className="border p-2 rounded mb-4">
        <CardElement />
      </div>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <div className="flex justify-between">
        <button onClick={onCancel} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
        <button onClick={handlePayment} disabled={!stripe || loading} className="px-4 py-2 bg-green-600 text-white rounded">
          {loading ? 'Processing...' : `Pay £${(amount / 100).toFixed(2)}`}
        </button>
      </div>
    </div>
  );
};

export default StripeCardPayment;