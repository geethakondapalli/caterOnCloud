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

  getPaymentsByMenuDate: async (menu_date) => {
    const response = await api.get(`/payments/${menu_date}`)
    return response.data;
  }
};
