import React, { useState, useEffect } from 'react';
import { Eye, Check, Trash2, AlertCircle, Clock, User, Star } from 'lucide-react';
import { reviewService }  from '../services/review';

const AdminReviewManagement = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'approved'

  // Sample data - replace with actual API calls
  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      // Replace with actual API call
      const data = await reviewService.getAllReviews();
      setReviews(data);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      // Sample data for demo
    } finally {
      setLoading(false);
    }
  };

  const approveReview = async (reviewId) => {
    setActionLoading(reviewId);
    try {
      const response = await reviewService.approveReview(reviewId);
      
      if (response.ok) {
        setReviews(reviews.map(review => 
          review.review_id === reviewId 
            ? { ...review, is_approved: true }
            : review
        ));
      }
    } catch (error) {
      console.error('Failed to approve review:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const deleteReview = async (reviewId) => {
    setActionLoading(reviewId);
    try {
      const response = await reviewService.deleteReview(reviewId);
      
      if (response.ok) {
        setReviews(reviews.filter(review => review.review_id !== reviewId));
        setShowDeleteModal(false);
      }
    } catch (error) {
      console.error('Failed to delete review:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredReviews = reviews.filter(review => {
    if (filter === 'pending') return !review.is_approved;
    if (filter === 'approved') return review.is_approved;
    return true;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reviews...</p>
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
            Review Management
          </h1>
          <p className="text-sm md:text-base opacity-90">
            Manage customer reviews and feedback
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex space-x-6">
            <button
              onClick={() => setFilter('all')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                filter === 'all'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              All Reviews ({reviews.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                filter === 'pending'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Pending ({reviews.filter(r => !r.is_approved).length})
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                filter === 'approved'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Approved ({reviews.filter(r => r.is_approved).length})
            </button>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="container mx-auto px-4 py-6">
        {filteredReviews.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews found</h3>
            <p className="text-gray-500">
              {filter === 'pending' 
                ? 'No pending reviews at the moment.'
                : filter === 'approved'
                ? 'No approved reviews yet.'
                : 'No reviews have been submitted yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredReviews.map((review) => (
              <div key={review.review_id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{review.name}</h3>
                        <p className="text-sm text-gray-500">{formatDate(review.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        {renderStars(review.rating)}
                      </div>
                      <span className="text-sm text-gray-600">({review.rating}/5)</span>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-4 leading-relaxed">{review.review_text}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {review.is_approved ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <Check className="w-3 h-3 mr-1" />
                          Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </span>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      {!review.is_approved && (
                        <button
                          onClick={() => approveReview(review.review_id)}
                          disabled={actionLoading === review.review_id}
                          className="bg-green-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                        >
                          {actionLoading === review.review_id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <>
                              <Check className="w-4 h-4" />
                              <span>Approve</span>
                            </>
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedReview(review);
                          setShowDeleteModal(true);
                        }}
                        className="bg-red-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-red-700 transition-colors flex items-center space-x-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Review</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this review from {selectedReview.customer_name}? 
              This action cannot be undone.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded font-medium hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteReview(selectedReview.review_id)}
                disabled={actionLoading === selectedReview.review_id}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {actionLoading === selectedReview.review_id ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReviewManagement;