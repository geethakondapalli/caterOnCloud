import React, { useState, useEffect } from 'react';
import { MessageSquare, Clock, CheckCircle, XCircle, User, Mail, Phone, Calendar, Eye, Edit3, Filter } from 'lucide-react';
import { inquiryService } from '../services/inquiry';

const AdminInquiryManagement = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'contacted', 'quoted', 'confirmed', 'closed'
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'status'

  // Sample data structure - replace with actual API calls
  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    setLoading(true);
    try {

    const response = await inquiryService.getAllInquiry();
      // Replace with your actual API call
      // const response = await getAllInquiry();
      // setInquiries(response);
      
      // Sample data for demo
      setInquiries(response);
    } catch (error) {
      console.error('Failed to fetch inquiries:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateInquiryStatus = async (inquiryId, newStatus) => {
    setActionLoading(inquiryId);
    try {
      // Replace with your actual API call
      // await api.put(`/inquiry/${inquiryId}/status`, { status: newStatus });
      const updatedInquiry = await inquiryService.updateInquiry(inquiryId, {status:newStatus});
      setInquiries(prevInquiries => 
        prevInquiries.map(inquiry => 
          inquiry.inquiry_id === inquiryId ? updatedInquiry : inquiry
        )
      );
    } catch (error) {
      console.error('Failed to update inquiry status:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'contacted':
        return 'bg-blue-100 text-blue-800';
      case 'closed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-3 h-3" />;
      case 'contacted':
        return <MessageSquare className="w-3 h-3" />;
      case 'quoted':
        return <MessageSquare className="w-3 h-3" />;
      case 'confirmed':
        return <CheckCircle className="w-3 h-3" />;
      case 'cancelled':
        return <XCircle className="w-3 h-3" />;
      default:
        return <XCircle className="w-3 h-3" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatEventDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const filteredInquiries = inquiries.filter(inquiry => {
    if (filter === 'all') return true;
    return inquiry.status === filter;
  });

  const sortedInquiries = [...filteredInquiries].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created_at) - new Date(a.created_at);
      case 'oldest':
        return new Date(a.created_at) - new Date(b.created_at);
      case 'status':
        return a.status.localeCompare(b.status);
      default:
        return 0;
    }
  });

  const getStatusCounts = () => {
    return {
      all: inquiries.length,
      pending: inquiries.filter(i => i.status === 'pending').length,
      contacted: inquiries.filter(i => i.status === 'contacted').length,
      quoted: inquiries.filter(i => i.status === 'quoted').length,
      confirmed: inquiries.filter(i => i.status === 'confirmed').length,
      cancelled: inquiries.filter(i => i.status === 'cancelled').length,
     
    };
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading inquiries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            Inquiry Management
          </h1>
          <p className="text-sm md:text-base opacity-90">
            Manage customer inquiries and catering requests
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Inquiries</p>
                <p className="text-2xl font-bold text-gray-900">{statusCounts.all}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Contacted</p>
                <p className="text-2xl font-bold text-blue-600">{statusCounts.contacted}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Confirmed</p>
                <p className="text-2xl font-bold text-green-600">{statusCounts.confirmed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({statusCounts.all})
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === 'pending'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pending ({statusCounts.pending})
              </button>
              <button
                onClick={() => setFilter('contacted')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === 'contacted'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
               Contacted ({statusCounts.contacted})
              </button>
              <button
                onClick={() => setFilter('quoted')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === 'quoted'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Quoted ({statusCounts.quoted})
              </button>
              <button
                onClick={() => setFilter('confirmed')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === 'confirmed'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Confirmed ({statusCounts.confirmed})
              </button>
              <button
                onClick={() => setFilter('cancelled')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === 'cancelled'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Cancelled ({statusCounts.cancelled})
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="status">Sort by Status</option>
              </select>
            </div>
          </div>
        </div>

        {/* Inquiries List */}
        <div className="space-y-4">
          {sortedInquiries.map((inquiry) => (
            <div key={inquiry.inquiry_id} className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{inquiry.customer_name}</h3>
                      <p className="text-sm text-gray-500">{inquiry.event_type}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(inquiry.status)}`}>
                      {getStatusIcon(inquiry.status)}
                      <span className="ml-1 capitalize">{inquiry.status}</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span>{inquiry.email}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{inquiry.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{formatEventDate(inquiry.event_date)} • {inquiry.guest_count} guests</span>
                  </div>
                </div>

                <p className="text-gray-700 mb-4 line-clamp-2">{inquiry.message}</p>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    <span>Created: {formatDate(inquiry.created_at)}</span>
                    {inquiry.updated_at !== inquiry.created_at && (
                      <span className="ml-4">Updated: {formatDate(inquiry.updated_at)}</span>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedInquiry(inquiry);
                        setShowDetailModal(true);
                      }}
                      className="bg-gray-100 text-gray-700 px-3 py-2 rounded text-sm font-medium hover:bg-gray-200 transition-colors flex items-center space-x-1"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View</span>
                    </button>
                    
                    {inquiry.status === 'pending' && (
                    <button
                      onClick={() => {
                        updateInquiryStatus(inquiry.inquiry_id, 'contacted');
                        setShowDetailModal(false);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Mark as Contacted</span>
                    </button>
                  )}

                  {inquiry.status === 'contacted' && (
                    <button
                      onClick={() => {
                        updateInquiryStatus(inquiry.inquiry_id, 'quoted');
                        setShowDetailModal(false);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700 transition-colors flex items-center space-x-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Mark as Quoted</span>
                    </button>
                  )}
                   {inquiry.status === 'quoted' && (
                    <div className="flex space-x-2">
                    <button
                        onClick={() => {
                        updateInquiryStatus(inquiry.inquiry_id, 'confirmed');
                        setShowDetailModal(false);
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700 transition-colors flex items-center space-x-2"
                    >
                        <CheckCircle className="w-4 h-4" />
                        <span>Confirm</span>
                    </button>
                    
                    <button
                        onClick={() => {
                        updateInquiryStatus(inquiry.inquiry_id, 'cancelled');
                        setShowDetailModal(false);
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded font-medium hover:bg-red-700 transition-colors flex items-center space-x-2"
                    >
                        <XCircle className="w-4 h-4" />
                        <span>Cancel</span>
                    </button>
                  </div>
                    
                  )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {sortedInquiries.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No inquiries found</h3>
            <p className="text-gray-500">
              {filter === 'all' 
                ? 'No inquiries have been submitted yet.'
                : `No ${filter} inquiries at the moment.`}
            </p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedInquiry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Inquiry Details</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <p className="text-gray-900">{selectedInquiry.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <p className="text-gray-900">{selectedInquiry.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <p className="text-gray-900">{selectedInquiry.phone}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedInquiry.status)}`}>
                        {getStatusIcon(selectedInquiry.status)}
                        <span className="ml-1 capitalize">{selectedInquiry.status}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                      <p className="text-gray-900">{selectedInquiry.event_type}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Event Date</label>
                      <p className="text-gray-900">{formatEventDate(selectedInquiry.event_date)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Guest Count</label>
                      <p className="text-gray-900">{selectedInquiry.guest_count} guests</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Message</h3>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg leading-relaxed">
                    {selectedInquiry.message}
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="text-gray-500">Created:</span>
                      <span className="text-gray-900">{formatDate(selectedInquiry.created_at)}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="text-gray-500">Last Updated:</span>
                      <span className="text-gray-900">{formatDate(selectedInquiry.updated_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded font-medium hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
                  {selectedInquiry.status === 'pending' && (
                    <button
                      onClick={() => {
                        updateInquiryStatus(selectedInquiry.inquiry_id, 'contacted');
                        setShowDetailModal(false);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Mark as Contacted</span>
                    </button>
                  )}

                  {selectedInquiry.status === 'contacted' && (
                    <button
                      onClick={() => {
                        updateInquiryStatus(selectedInquiry.inquiry_id, 'quoted');
                        setShowDetailModal(false);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700 transition-colors flex items-center space-x-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Mark as Quoted</span>
                    </button>
                  )}
                   {selectedInquiry.status === 'quoted' && (
                    <div>
                    <button
                      onClick={() => {
                        updateInquiryStatus(selectedInquiry.inquiry_id, 'confirmed');
                        setShowDetailModal(false);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700 transition-colors flex items-center space-x-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Mark as confirm order</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        updateInquiryStatus(selectedInquiry.inquiry_id, 'confirmed');
                        setShowDetailModal(false);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700 transition-colors flex items-center space-x-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Mark as confirm order</span>
                    </button>
                    </div>
                    
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInquiryManagement;