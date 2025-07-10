import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services/orders';
import StripeCheckout from '../components/payments/StripeCheckout';
import { 
  MapPin, 
  Calendar, 
  CreditCard, 
  User, 
  Phone, 
  Mail,
  Check,
  ArrowLeft,
  Lock
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const CheckoutPage = () => {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      customer_name: user?.name || '',
      customer_email: user?.email || '',
      customer_phone: user?.phone || '',
      delivery_date: '',
      special_instructions: ''
    }
  });

  // Redirect to cart if empty
  useEffect(() => {
    if (cartItems.length === 0 && !order) {
      navigate('/cart');
    }
  }, [cartItems, order, navigate]);

  const calculateItemPrice = (item) => {
    let total = 0;
    if (item.items && typeof item.items === 'object') {
      Object.values(item.items).forEach(categoryItems => {
        if (Array.isArray(categoryItems)) {
          categoryItems.forEach(menuItem => {
            if (menuItem.price) {
              total += parseFloat(menuItem.price);
            }
          });
        }
      });
    }
    return total;
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // For this example, we'll create one order per cart item
      // In a real app, you might want to group by caterer
      const firstItem = cartItems[0];
      
      const orderData = {
        menu_id: firstItem.menu_id,
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        customer_email: data.customer_email,
        customer_address: {
          street: data.street,
          city: data.city,
          postcode: data.postcode,
          instructions: data.address_instructions || ''
        },
        menu_date: firstItem.menu_date,
        delivery_date: data.delivery_date ? new Date(data.delivery_date).toISOString() : null,
        items: cartItems.reduce((acc, item) => {
          acc[item.name] = {
            quantity: item.quantity,
            price: calculateItemPrice(item),
            customization: item.customization || {}
          };
          return acc;
        }, {}),
        total: getCartTotal(),
        special_instructions: data.special_instructions
      };

      const createdOrder = await orderService.createOrder(orderData);
      setOrder(createdOrder);
      setCurrentStep(2);
      toast.success('Order details confirmed!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (paymentIntent) => {
    clearCart();
    toast.success('Payment successful! Your order has been confirmed.');
    navigate('/orders');
  };

  const handlePaymentError = (error) => {
    toast.error('Payment failed. Please try again.');
    console.error('Payment error:', error);
  };

  const steps = [
    { number: 1, title: 'Delivery Details', icon: User },
    { number: 2, title: 'Payment', icon: CreditCard }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/cart')}
            className="inline-flex items-center text-orange-600 hover:text-orange-700 mb-4 font-medium"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cart
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Checkout</h1>
          
          {/* Progress Steps */}
          <div className="flex items-center space-x-4">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <div className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    currentStep >= step.number 
                      ? 'bg-orange-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {currentStep > step.number ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <step.icon className="h-5 w-5" />
                    )}
                  </div>
                  <span className={`ml-3 font-medium ${
                    currentStep >= step.number ? 'text-orange-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-px ${
                    currentStep > step.number ? 'bg-orange-600' : 'bg-gray-300'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {currentStep === 1 ? (
              /* Step 1: Delivery Details */
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Customer Information */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <User className="h-5 w-5 mr-3 text-orange-600" />
                    Contact Information
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        {...register('customer_name', { required: 'Name is required' })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="John Doe"
                      />
                      {errors.customer_name && (
                        <p className="mt-1 text-sm text-red-600">{errors.customer_name.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        {...register('customer_email', { 
                          required: 'Email is required',
                          pattern: {
                            value: /^\S+@\S+$/i,
                            message: 'Invalid email address'
                          }
                        })}
                        type="email"
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="john@example.com"
                      />
                      {errors.customer_email && (
                        <p className="mt-1 text-sm text-red-600">{errors.customer_email.message}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        {...register('customer_phone')}
                        type="tel"
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="+44 123 456 7890"
                      />
                    </div>
                  </div>
                </div>

                {/* Delivery Address */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <MapPin className="h-5 w-5 mr-3 text-orange-600" />
                    Delivery Address
                  </h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Street Address *
                      </label>
                      <input
                        {...register('street', { required: 'Street address is required' })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="123 Main Street, Apartment 4B"
                      />
                      {errors.street && (
                        <p className="mt-1 text-sm text-red-600">{errors.street.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          City *
                        </label>
                        <input
                          {...register('city', { required: 'City is required' })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          placeholder="London"
                        />
                        {errors.city && (
                          <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Postcode *
                        </label>
                        <input
                          {...register('postcode', { required: 'Postcode is required' })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          placeholder="SW1A 1AA"
                        />
                        {errors.postcode && (
                          <p className="mt-1 text-sm text-red-600">{errors.postcode.message}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Delivery Instructions
                      </label>
                      <textarea
                        {...register('address_instructions')}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Ring the doorbell, leave at door, etc."
                      />
                    </div>
                  </div>
                </div>

                {/* Delivery Options */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <Calendar className="h-5 w-5 mr-3 text-orange-600" />
                    Delivery Options
                  </h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Preferred Delivery Time (Optional)
                      </label>
                      <input
                        {...register('delivery_date')}
                        type="datetime-local"
                        min={new Date().toISOString().slice(0, 16)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        If not specified, we'll deliver during standard hours
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Special Instructions
                      </label>
                      <textarea
                        {...register('special_instructions')}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Dietary requirements, allergies, cooking preferences..."
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-orange-600 text-white py-4 px-6 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 font-semibold text-lg disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Processing...' : 'Continue to Payment'}
                </button>
              </form>
            ) : (
              /* Step 2: Payment */
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <Lock className="h-5 w-5 mr-3 text-orange-600" />
                  Secure Payment
                </h2>
                
                {order && (
                  <StripeCheckout
                    order={order}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                  />
                )}
                
                <button
                  onClick={() => setCurrentStep(1)}
                  className="w-full mt-4 border border-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-50 font-medium"
                >
                  Back to Delivery Details
                </button>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
              
              {/* Items */}
              <div className="space-y-3 mb-6">
                {cartItems.map((item) => {
                  const itemPrice = calculateItemPrice(item);
                  const itemTotal = itemPrice * item.quantity;

                  return (
                    <div key={item.cartId} className="flex justify-between items-start">
                      <div className="flex-1 mr-3">
                        <h3 className="font-medium text-gray-900 text-sm">{item.name}</h3>
                        <p className="text-xs text-gray-600">
                          Qty: {item.quantity} × £{itemPrice.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(item.menu_date), 'MMM dd')}
                        </p>
                      </div>
                      <span className="font-medium text-sm">£{itemTotal.toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>

              {/* Totals */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>£{getCartTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Delivery</span>
                  <span className="text-green-600">Free</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Service Fee</span>
                  <span>£0.00</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>£{getCartTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Security Badges */}
              <div className="mt-6 pt-4 border-t">
                <div className="text-center text-xs text-gray-500 space-y-1">
                  <p>🔒 SSL Encrypted</p>
                  <p>💳 Secure Payment by Stripe</p>
                  <p>🛡️ Your data is protected</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;