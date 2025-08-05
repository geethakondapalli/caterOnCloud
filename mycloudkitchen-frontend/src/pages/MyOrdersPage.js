import React, { useState, useEffect } from 'react';
import OrderCard from '../components/orders/OrderCard'; // Adjust import path as needed
import { useAuth } from '../context/AuthContext'; // Adjust import path as needed
import { orderService } from '../services/orders'; // Adjust import path as needed
import { ORDER_STATUS } from '../utils/constants'; // Adjust import path as needed
import { Search, Filter, Calendar, Package, AlertCircle, Grid3X3, List, Eye, Phone, Mail, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { useSearchParams } from 'react-router-dom';

const MyOrdersPage = () => {
    const { user, userRole } = useAuth();
    const [searchParams] = useSearchParams();
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
    //const [selectedMenuDate, setSelectedMenuDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedMenuDate, setSelectedMenuDate] = useState(() => {
      const urlMenuDate = searchParams.get('menudate');
      return urlMenuDate || new Date().toISOString().split('T')[0];
  });

  useEffect(() => {
    const urlMenuDate = searchParams.get('menudate');
    
    if (urlMenuDate) {
        // If URL has menudate, update state and fetch
        if (urlMenuDate !== selectedMenuDate) {
            setSelectedMenuDate(urlMenuDate);
            //fetchOrders(); // Fetch orders for the new date
            // fetchOrders will be called by the next useEffect when selectedMenuDate changes
        } else {
            // Same date, just fetch
            //fetchOrders();
        }
    } else {
        // No URL param, fetch with current date
        //fetchOrders();
    }
}, [searchParams]); // Runs when URL params change

// Fetch orders when selectedMenuDate changes
useEffect(() => {
    fetchOrders();
}, [selectedMenuDate]);

// ADD THIS: Helper to check if we're filtering by URL params
const isFilteredByUrl = searchParams.get('menudate');

// ADD THIS: Clear URL filters and reset to today
const clearUrlFilters = () => {
  // Clear URL params without navigation
  window.history.replaceState({}, '', '/myorders');
  setSelectedMenuDate(new Date().toISOString().split('T')[0]);
};
  
  
    // Filter and sort orders when dependencies change
  useEffect(() => {
      filterAndSortOrders();
    }, [orders, searchTerm, statusFilter, sortBy]);
  
    const fetchOrders = async () => {
      try {
        setLoading(true);
        // Fetch orders using the API service
        const params = {
          // Add any additional parameters if needed
          // user_id: user?.id, // Uncomment if you need to filter by user
          // include_details: true,
          menu_date: selectedMenuDate, // Pass the selected menu date
          skip:0,
          limit: 100 
        };
        
        const response = await orderService.getOrdersbyMenuDate(params);
        setOrders(response.data || response || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to load orders. Please try again.');
      } finally {
        setLoading(false);
      }
    };
  
    const filterAndSortOrders = () => {
      let filtered = [...orders];
  
      // Apply search filter
      if (searchTerm) {
        filtered = filtered.filter(order =>
          String(order.order_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) 
          
        );
      }
  
      // Apply status filter
      if (statusFilter !== 'all') {
        filtered = filtered.filter(order => order.status === statusFilter);
      }
  
      // Apply sorting
      filtered.sort((a, b) => {
        switch (sortBy) {
          case 'newest':
            return new Date(b.order_date) - new Date(a.order_date);
          case 'oldest':
            return new Date(a.order_date) - new Date(b.order_date);
          case 'amount-high':
            return parseFloat(b.total) - parseFloat(a.total);
          case 'amount-low':
            return parseFloat(a.total) - parseFloat(b.total);
          case 'status':
            return a.status.localeCompare(b.status);
          default:
            return 0;
        }
      });
  
      setFilteredOrders(filtered);
    };
  
    const handleStatusUpdate = async (orderId, newStatus) => {
      try {
        // Update order status using the API service
        const orderData = { status: newStatus };
        await orderService.updateOrderStatus(orderId, orderData);
        
        // Update local state
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order.order_id === orderId
              ? { ...order, status: newStatus }
              : order
          )
        );
      } catch (err) {
        console.error('Error updating order status:', err);
        setError('Failed to update order status. Please try again.');
        // You could also show a toast notification here
      }
    };
  
    const getStatusCount = (status) => {
      return orders.filter(order => order.status === status).length;
    };
  
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
  
    const formatAddress = (address) => {
      if (typeof address === 'string') return address;
      if (typeof address === 'object') {
        return [address.street, address.city, address.postcode]
          .filter(Boolean)
          .join(', ');
      }
      return 'Address not available';
    };
  
    const parseOrderItems = (items) => {
      if (!items) return [];
      
      if (typeof items === 'string') {
        try {
          const parsed = JSON.parse(items);
          return Object.entries(parsed).map(([key, item]) => ({
            id: key,
            name: item.item_name || `Item ${key}`,
            quantity: item.quantity || item.quantit || 1,
            price: item.price || '0.00'
          }));
        } catch (e) {
          return [];
        }
      }
      
      if (typeof items === 'object') {
        return Object.entries(items).map(([key, item]) => {
          if (typeof item === 'object' && item.item_name) {
            return {
              id: key,
              name: item.item_name,
              quantity: item.quantity || item.quantit || 1,
              price: item.price || '0.00'
            };
          }
          return {
            id: key,
            name: typeof item === 'string' ? item : `Item ${key}`,
            quantity: 1,
            price: '0.00'
          };
        });
      }
      
      return [];
    };
  
    if (loading) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your orders...</p>
          </div>
        </div>
      );
    }
  
    if (error) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchOrders}
              className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
  
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <Package className="h-8 w-8 text-orange-600 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
            </div>
            <p className="text-gray-600">
              Track and manage all your food orders in one place
            </p>
          </div>
          {/* Menu Date Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Menu Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  value={selectedMenuDate}
                  onChange={(e) => {
                              setSelectedMenuDate(e.target.value);
                              if (isFilteredByUrl) {
                                window.history.replaceState({}, '', '/myorders');
                              }
                              }
                  }
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
  
          {/* Status Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="text-2xl font-bold text-gray-900">{orders.length}</div>
              <div className="text-sm text-gray-600">Total Orders</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="text-2xl font-bold text-yellow-600">{getStatusCount(ORDER_STATUS.PENDING)}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="text-2xl font-bold text-blue-600">{getStatusCount(ORDER_STATUS.CONFIRMED)}</div>
              <div className="text-sm text-gray-600">Confirmed</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="text-2xl font-bold text-purple-600">{getStatusCount(ORDER_STATUS.PREPARING)}</div>
              <div className="text-sm text-gray-600">Preparing</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="text-2xl font-bold text-green-600">{getStatusCount(ORDER_STATUS.READY)}</div>
              <div className="text-sm text-gray-600">Ready</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="text-2xl font-bold text-gray-600">{getStatusCount(ORDER_STATUS.DELIVERED)}</div>
              <div className="text-sm text-gray-600">Delivered</div>
            </div>
          </div>
  
          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
  
              {/* Status Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">All Statuses</option>
                  <option value={ORDER_STATUS.PENDING}>Pending</option>
                  <option value={ORDER_STATUS.CONFIRMED}>Confirmed</option>
                  <option value={ORDER_STATUS.PREPARING}>Preparing</option>
                  <option value={ORDER_STATUS.READY}>Ready</option>
                  <option value={ORDER_STATUS.DELIVERED}>Delivered</option>
                  <option value={ORDER_STATUS.CANCELLED}>Cancelled</option>
                </select>
              </div>
  
              {/* Sort */}
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="amount-high">Amount: High to Low</option>
                  <option value="amount-low">Amount: Low to High</option>
                  <option value="status">Status</option>
                </select>
              </div>
  
              {/* View Toggle */}
              <div className="flex items-center justify-end space-x-2">
                <span className="text-sm text-gray-600">View:</span>
                <div className="flex border border-gray-300 rounded-md overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${viewMode === 'grid' 
                      ? 'bg-orange-600 text-white' 
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                    title="Grid View"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-2 ${viewMode === 'table' 
                      ? 'bg-orange-600 text-white' 
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                    title="Table View"
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
  
          {/* Orders Display */}
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Found</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters.' 
                  : 'You haven\'t placed any orders yet.'}
              </p>
            </div>
          ) : (
            <>
              {viewMode === 'grid' ? (
                /* Grid View */
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredOrders.map((order) => (
                    <OrderCard
                      key={order.order_id}
                      order={order}
                      onStatusUpdate={handleStatusUpdate}
                      userRole={userRole}
                    />
                  ))}
                </div>
              ) : (
                /* Table View */
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Order Details
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Customer
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Items
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredOrders.map((order) => {
                          const orderItems = parseOrderItems(order.items);
                          const totalItems = orderItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
                          
                          return (
                            <tr key={order.order_id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    #{order.order_id}
                                  </div>
                        
                                </div>
                              </td>
                              
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-900">
                                  <div className="font-medium">{order.customer_name}</div>
                                  {order.customer_phone && (
                                    <div className="flex items-center text-gray-500 mt-1">
                                      <Phone className="h-3 w-3 mr-1" />
                                      {order.customer_phone}
                                    </div>
                                  )}
                                  {order.customer_email && (
                                    <div className="flex items-center text-gray-500 mt-1">
                                      <Mail className="h-3 w-3 mr-1" />
                                      {order.customer_email}
                                    </div>
                                  )}
                                  <div className="flex items-start text-gray-500 mt-1">
                                    <MapPin className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                                    <span className="text-xs">{formatAddress(order.customer_address)}</span>
                                  </div>
                                </div>
                              </td>
                              
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-900">
                                  <div className="font-medium">{totalItems} items</div>
                                  <div className="text-xs text-gray-500 max-w-xs">
                                    {orderItems.slice(0, 2).map(item => 
                                      `${item.name} (${item.quantity})`
                                    ).join(', ')}
                                    {orderItems.length > 2 && ` +${orderItems.length - 2} more`}
                                  </div>
                                </div>
                              </td>
                              
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                </span>
                              </td>
                              
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                £{parseFloat(order.total).toFixed(2)}
                              </td>
                              
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <div>{format(new Date(order.order_date), 'MMM dd, yyyy')}</div>
                                <div className="text-xs">{format(new Date(order.order_date), 'HH:mm')}</div>
                              </td>
                              
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => {/* Add view details logic */}}
                                    className="text-orange-600 hover:text-orange-900"
                                    title="View Details"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>
                                  {userRole === 'caterer' && ![ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED].includes(order.status) && (
                                    <select
                                      onChange={(e) => handleStatusUpdate(order.order_id, e.target.value)}
                                      value={order.status}
                                      className="text-xs border border-gray-300 rounded px-2 py-1"
                                    >
                                      <option value={ORDER_STATUS.PENDING}>Pending</option>
                                      <option value={ORDER_STATUS.CONFIRMED}>Confirmed</option>
                                      <option value={ORDER_STATUS.PREPARING}>Preparing</option>
                                      <option value={ORDER_STATUS.READY}>Ready</option>
                                      <option value={ORDER_STATUS.DELIVERED}>Delivered</option>
                                      <option value={ORDER_STATUS.CANCELLED}>Cancelled</option>
                                    </select>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
  
          {/* Results Summary */}
          {filteredOrders.length > 0 && (
            <div className="mt-8 text-center text-gray-600">
              Showing {filteredOrders.length} of {orders.length} orders
            </div>
          )}
        </div>
      </div>
    );
  };
  
  export default MyOrdersPage;