import api from './api';

export const menuService = {
  // Scheduled Menus 
  getScheduledMenus: async (params = {}) => {
    try {
      const response = await api.get('/menu/scheduled', { params });
      return response.data;
    } catch (error) {
      console.error('Error loading scheduled menus:', error);
      throw error;
    }
  },

  getMyScheduledMenusMy: async () => {
    try {
      const response = await api.get('/menu/scheduled/my');
      return response.data;
    } catch (error) {
      console.error('Error loading my scheduled menus:', error);
      throw error;
    }
  },

  getScheduledMenu: async (menuId) => {
    try {
      const response = await api.get(`/menu/scheduled/${menuId}`);
      return response.data;
    } catch (error) {
      console.error('Error loading scheduled menu:', error);
      throw error;
    }
  },

  createScheduledMenu: async (menuData) => {
    try {
      const response = await api.post('/menu/scheduled', menuData);
      return response.data;
    } catch (error) {
      console.error('Error creating scheduled menu:', error);
      throw error;
    }
  },

  updateScheduledMenu: async (menuId, menuData) => {
    try {
      const response = await api.put(`/menu/scheduled/${menuId}`, menuData);
      return response.data;
    } catch (error) {
      console.error('Error updating scheduled menu:', error);
      throw error;
    }
  },

  updateScheduledMenuStatus: async (menuId,statusData) => {
    try {
      const response = await api.put(`/menu/scheduled/${menuId}/status`,statusData);
      return response.data;
    } catch (error) {
      console.error('Error updating scheduled menu:', error);
      throw error;
    }
  },

  deleteScheduledMenu: async (menuId) => {
    try {
      const response = await api.delete(`/menu/scheduled/${menuId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting scheduled menu:', error);
      throw error;
    }
  },

  uploadMenuFlyer: async (file, menuName = null, menuDate = null) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (menuName) formData.append('menu_name', menuName);
      if (menuDate) formData.append('menu_date', menuDate);

      const response = await api.post('/menu/scheduled/upload-flyer', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading menu flyer:', error);
      throw error;
    }
  },

  // Catalog methods
  getCatalogItems: async (params = {}) => {
    try {
      const response = await api.get('/menu/catalog/menu_items', { params });
      return response.data;
    } catch (error) {
      console.error('Error loading catalog items:', error);
      throw error;
    }
  },

  getAllCatalogItems: async (params = {}) => {
    try {
      const response = await api.get('/menu/catalog/all', { params });
      return response.data;
    } catch (error) {
      console.error('Error loading catalog items:', error);
      throw error;
    }
  },

  createCatalogItem: async (catalogData) => {
    try {
      const response = await api.post('/menu/catalog/create_menu_item', catalogData);
      return response.data;
    } catch (error) {
      console.error('Error creating catalog item:', error);
      throw error;
    }
  },

  updateCatalogItem: async (itemId, catalogData) => {
    try {
      const response = await api.put(`/menu/catalog/menu/${itemId}`, catalogData);
      return response.data;
    } catch (error) {
      console.error('Error updating catalog item:', error);
      throw error;
    }
  },

  deleteCatalogItem: async (itemId) => {
    try {
      const response = await api.delete(`/menu/catalog/menu/${itemId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting catalog item:', error);
      throw error;
    }
  },

  getCatalogCategories: async () => {
    try {
      const response = await api.get('/menu/catalog/menu/categories');
      return response.data;
    } catch (error) {
      console.error('Error loading categories:', error);
      throw error;
    }
  },

  // combo
  getComboItems: async (params = {}) => {
    try {
      const response = await api.get('/menu/catalog/allcombo', { params });
      return response.data;
    } catch (error) {
      console.error('Error loading combo items:', error);
      throw error;
    }
  },
  createComboItem: async (comboData) => {
    try {
      const response = await api.post('/menu/catalog/createcombo', comboData);
      return response.data;
    } catch (error) {
      console.error('Error creating combo item:', error);
      throw error;
    }
  },
  updateComboItem: async (comboId, comboData) => {
    try {
      const response = await api.put(`/menu/catalog/combo/${comboId}`, comboData);
      return response.data;
    } catch (error) {
      console.error('Error updating combo item:', error);
      throw error;
    }
  },
  deleteComboItem: async (comboId) => {
    try {
      const response = await api.delete(`/menu/catalog/combo/${comboId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting combo item:', error);
      throw error;
    }
  },

};
