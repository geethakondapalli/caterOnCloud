import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
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

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin, // Add your success URL
        },
        redirect: 'if_required', // This prevents redirect for successful payments
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

  const paymentElementOptions = {
    defaultValues: {
      billingDetails: {
        name: order.customer_name,
        email: order.customer_email,
        phone: order.customer_phone,
        address: {
          country: 'GB',
        },
      },
    },
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <PaymentElement options={paymentElementOptions} />
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
