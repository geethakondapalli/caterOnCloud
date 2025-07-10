import api from './api';

export const sendNotifications= {
  sendInvoicebyEmail: async (email_request) => {
    const response = await api.post('/notifications/send-email-sync',email_request);
    return response.data;
  },

  sendInvoicebySMS: async (sms_request) => {
    const response = await api.post('/notifications/send-sms-sync', sms_request);
    return response.data;
  },
}