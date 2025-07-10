import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { STRIPE_PUBLISHABLE_KEY } from '../../utils/constants';
import { paymentService } from '../../services/payments';
import toast from 'react-hot-toast';

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

const CheckoutForm = ({ order, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    if (order) {
      createPaymentIntent();
    }
  }, [order]);

  const createPaymentIntent = async () => {
    try {
      const response = await paymentService.createPaymentIntent(order.order_id);
      setClientSecret(response.client_secret);
    } catch (error) {
      toast.error('Failed to initialize payment');
      onError?.(error);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setLoading(true);

    const card = elements.getElement(CardElement);

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: card,
          billing_details: {
            name: order.customer_name,
            email: order.customer_email,
            phone: order.customer_phone,
          },
        },
      });

      if (error) {
        toast.error(error.message);
        onError?.(error);
      } else if (paymentIntent.status === 'succeeded') {
        toast.success('Payment successful!');
        onSuccess?.(paymentIntent);
      }
    } catch (error) {
      toast.error('Payment failed');
      onError?.(error);
    } finally {
      setLoading(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Details
        </label>
        <div className="p-3 border border-gray-300 rounded-md">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
      >
        {loading ? 'Processing...' : `Pay £${parseFloat(order.total).toFixed(2)}`}
      </button>
    </form>
  );
};

const StripeCheckout = ({ order, onSuccess, onError }) => {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm order={order} onSuccess={onSuccess} onError={onError} />
    </Elements>
  );
};

export default StripeCheckout;
