import React, { useState } from 'react';
import { Calendar, MapPin, Phone, Mail, Package, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { ORDER_STATUS } from '../../utils/constants';

const OrderCard = ({ order, onStatusUpdate, userRole }) => {
  const [isItemsExpanded, setIsItemsExpanded] = useState(false);

  const getStatusColor = (status) => {
    const colors = {
      [ORDER_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800',
      [ORDER_STATUS.CONFIRMED]: 'bg-blue-100 text-blue-800',
      [ORDER_STATUS.PREPARING]: 'bg-purple-100 text-purple-800',
      [ORDER_STATUS.READY]: 'bg-green-100 text-green-800',
      [ORDER_STATUS.DELIVERED]: 'bg-gray-100 text-gray-800',
      [ORDER_STATUS.CANCELLED]: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const canUpdateStatus = userRole === 'caterer' && 
    ![ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED].includes(order.status);

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      [ORDER_STATUS.PENDING]: ORDER_STATUS.CONFIRMED,
      [ORDER_STATUS.CONFIRMED]: ORDER_STATUS.PREPARING,
      [ORDER_STATUS.PREPARING]: ORDER_STATUS.READY,
      [ORDER_STATUS.READY]: ORDER_STATUS.DELIVERED
    };
    return statusFlow[currentStatus];
  };

  const handleStatusUpdate = () => {
    const nextStatus = getNextStatus(order.status);
    if (nextStatus && onStatusUpdate) {
      onStatusUpdate(order.order_id, nextStatus);
    }
  };

  const formatAddress = (address) => {
    if (typeof address === 'string') return address;
    if (typeof address === 'object') {
      return [address.street, address.city, address.postcode]
        .filter(Boolean)
        .join(', ');
    }
    return 'Address not available';
  };

  const parseOrderItems = () => {
    if (!order.items) return [];
    
    // If items is a string that looks like JSON with catalog_item_id keys
    if (typeof order.items === 'string') {
      try {
        const parsed = JSON.parse(order.items);
        return Object.entries(parsed).map(([key, item]) => ({
          id: key,
          name: item.item_name || `Item ${key}`,
          quantity: item.quantity || item.quantit || 1, // Handle typo 'quantit'
          price: item.price || '0.00',
          description: item.description || '',
          category: item.category || 'Uncategorized'
        }));
      } catch (e) {
        console.error('Error parsing order items:', e);
        return [];
      }
    }
    
    // If items is already an object
    if (typeof order.items === 'object') {
      return Object.entries(order.items).map(([key, item]) => {
        // Handle case where item is a detailed object
        if (typeof item === 'object' && item.item_name) {
          return {
            id: key,
            name: item.item_name,
            quantity: item.quantity || item.quantit || 1,
            price: item.price || '0.00',
            description: item.description || '',
            category: item.category || 'Uncategorized'
          };
        }
        // Handle case where item is just a string (legacy format)
        return {
          id: key,
          name: typeof item === 'string' ? item : `Item ${key}`,
          quantity: 1,
          price: '0.00',
          description: '',
          category: key
        };
      });
    }
    
    return [];
  };

  const orderItems = parseOrderItems();
  const totalItems = orderItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Order #{order.order_id}
          </h3>
        </div>
        <div className="text-right">
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </span>
         
          <p className="text-lg font-bold text-gray-900 mt-1">
            £{parseFloat(order.total).toFixed(2)}
          </p>
        
        </div>
      </div>

      {/* Customer Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Customer Name</h4>
          <div className="space-y-1 text-sm text-gray-600">
            <p className="font-medium">{order.customer_name}</p>
            {order.customer_phone && (
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-1" />
                {order.customer_phone}
              </div>
            )}
            {order.customer_email && (
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-1" />
                {order.customer_email}
              </div>
            )}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Delivery</h4>
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex items-start">
              <MapPin className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
              <span>{formatAddress(order.customer_address)}</span>
            </div>
            {order.delivery_date && (
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {format(new Date(order.delivery_date), 'MMM dd, yyyy HH:mm')}
              </div>
            )}
          </div>
          <div className="space-y-1 text-sm text-gray-600">
          <div className="flex items-start">
          <span> Payment Status</span>
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.payment_status)}`}>
            {order.status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
          </span>
          </div>
          </div>
        </div>
      </div>

      {/* Order Items - Expandable */}
      {orderItems.length > 0 && (
        <div className="mb-4">
          <button
            onClick={() => setIsItemsExpanded(!isItemsExpanded)}
            className="flex items-center justify-between w-full text-left"
          >
            <h4 className="text-sm font-medium text-gray-700">
              Order Items ({totalItems} {totalItems === 1 ? 'item' : 'items'})
            </h4>
            {isItemsExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </button>
          
          {isItemsExpanded && (
            <div className="mt-3 bg-gray-50 rounded-md p-3">
              <div className="space-y-3">
                {orderItems.map((item, index) => (
                  <div key={item.id || index} className="bg-white p-3 rounded border">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h5 className="font-medium text-gray-900">{item.name}</h5>
                          <span className="text-sm font-medium text-orange-600">
                            Qty: {item.quantity}
                          </span>
                        </div>
                        
                        {item.description && (
                          <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {item.category}
                          </span>
                          <span className="font-bold text-green-600">
                            £{parseFloat(item.price).toFixed(2)} each
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Items Summary */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Items:</span>
                  <span className="font-medium">{totalItems}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">
                    £{orderItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Special Instructions */}
      {order.special_instructions && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Special Instructions</h4>
          <p className="text-sm text-gray-600 bg-yellow-50 p-2 rounded-md">
            {order.special_instructions}
          </p>
        </div>
      )}

      {/* Order Dates */}
      <div className="mb-4 text-xs text-gray-500">
        <p>Ordered: {format(new Date(order.order_date), 'MMM dd, yyyy HH:mm')}</p>
        {order.menu_date && (
          <p>Menu Date: {format(new Date(order.menu_date), 'MMM dd, yyyy')}</p>
        )}
      </div>

      {/* Actions */}
      {canUpdateStatus && (
        <div className="flex justify-end space-x-2">
          {order.status === ORDER_STATUS.PENDING && (
            <button
              onClick={() => onStatusUpdate(order.order_id, ORDER_STATUS.CANCELLED)}
              className="px-3 py-1 text-sm border border-red-300 text-red-700 rounded-md hover:bg-red-50"
            >
              Cancel
            </button>
          )}
          
          {getNextStatus(order.status) && (
            <button
              onClick={handleStatusUpdate}
              className="px-3 py-1 text-sm bg-orange-600 text-white rounded-md hover:bg-orange-700"
            >
              Mark as {getNextStatus(order.status).charAt(0).toUpperCase() + getNextStatus(order.status).slice(1)}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderCard;