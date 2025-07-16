import api from './api';

export const inquiryService= {
  createInquiry: async (inquiry_request) => {
    const response = await api.post('/inquiry/create_inquiry',inquiry_request);
    return response.data;
  },
  getAllInquiry: async () => {
    const response = await api.get('/inquiry/allinquiries');
    return response.data;
  },
  updateInquiry: async (inquiry_id,inquiryData) => {
    const response = await api.put(`/inquiry/update/${inquiry_id}`, inquiryData);
    return response.data;
  },

}