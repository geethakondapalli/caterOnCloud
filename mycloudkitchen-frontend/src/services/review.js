import api from './api';

export const reviewService= {
  createReview: async (review_request) => {
    const response = await api.post('/review/create_review',review_request);
    return response.data;
  },

  getApprovedReviews: async () => {
    const response = await api.get('/review/getApprovedReviews');
    return response.data;
  },
  getAllReviews: async () => {
    const response = await api.get('/review/getAllReviews');
    return response.data;
  },
  approveReview : async (review_id) => {
    const response = await api.put(`/review/${review_id}/approve`, review_id );
    return response.data;
  },
  deleteReview: async (review_id) => {
    const response = await api.delete(`/review/${review_id}/delete`, review_id );
    return response.data;
  },
  getReviewStats: async () => {
    const response = await api.get('/review/stats');
    return response.data;
  },

}