import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ShoppingCart, Plus, Minus, Calendar, MapPin, ChevronDown, ChevronUp, Loader2, CreditCard ,Mail, MessageSquare,Download} from 'lucide-react';
import { menuService } from '../services/menu'; // Adjust the import path as needed
import { orderService } from '../services/orders';
import { paymentService } from '../services/payments';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import StripeCardPayment  from './StripeCardPayment'; // Adjust the import path as needed
import { InvoiceService } from '../components/orders/Invoice'; 
import ErrorPage  from '../components/common/ErrorPage'; 
import InvoiceModal  from '../components/orders/InvoiceModal'; // Adjust the import path as needed

const OrderForm = () => {
  // Get menuId from URL parameters (e.g., /order/M20250617)
  const { menuId } = useParams();

  
   // Initialize invoice service
   const invoiceService = new InvoiceService();

  // State for menu data and loading
  const [menuData, setMenuData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [currentOrderDetails, setCurrentOrderDetails] = useState(null); // Track current order
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  
  const [cart, setCart] = useState({});
  const [expandedItems, setExpandedItems] = useState({});
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
    orderType: 'pickup' // Set default value
  });
  const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

  const isOldMenu = () => {
    if (!menuData?.menu_date) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of today
    
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    const menuDate = new Date(menuData.menu_date);
    menuDate.setHours(0, 0, 0, 0); // Set to start of menu date
    
    return menuDate < today; // Menu date is before today
  };

  // Load menu data on component mount
  useEffect(() => {
     // If menu is old, show error page

    if (menuId) {
      loadMenu();
    }
  } , [menuId]);

  const loadMenu = async () => {
    try {
    
      if (isOldMenu()) {
        setLoading(false)
        return (
          <ErrorPage 
            message="This menu is from a previous date and is no longer available for viewing or modification."
        
          />
        );
      }

      setLoading(true);
      setError(null);
      
      console.log('Loading menu with ID:', menuId);
      const data = await menuService.getScheduledMenu(menuId);
      console.log('Loaded menu data:', data);
      setMenuData(data);
    } catch (error) {
      console.error('Failed to load menu:', error);
      setError('Failed to load menu. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Loading Menu...</h2>
            <p className="text-gray-500">Please wait while we fetch the menu details</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Menu</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="space-x-4">
            <button 
              onClick={loadMenu} 
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {loading ? 'Retrying...' : 'Try Again'}
            </button>
            <button 
              onClick={() => window.location.href = '/home'}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show message if no menu data
  if (!menuData && !loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">Menu Not Available</h2>
          <p className="text-yellow-600">The requested menu could not be found.</p>
          <button 
            onClick={loadMenu} 
            className="mt-4 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Don't render the main content until we have menu data
  if (!menuData) {
    return null;
  }

  const toggleItemExpansion = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const addToCart = (item) => {
    setCart(prev => ({
      ...prev,
      [item.catalog_item_id]: {
        ...item,
        quantity: (prev[item.catalog_item_id]?.quantity || 0) + 1
      }
    }));
  };

  const removeFromCart = (itemId) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[itemId]?.quantity > 1) {
        newCart[itemId].quantity -= 1;
      } else {
        delete newCart[itemId];
      }
      return newCart;
    });
  };

  const getTotalPrice = () => {
    return Object.values(cart).reduce((total, item) => {
      return total + (parseFloat(item.price) * item.quantity);
    }, 0).toFixed(2);
  };

  const getTotalItems = () => {
    return Object.values(cart).reduce((total, item) => total + item.quantity, 0);
  };

  // Helper function to reset form
  const resetForm = () => {
    setCart({});
    setCustomerInfo({
      name: '',
      phone: '',
      email: '',
      address: '',
      notes: '',
      orderType: 'pickup'
    });
    setCurrentOrderDetails(null);
    setPaymentData(null);
    setShowInvoiceModal(false);
    setInvoiceData(null);

  };


   // Generate and send invoice
   const handleInvoiceGeneration = async (invoiceData, delivery) => {
    try {

      const results = [];
      if (delivery === 'email' || delivery === 'both') {
        if (customerInfo.email) {
          try {
            await invoiceService.sendInvoiceByEmail(invoiceData, customerInfo.email);
            results.push('✅ Invoice sent via email');
          } catch (error) {
            results.push('❌ Failed to send email');
          }
        }
      }
      
      if (delivery === 'sms' || delivery === 'both') {
        if (customerInfo.phone) {
          try {
            await invoiceService.sendInvoiceBySMS(invoiceData, customerInfo.phone);
            results.push('✅ Invoice sent via SMS');
          } catch (error) {
            results.push('❌ Failed to send SMS');
          }
        }
      }
      
      if (results.length > 0) {
        alert(results.join('\n'));
      }
      
    } catch (error) {
      console.error('Error generating invoice:', error);
      alert('Error generating invoice. Please try again.');
    }
  };

  const handlePaymentCancel = () => {
    setShowPaymentModal(false);
    // Keep the order details but don't reset form
    // User can try payment again or choose offline payment
  };

  const handleSubmitOrder = async (paymentMethod) => {
    setIsProcessing(true);
    
    try {
      // Validate required fields
      if (!customerInfo.name || !customerInfo.phone || !customerInfo.orderType) {
        alert('Please fill in all required fields (Name, Phone, Order Type)');
        setIsProcessing(false);
        return;
      }
      
      // Address validation only for delivery orders
      if (customerInfo.orderType === 'delivery') {
        if (!customerInfo.address) {
          alert('Please provide delivery address for delivery orders');
          setIsProcessing(false);
          return;
        }
      }

      // Check if cart is empty
      if (Object.keys(cart).length === 0) {
        alert('Please add items to your cart before ordering');
        setIsProcessing(false);
        return;
      }

      const orderData = {
        menu_id: menuData.menu_id,
        caterer_id: 1001, // Replace with actual caterer ID
        customer_name: customerInfo.name,
        customer_phone: customerInfo.phone,
        customer_address: customerInfo.orderType === 'pickup' ? 'pickup' : customerInfo.address,   
        customer_email: customerInfo.email ? customerInfo.email : '',
        items: cart,
        total: getTotalPrice(),
        order_date: new Date().toISOString(),
        menu_date: menuData?.menu_date,
        delivery_date: menuData?.menu_date, // Assuming delivery date is same as menu date
        special_instructions: customerInfo.notes || '',
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'online' ? 'pending' : 'offline',
      };

      // Create the order first
      const order_details = await orderService.createOrder(orderData);
      console.log('Order submitted:', order_details);
      
      // Store current order details
      setCurrentOrderDetails(order_details);

      const handlePaymentSuccessWithOrder = async (paymentIntent) => {
        console.log('Payment successful:', paymentIntent);
        
        try {
          // Update payment status in database to "Done"
          await paymentService.confirmPayment(paymentIntent.id);
          console.log('Payment status updated to Done')
         
          
          // Show success message with a slight delay to ensure modal is closed
          setTimeout(() => {
            alert(`Payment successful! Order ${order_details.order_id} has been paid.`);
          }, 100);
          
          console.log('showInvoiceModal:', showInvoiceModal);
          console.log('currentOrderDetails:', currentOrderDetails);
          console.log('customerInfo:', customerInfo)
          const invoiceData=invoiceService.generateInvoiceData(order_details, customerInfo, menuData);
          setInvoiceData(invoiceData);
          console.log('Generated invoice data:', invoiceData);
          setShowPaymentModal(false);
          setShowInvoiceModal(true)
      

          // Reset form after successful payment
          //resetForm();
          
        } catch (error) {
          console.error('Error confirming payment:', error);
          // Still close modal and reset form, but show different message
          setShowPaymentModal(false);
          setTimeout(() => {
            alert(`Payment processed, but there was an issue updating the status. Please contact support with Order ID: ${order_details.order_id}`);
          }, 100);
          resetForm();
        }
      };

      if (paymentMethod === 'online') {
        // Handle online payment - show payment modal
        setPaymentData({
          amount: order_details.total * 100, // Amount in pence for Stripe
          orderData: {
            id: order_details.order_id,
            total: order_details.total,
          },
          onPaymentSuccess: handlePaymentSuccessWithOrder,
          onCancel: handlePaymentCancel,
        });
    
        setShowPaymentModal(true);
     
        
      } else {
        // Handle offline payment
        alert(`Order ${order_details.order_id} placed successfully! Total: £${getTotalPrice()}. Payment will be collected offline.`);
        const invoiceData=invoiceService.generateInvoiceData(order_details, customerInfo, menuData);
        setInvoiceData(invoiceData);
        setShowInvoiceModal(true)
     
        // Reset form immediately for offline orders
        //resetForm();
      }
      
    } catch (error) {
      console.error('Error submitting order:', error);
      alert('Error placing order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{menuData?.name || 'Menu'}</h1>
            <div className="flex items-center mt-2 text-gray-600">
              <Calendar className="w-4 h-4 mr-2" />
              <span>{menuData?.menu_date ? formatDate(menuData.menu_date) : 'Date not available'}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">Menu ID: {menuData?.menu_id || 'N/A'}</p>
          </div>
          <div className="text-right">
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              {menuData?.active ? 'Available' : 'Unavailable - Please contact caterer'}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Menu Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Menu Items</h2>
            <div className="space-y-4">
              {menuData?.items?.map((item) => (
                <div key={item.catalog_item_id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                  {/* Item Header - Always Visible */}
                  <div className="p-4 bg-white">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <h3 className="text-lg font-semibold text-gray-800">{item.item_name}</h3>
                          {item.is_combo && (
                            <span className="ml-2 bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-medium">
                              COMBO
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-2xl font-bold text-green-600">£{item.price}</span>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => toggleItemExpansion(item.catalog_item_id)}
                              className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                            >
                              Details
                              {expandedItems[item.catalog_item_id] ? (
                                <ChevronUp className="w-4 h-4 ml-1" />
                              ) : (
                                <ChevronDown className="w-4 h-4 ml-1" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Cart Controls */}
                      <div className="flex items-center space-x-2 ml-4">
                        {cart[item.catalog_item_id] && (
                          <>
                            <button
                              onClick={() => removeFromCart(item.catalog_item_id)}
                              className="bg-red-500 hover:bg-red-600 text-white p-1 rounded-full transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="bg-gray-100 px-3 py-1 rounded font-medium min-w-[2rem] text-center">
                              {cart[item.catalog_item_id].quantity}
                            </span>
                          </>
                        )}
                        <button
                          onClick={() => addToCart(item)}
                          className="bg-blue-500 hover:bg-blue-600 text-white p-1 rounded-full transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Details Section */}
                  {expandedItems[item.catalog_item_id] && (
                    <div className="border-t border-gray-200 bg-gray-50 p-4 animate-in slide-in-from-top-2 duration-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-800 mb-2">Description</h4>
                          <p className="text-gray-600">{item.description}</p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-800 mb-2">Item Details</h4>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex justify-between">
                              <span>Item ID:</span>
                              <span className="font-mono">{item.catalog_item_id}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Price:</span>
                              <span className="font-semibold text-green-600">£{item.price}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Type:</span>
                              <span>{item.is_combo ? 'Combo Meal' : 'Single Item'}</span>
                            </div>
                            {item.category && (
                              <div className="flex justify-between">
                                <span>Category:</span>
                                <span>{item.category}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Combo Items Section */}
                      {item.is_combo && item.combo_items && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <h4 className="font-medium text-gray-800 mb-2">Combo Includes</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {item.combo_items.map((comboItem, index) => (
                              <div key={index} className="bg-white p-2 rounded border border-gray-200">
                                <span className="text-sm font-medium text-gray-700">{comboItem.item_name}</span>
                                {comboItem.quantity && (
                                  <p className="text-xs text-gray-500 mt-1">{comboItem.quantity}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary & Customer Info */}
        <div className="space-y-6">
          {/* Cart Summary */}
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
            <div className="flex items-center mb-4">
              <ShoppingCart className="w-5 h-5 mr-2" />
              <h3 className="text-lg font-semibold">Order Summary</h3>
            </div>
            
            {Object.keys(cart).length === 0 ? (
              <p className="text-gray-500 text-center py-4">Your cart is empty</p>
            ) : (
              <>
                <div className="space-y-3 mb-4">
                  {Object.values(cart).map((item) => (
                    <div key={item.catalog_item_id} className="flex justify-between items-center text-sm">
                      <div>
                        <span className="font-medium">{item.item_name}</span>
                        <span className="text-gray-500 ml-2">x{item.quantity}</span>
                      </div>
                      <span className="font-medium">£{(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center font-bold text-lg">
                    <span>Total ({getTotalItems()} items)</span>
                    <span className="text-green-600">£{getTotalPrice()}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Customer Information Form */}
          {Object.keys(cart).length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                    placeholder="Enter your name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                    placeholder="Enter phone number"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                    placeholder="Enter email address"
                  />
                </div>
                
                <div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Order Collection Type *
                    </label>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <label className="flex items-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors">
                        <input
                          type="radio"
                          name="orderType"
                          value="pickup"
                          checked={customerInfo.orderType === 'pickup'}
                          onChange={(e) => setCustomerInfo(prev => ({ 
                            ...prev, 
                            orderType: e.target.value,
                            address: '' // Clear address when switching to pickup
                          }))}
                          className="mr-3 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <span className="font-medium text-gray-900">Pickup</span>
                        </div>
                      </label>

                      <label className="flex items-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors">
                        <input
                          type="radio"
                          name="orderType"
                          value="delivery"
                          checked={customerInfo.orderType === 'delivery'}
                          onChange={(e) => setCustomerInfo(prev => ({ 
                            ...prev, 
                            orderType: e.target.value 
                          }))}
                          className="mr-3 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <span className="font-medium text-gray-900">Delivery</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Conditional Address Field */}
                  {customerInfo.orderType === 'delivery' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Delivery Address *
                      </label>
                      <textarea
                        required
                        value={customerInfo.address}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                        rows="3"
                        placeholder="Enter your delivery address including postcode"
                      />
                    </div>
                  )}

                  {/* Pickup Instructions (optional) */}
                  {customerInfo.orderType === 'pickup' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">Pickup Information</h4>
                      <p className="text-sm text-blue-800 mb-2">
                        Your order will be ready for collection at:
                      </p>
                      <div className="text-sm text-blue-700">
                        <p className="font-medium">Restaurant Address:</p>
                        <p>123 Main Street</p>
                        <p>London, SW1A 1AA</p>
                        <p className="mt-2">
                          <span className="font-medium">Phone:</span> 020 1234 5678
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Special Notes
                  </label>
                  <textarea
                    value={customerInfo.notes}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                    rows="2"
                    placeholder="Any special instructions..."
                  />
                </div>

                <div className="flex gap-2 w-full">
                  <button
                    onClick={() => handleSubmitOrder('online')}
                    disabled={isProcessing}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                  >
                    <CreditCard className="w-5 h-5 mr-2" />
                    {isProcessing ? 'Processing...' : `Pay Online - £${getTotalPrice()}`}
                  </button>
                
                  <button
                    onClick={() => handleSubmitOrder('offline')}
                    disabled={isProcessing}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    {isProcessing ? 'Processing...' : `Pay Offline - £${getTotalPrice()}`}
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Invoice Modal */}
         

          {showInvoiceModal && (
          <InvoiceModal
            isOpen={showInvoiceModal}
            onClose={() => setShowInvoiceModal(false)}
            invoiceData={invoiceData}
            currentOrderDetails={currentOrderDetails}
            customerInfo={customerInfo}
            invoiceService={invoiceService}
            handleInvoiceGeneration={handleInvoiceGeneration}
            resetForm={resetForm}
          />
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && paymentData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <Elements stripe={stripePromise}>
              <StripeCardPayment
                {...paymentData}
              />
            </Elements>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderForm;