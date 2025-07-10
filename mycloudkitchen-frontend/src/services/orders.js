import api from './api';

export const orderService = {
  createOrder: async (orderData) => {
    const response = await api.post('/orders/create_orders', orderData);
    return response.data;
  },

  getOrders: async (params = {}) => {
    const response = await api.get('/orders/getallorders', { params });
    return response.data;
  },

  getOrdersbyMenuDate: async (params = {}) => {

    const queryParams = {
      skip: 0,
      limit: 100,
      ...params // Spread the passed parameters
    };
    
    const response = await api.get('/orders/getallorders/bymenudate', { params: queryParams });
    return response.data;
  },
  getOrder: async (orderId) => {
    const response = await api.get(`/orders/get/${orderId}`);
    return response.data;
  },

  updateOrderStatus: async (orderId, orderData) => {
    const response = await api.put(`/orders/update/${orderId}`, orderData);
    return response.data;
  },

  cancelOrder: async (orderId) => {
    const response = await api.delete(`/orders/delete/${orderId}`);
    return response.data;
  }
};