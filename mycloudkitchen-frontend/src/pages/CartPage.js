import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const CartPage = () => {
  const { cartItems, updateQuantity, removeFromCart, getCartTotal, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleQuantityChange = (cartId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(cartId);
      toast.success('Item removed from cart');
    } else {
      updateQuantity(cartId, newQuantity);
    }
  };

  const handleProceedToCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/checkout' } });
    } else {
      navigate('/checkout');
    }
  };

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

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <ShoppingBag className="h-24 w-24 text-gray-300 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-8">
            Discover delicious meals from talented caterers and add them to your cart.
          </p>
          <Link
            to="/menu"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Browse Menus
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/menu"
            className="inline-flex items-center text-orange-600 hover:text-orange-700 mb-4 font-medium"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Continue Shopping
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <p className="text-gray-600 mt-2">
            Review your items before proceeding to checkout
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm">
              {/* Cart Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Cart Items ({cartItems.length})
                  </h2>
                  <button
                    onClick={() => {
                      clearCart();
                      toast.success('Cart cleared');
                    }}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Cart Items List */}
              <div className="divide-y divide-gray-200">
                {cartItems.map((item) => {
                  const itemPrice = calculateItemPrice(item);
                  const itemTotal = itemPrice * item.quantity;

                  return (
                    <div key={item.cartId} className="p-6">
                      <div className="flex items-start space-x-4">
                        {/* Item Image Placeholder */}
                        <div className="flex-shrink-0 w-20 h-20 bg-orange-100 rounded-lg flex items-center justify-center">
                          <ShoppingBag className="h-8 w-8 text-orange-600" />
                        </div>

                        {/* Item Details */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {item.name}
                          </h3>
                          
                          <p className="text-sm text-gray-600 mb-2">
                            Menu Date: {format(new Date(item.menu_date), 'EEEE, MMM dd, yyyy')}
                          </p>

                          {/* Menu Items Preview */}
                          {item.items && typeof item.items === 'object' && (
                            <div className="mb-3">
                              {Object.entries(item.items).slice(0, 2).map(([category, items]) => (
                                <div key={category} className="text-sm text-gray-600">
                                  <span className="font-medium capitalize">{category}:</span>
                                  {Array.isArray(items) ? (
                                    <span className="ml-1">
                                      {items.slice(0, 2).map(menuItem => 
                                        typeof menuItem === 'string' ? menuItem : menuItem.name
                                      ).join(', ')}
                                      {items.length > 2 && '...'}
                                    </span>
                                  ) : (
                                    <span className="ml-1">{items}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Price and Quantity */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span className="text-lg font-bold text-gray-900">
                                £{itemPrice.toFixed(2)}
                              </span>
                              <span className="text-sm text-gray-500">each</span>
                            </div>

                            <div className="flex items-center space-x-3">
                              {/* Quantity Controls */}
                              <div className="flex items-center border border-gray-300 rounded-md">
                                <button
                                  onClick={() => handleQuantityChange(item.cartId, item.quantity - 1)}
                                  className="p-2 hover:bg-gray-100 rounded-l-md"
                                  disabled={item.quantity <= 1}
                                >
                                  <Minus className="h-4 w-4" />
                                </button>
                                <span className="px-4 py-2 font-medium min-w-[3rem] text-center">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => handleQuantityChange(item.cartId, item.quantity + 1)}
                                  className="p-2 hover:bg-gray-100 rounded-r-md"
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              </div>

                              {/* Remove Button */}
                              <button
                                onClick={() => {
                                  removeFromCart(item.cartId);
                                  toast.success('Item removed from cart');
                                }}
                                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md"
                                title="Remove item"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          {/* Item Total */}
                          <div className="mt-2 text-right">
                            <span className="text-lg font-bold text-orange-600">
                              £{itemTotal.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Items ({cartItems.length})</span>
                  <span className="font-medium">£{getCartTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery</span>
                  <span className="font-medium text-green-600">Free</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Service Fee</span>
                  <span className="font-medium">£0.00</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-xl font-bold text-gray-900">
                      £{getCartTotal().toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleProceedToCheckout}
                className="w-full bg-orange-600 text-white py-3 px-4 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 font-medium transition-colors flex items-center justify-center"
              >
                {isAuthenticated ? (
                  <>
                    Proceed to Checkout
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                ) : (
                  'Login to Checkout'
                )}
              </button>

              {/* Promo Code Section */}
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Promo Code</h3>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Enter code"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  />
                  <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300">
                    Apply
                  </button>
                </div>
              </div>

              {/* Security Info */}
              <div className="mt-6 text-center">
                <div className="text-xs text-gray-500 space-y-1">
                  <p>🔒 Secure checkout</p>
                  <p>✅ Free cancellation</p>
                  <p>📞 24/7 customer support</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;