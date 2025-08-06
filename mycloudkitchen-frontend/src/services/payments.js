import api from './api';

export const paymentService = {
  createPaymentIntent: async (orderId) => {
    const response = await api.post(`/payments/stripe/create-intent?order_id=${orderId}`);
    return response.data;
  },

  confirmPayment: async (paymentId) => {
    const response = await api.post(`/payments/stripe/confirm/${paymentId}`);
    return response.data;
  },

  getPayments: async (params = {}) => {
    const response = await api.get('/payments/', { params });
    return response.data;
  },

  getPayment: async (paymentId) => {
    const response = await api.get(`/payments/${paymentId}`);
    return response.data;
  },

  getPaymentsByMenuDate: async (params = {}) => {
    const queryParams = {
      skip: 0,
      limit: 100,
      ...params 
    }// Spread the passed parameters) => {
    const response = await api.get(`/payments/bymenudate/`,{ params: queryParams });
    return response.data;
  },
};
