import React, { useState, useEffect } from 'react';
import { Calendar, Search, Filter, Clock, User, Phone, MapPin, PoundSterling,CheckCircle } from 'lucide-react';
import { paymentService } from '../services/payments';
import { orderService } from '../services/orders';

const ManagePayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMenuDate, setSelectedMenuDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [refreshKey, setRefreshKey] = useState(0);
  const [updatingPayments, setUpdatingPayments] = useState(new Set()); // Track which payments are being updated

  useEffect(() => {
    fetchPayments();
  }, [selectedMenuDate]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      //const data = await paymentService.getPaymentsByMenuDate(selectedMenuDate);
      const data = await paymentService.getPayments();
      setPayments(data);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReceiveFunds = async (payment) => {
    const orderId = payment.order_id;
    
    // Add to updating set
    setUpdatingPayments(prev => new Set([...prev, orderId]));
    
    try {
      const paymentData = {
        payment_status: 'completed'
      };
      
      const response = await orderService.updateOrderStatus(orderId, paymentData);
      
      if (response.success) {
        // Update the local state immediately for better UX
        setPayments(prevPayments => 
          prevPayments.map(p => 
            p.order_id === orderId 
              ? { 
                  ...p, 
                  payment_status: 'completed',
                  processed_at: new Date().toISOString(),
                  amount: p.total
                }
              : p
          )
        );
        
        // Optional: Show success message
        console.log('Payment status updated successfully');
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      // Optional: Show error message to user
    } finally {
      // Remove from updating set
      setUpdatingPayments(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
    fetchPayments(); // Refresh payments after update

  };

  const filteredPayments = payments.filter(payment => {

    const matchesSearch =  !searchTerm ||
      (payment.customer_name && payment.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (payment.customer_phone && payment.customer_phone.includes(searchTerm)) ||
      (payment.customer_address && payment.customer_address.includes(searchTerm)) ||
      (payment.order_id && payment.order_id.toString().includes(searchTerm));
    
    
    const matchesStatus = statusFilter === 'all' || payment.payment_status === statusFilter;
    const matchesMethod = methodFilter === 'all' || payment.payment_method === methodFilter;
  
    return matchesSearch && matchesStatus && matchesMethod;
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      // Handle ISO 8601 format with microseconds and timezone
      const date = new Date(dateString);
      
      // Check if the date is valid
      if (isNaN(date.getTime())) return 'Invalid Date';
      
      // Format options for better readability without timezone
      const options = {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      };
      
      return date.toLocaleString('en-US', options);
    } catch (error) {
      console.warn('Date formatting error:', error, 'for date:', dateString);
      return 'Invalid Date';
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const totalAmount = (filteredPayments || []).reduce((sum, payment) => {
    return sum + (+payment.total || 0);}, 0);
  const completedPayments = filteredPayments.filter(p => p.payment_status === 'completed').length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Management</h1>
          <p className="text-gray-600">View Payments filtered by menu date</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <PoundSterling className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed Payments</p>
                <p className="text-2xl font-bold text-gray-900">{completedPayments}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <User className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{filteredPayments.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Menu Date
              </label>
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
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Customer name, phone, or order ID"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Status
              </label>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={fetchPayments}
                disabled={loading}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden" key={refreshKey}>
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Payments ({filteredPayments.length})
            </h2>
          </div>
          
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
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>

                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      Loading payments...
                    </td>
                  </tr>
                ) : filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      No payments found for the selected date
                    </td>
                  </tr>
                ) : (
                    (filteredPayments || []).map((payment) => (
                    <tr key={payment.payment_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            Order #{payment.order_id}
                          </div>
                          <div className="text-sm text-gray-500">
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="flex items-center text-sm font-medium text-gray-900">
                              <User className="h-4 w-4 mr-1" />
                              {payment.customer_name}
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <Phone className="h-4 w-4 mr-1" />
                              {payment.customer_phone}
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <MapPin className="h-4 w-4 mr-1" />
                              {payment.customer_address || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(payment.total)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Paid: {formatCurrency(payment.amount)}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(payment.payment_status)}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(payment.processed_at)}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {payment.payment_method === 'offline' && payment.payment_status === 'pending' ? (
                          <button
                            onClick={() => handleReceiveFunds(payment)}
                            disabled={updatingPayments.has(payment.order_id)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {updatingPayments.has(payment.order_id) ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Processing...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Received Funds
                              </>
                            )}
                          </button>
                        ) : payment.payment_status === 'completed' ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completed
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">No action needed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagePayments;