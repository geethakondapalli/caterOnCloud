import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; // Adjust import path as needed
import { orderService } from '../services/orders'; // Adjust import path as needed
import { 
  Search, Filter, Calendar, Package, AlertCircle, CheckSquare, 
  Square, MoreHorizontal, Download, Printer, Eye, Phone, Mail, MapPin,
  Clock, CheckCircle, XCircle, Truck, ChefHat
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { ORDER_STATUS } from '../utils/constants'; // Adjust import path as needed
import { getNextStatus } from '../utils/constants'; // Adjust import path as needed

const ManageOrdersPage = () => {
  const { user, userRole } = useAuth();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedOrders, setSelectedOrders] = useState(new Set());
  const [bulkAction, setBulkAction] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selectedMenuDate, setSelectedMenuDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Fetch orders on component mount
  useEffect(() => {
    fetchOrders();
  }, [selectedMenuDate]);

  // Filter and sort orders when dependencies change
  useEffect(() => {
    filterAndSortOrders();
  }, [orders, searchTerm, statusFilter, selectedMenuDate, sortBy]);
  

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.getOrdersbyMenuDate({
        include_details: true,
        sort: 'order_date',
        menu_date: selectedMenuDate,
        order: 'desc'
      });

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
        String(order.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(order.customer_phone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(order.menu_item?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Apply date filter

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
        case 'customer':
          return (a.customer_name || '').localeCompare(b.customer_name || '');
        default:
          return 0;
      }
    });

    setFilteredOrders(filtered);
  };

  const handleSelectOrder = (orderId) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const handleStatusUpdate = (order,newStatus) => {
    
      try {
        const orderId = order.order_id;
        orderService.updateOrderStatus(orderId, { status: newStatus});
        setOrders(orders.map(order => 
          order.order_id === orderId 
            ? { ...order, status: newStatus }
            : order
        ));
        toast.success('Order status updated');
      } catch (error) {
        toast.error('Failed to update order status');
      }
    
  };
  const handleSelectAll = () => {
    if (selectedOrders.size === filteredOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(filteredOrders.map(order => order.order_id)));
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedOrders.size === 0) return;

    setProcessing(true);
    setShowBulkModal(false);

    try {
      const selectedOrderIds = Array.from(selectedOrders);
      
      if (bulkAction === 'export') {
        // Handle export functionality
        exportSelectedOrders(selectedOrderIds);
      } else if (bulkAction === 'print') {
        // Handle print functionality
        printSelectedOrders(selectedOrderIds);
      } else {
        // Handle status updates
        await Promise.all(
          selectedOrderIds.map(orderId => 
            orderService.updateOrderStatus(orderId, { status: bulkAction })
          )
        );

        // Update local state
        setOrders(prevOrders =>
          prevOrders.map(order =>
            selectedOrders.has(order.order_id)
              ? { ...order, status: bulkAction }
              : order
          )
        );

        // Clear selection
        setSelectedOrders(new Set());
      }
    } catch (err) {
      console.error('Error performing bulk action:', err);
      setError(`Failed to ${bulkAction} selected orders. Please try again.`);
    } finally {
      setProcessing(false);
      setBulkAction('');
    }
  };

  const exportSelectedOrders = (orderIds) => {
    const selectedOrdersData = orders.filter(order => orderIds.includes(order.order_id));
    const csvContent = convertToCSV(selectedOrdersData);
    downloadCSV(csvContent, `orders-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  };

  const printSelectedOrders = (orderIds) => {
    const selectedOrdersData = orders.filter(order => orderIds.includes(order.order_id));
    const printWindow = window.open('', '_blank');
    printWindow.document.write(generatePrintHTML(selectedOrdersData));
    printWindow.document.close();
    printWindow.print();
  };

  const convertToCSV = (data) => {
    const headers = ['Order ID', 'Customer Name', 'Phone', 'Email', 'Status', 'Total', 'Order Date', 'Delivery Date'];
    const rows = data.map(order => [
      order.order_id,
      order.customer_name,
      order.customer_phone,
      order.customer_email,
      order.status,
      order.total,
      format(new Date(order.order_date), 'yyyy-MM-dd HH:mm'),
      order.delivery_date ? format(new Date(order.delivery_date), 'yyyy-MM-dd HH:mm') : ''
    ]);
    
    return [headers, ...rows].map(row => row.map(field => `"${field}"`).join(',')).join('\n');
  };

  const downloadCSV = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generatePrintHTML = (data) => {
    return `
      <html>
        <head>
          <title>Orders Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .header { text-align: center; margin-bottom: 30px; }
            .status { padding: 4px 8px; border-radius: 4px; color: white; }
            .status-pending { background-color: #fbbf24; }
            .status-confirmed { background-color: #3b82f6; }
            .status-preparing { background-color: #8b5cf6; }
            .status-ready { background-color: #10b981; }
            .status-delivered { background-color: #6b7280; }
            .status-cancelled { background-color: #ef4444; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Orders Report</h1>
            <p>Generated on ${format(new Date(), 'MMMM dd, yyyy at HH:mm')}</p>
            <p>Total Orders: ${data.length}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Total</th>
                <th>Order Date</th>
              </tr>
            </thead>
            <tbody>
              ${data.map(order => `
                <tr>
                  <td>${order.order_id}</td>
                  <td>${order.customer_name}</td>
                  <td>${order.customer_phone}<br/>${order.customer_email}</td>
                  <td><span class="status status-${order.status}">${order.status.toUpperCase()}</span></td>
                  <td>£${parseFloat(order.total).toFixed(2)}</td>
                  <td>${format(new Date(order.order_date), 'MMM dd, yyyy HH:mm')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
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

  const getStatusIcon = (status) => {
    const icons = {
      [ORDER_STATUS.PENDING]: <Clock className="h-4 w-4" />,
      [ORDER_STATUS.CONFIRMED]: <CheckCircle className="h-4 w-4" />,
      [ORDER_STATUS.PREPARING]: <ChefHat className="h-4 w-4" />,
      [ORDER_STATUS.READY]: <Package className="h-4 w-4" />,
      [ORDER_STATUS.DELIVERED]: <Truck className="h-4 w-4" />,
      [ORDER_STATUS.CANCELLED]: <XCircle className="h-4 w-4" />
    };
    return icons[status] || <Package className="h-4 w-4" />;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
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
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-orange-600 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Manage Orders</h1>
                <p className="text-gray-600">Process and track all customer orders</p>
              </div>
            </div>
            
            {/* Bulk Actions */}
            {selectedOrders.size > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {selectedOrders.size} selected
                </span>
                <button
                  onClick={() => setShowBulkModal(true)}
                  className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 flex items-center"
                >
                  <MoreHorizontal className="h-4 w-4 mr-2" />
                  Bulk Actions
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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

            {/* Date Filter */}
            <div className="relative">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  value={selectedMenuDate}
                  onChange={(e) => setSelectedMenuDate(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="amount-high">Amount: High to Low</option>
                <option value="amount-low">Amount: Low to High</option>
                <option value="status">Status</option>
                <option value="customer">Customer Name</option>
              </select>
            </div>

            {/* Export/Print */}
            <div className="flex space-x-2">
              <button
                onClick={() => exportSelectedOrders(filteredOrders.map(o => o.order_id))}
                className="flex-1 flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                title="Export All"
              >
                <Download className="h-4 w-4" />
              </button>
              <button
                onClick={() => printSelectedOrders(filteredOrders.map(o => o.order_id))}
                className="flex-1 flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                title="Print All"
              >
                <Printer className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Found</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters.'
                : 'No orders have been placed yet.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={handleSelectAll}
                        className="flex items-center"
                      >
                        {selectedOrders.size === filteredOrders.length ? (
                          <CheckSquare className="h-4 w-4 text-orange-600" />
                        ) : (
                          <Square className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
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
                  {filteredOrders.map((order) => (
                    <tr
                      key={order.order_id}
                      className={`hover:bg-gray-50 ${
                        selectedOrders.has(order.order_id) ? 'bg-orange-50' : ''
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleSelectOrder(order.order_id)}
                          className="flex items-center"
                        >
                          {selectedOrders.has(order.order_id) ? (
                            <CheckSquare className="h-4 w-4 text-orange-600" />
                          ) : (
                            <Square className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </td>
                      
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
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1">{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
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
                        
                        
                            <div className="flex justify-end space-x-2">
                              {order.status === ORDER_STATUS.PENDING && (
                                <button
                                  onClick={() => handleStatusUpdate(order, ORDER_STATUS.CANCELLED)}
                                  className="px-3 py-1 text-sm border border-red-300 text-red-700 rounded-md hover:bg-red-50"
                                >
                                  Cancel
                                </button>
                              )}
                              {getNextStatus(order.status) && (
                              <button
                                onClick={() => handleStatusUpdate(order, getNextStatus(order.status))}
                                className="px-3 py-1 text-sm bg-orange-600 text-white rounded-md hover:bg-orange-700"
                              >
                                Mark as {getNextStatus(order.status).charAt(0).toUpperCase() + getNextStatus(order.status).slice(1)}
                              </button>
                            )}
                             </div>
                          
          
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Results Summary */}
        {filteredOrders.length > 0 && (
          <div className="mt-8 text-center text-gray-600">
            Showing {filteredOrders.length} of {orders.length} orders
            {selectedOrders.size > 0 && (
              <span className="ml-4 text-orange-600 font-medium">
                {selectedOrders.size} selected
              </span>
            )}
          </div>
        )}

        {/* Bulk Action Modal */}
        {showBulkModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Bulk Actions ({selectedOrders.size} orders)
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Action:
                    </label>
                    <select
                      value={bulkAction}
                      onChange={(e) => setBulkAction(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select an action...</option>
                      <option value={ORDER_STATUS.CONFIRMED}>Mark as Confirmed</option>
                      <option value={ORDER_STATUS.PREPARING}>Mark as Preparing</option>
                      <option value={ORDER_STATUS.READY}>Mark as Ready</option>
                      <option value={ORDER_STATUS.DELIVERED}>Mark as Delivered</option>
                      <option value={ORDER_STATUS.CANCELLED}>Mark as Cancelled</option>
                      <option value="export">Export to CSV</option>
                      <option value="print">Print Orders</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowBulkModal(false);
                      setBulkAction('');
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkAction}
                    disabled={!bulkAction || processing}
                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing ? 'Processing...' : 'Apply Action'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageOrdersPage;