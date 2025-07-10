import api from './api';

export const authService = {
     // Test connection
    testConnection: async () => {
        try {
        const response = await api.get('/health');
        return response.data;
        } catch (error) {
        throw new Error('Cannot connect to backend server');
        }
    },

    login: async (email, password) => {
        
        try {

        const formData = new FormData();
        formData.append('username', email);
        formData.append('password', password);
        
        const response = await api.post('/auth/login', formData, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        });
        
        const { access_token } = response.data;
        localStorage.setItem('token', access_token);
        
        // Get user profile
        const userResponse = await api.get('/users/me');
        localStorage.setItem('user', JSON.stringify(userResponse.data));
        
        return userResponse.data;
       
        }catch (error) {
        console.error('Login error:', error);
        throw error;
      }


    },

    register: async (userData) => {
        const response = await api.post('/auth/register', userData);
        return response.data;
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    getCurrentUser: () => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    updateProfile: async (userData) => {
        const response = await api.put('/users/me', userData);
        localStorage.setItem('user', JSON.stringify(response.data));
        return response.data;
    }
    };