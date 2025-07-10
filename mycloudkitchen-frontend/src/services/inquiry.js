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
  
}