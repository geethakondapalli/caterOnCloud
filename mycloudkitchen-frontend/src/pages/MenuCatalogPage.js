import React, { useState, useEffect } from 'react';
import { set, useForm } from 'react-hook-form';
import { menuService } from '../services/menu';
import { useAuth } from '../context/AuthContext';
import ComboGrid from '../components/menu/ComboGrid';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  DollarSign, 
  Package,
  Filter,
  X,
  Save,
  ChevronDown,
  Check,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

// Default categories as const variable
const defaultCategories = [
  'Appetizers', 'Main Courses', 'Desserts', 'Beverages','Combo Deals',
];

const MenuCatalogPage = () => {
  const { user } = useAuth();
  const [catalogItems, setCatalogItems] = useState([]);
  const [comboData, setComboCatalog] = useState([]);
  const [existingCategories, setExistingCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  
  // New state for form type
  const [formType, setFormType] = useState('regular'); // 'regular' or 'combo'
  const [comboItems, setComboItems] = useState([{ item_id: '', quantity: 1 }]);

  // Category dropdown state
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [categorySearchTerm, setCategorySearchTerm] = useState('');

  const { register, handleSubmit, reset, formState: { errors }, setValue, watch } = useForm();

  // Combine default categories with existing ones from database
  const allCategories = React.useMemo(() => {
    const combined = [...new Set([...defaultCategories, ...existingCategories])];
    return combined.sort();
  }, [existingCategories]);

  // Filter categories based on search term
  const filteredCategories = React.useMemo(() => {
    if (!categorySearchTerm) return allCategories;
    return allCategories.filter(category =>
      category.toLowerCase().includes(categorySearchTerm.toLowerCase())
    );
  }, [allCategories, categorySearchTerm]);

  useEffect(() => {
    loadCatalogData();
  }, [searchTerm, selectedCategory]);

  const loadCatalogData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (selectedCategory) params.category = selectedCategory;

      const [itemsData,comboData,categoriesData] = await Promise.all([
        menuService.getCatalogItems(params),
        menuService.getComboItems(params),
        menuService.getCatalogCategories(),

      ]);

      setCatalogItems(itemsData);
      setComboCatalog(comboData);
      setExistingCategories(categoriesData);
    } catch (error) {
      console.error('Error loading catalog:', error);
      let errorMessage = 'Failed to load catalog data';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map(err => err.msg || err).join(', ');
        } else if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };



  const onSubmit = async (data) => {
    setFormLoading(true);
    try {
      if (formType === 'combo') {
        // Handle combo item submission
        const comboData = {
          combo_name: data.item_name,
          combo_description: data.description || null,
          combo_default_price: parseFloat(data.default_price),
          category: data.category || null,
          combo_items: comboItems
            .filter(item => item.item_id && item.quantity > 0)
            .map(item => ({
              menu_item_id: parseInt(item.item_id),
              quantity: item.quantity
            }))
        };

        if (editingItem && editingItem.is_combo) {
          await menuService.updateComboItem(editingItem.combo_id, comboData);
          toast.success('Combo item updated successfully!');
        } else {
          await menuService.createComboItem(comboData);
          toast.success('Combo item created successfully!');
        }
      } else {
        // Handle regular item submission
        const catalogData = {
          item_name: data.item_name,
          description: data.description || null,
          default_price: parseFloat(data.default_price),
          category: data.category || null
        };

        if (editingItem && !editingItem.is_combo) {
          await menuService.updateCatalogItem(editingItem.menu_item_id, catalogData);
          toast.success('Menu item updated successfully!');
        } else {
          await menuService.createCatalogItem(catalogData);
          toast.success('Menu item created successfully!');
        }
      }

      handleFormClose();
      loadCatalogData();
    } catch (error) {
      console.error('Error saving item:', error);
      let errorMessage = `Failed to save ${formType} item`;
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Handle validation errors (array of error objects)
        if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map(err => err.msg || err).join(', ');
        }
        // Handle single error message
        else if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        }
        // Handle error object with message
        else if (errorData.message) {
          errorMessage = errorData.message;
        }
        // Fallback for other error formats
        else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormType(item.is_combo ? 'combo' : 'regular');
    
    setValue('item_name', item.is_combo ? item.combo_name : item.item_name);
    setValue('description', item.description || item.combo_description || '');
    setValue('default_price', item.is_combo ? item.combo_default_price : item.default_price);
    setValue('category', item.category ||item.combo_category || '');
    
    // If it's a combo item, load combo items
    if (item.is_combo && item.combo_items) {
      setComboItems(item.combo_items.map(ci => ({
        item_id: ci.menu_item_id.toString(), // Convert to string for select value
        quantity: ci.quantity
      })));
    } else {
      setComboItems([{ item_id: '', quantity: 1 }]);
    }
    
    setShowForm(true);
  };

  const handleDelete = async (item) => {
    const itemName = item.is_combo ? item.combo_name : item.item_name;
    if (!window.confirm(`Are you sure you want to delete "${itemName}"?`)) {
      return;
    }

    try {
      if (item.is_combo) {
        await menuService.deleteComboItem(item.combo_id);
      } else {
        await menuService.deleteCatalogItem(item.menu_item_id);
      }
      toast.success(`${item.is_combo ? 'Combo' : 'Menu'} item deleted successfully!`);
      loadCatalogData();
    } catch (error) {
      console.error('Error deleting item:', error);
      let errorMessage = `Failed to delete ${item.is_combo ? 'combo' : 'menu'} item`;
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map(err => err.msg || err).join(', ');
        } else if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      }
      
      toast.error(errorMessage);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingItem(null);
    setFormType('regular');
    setComboItems([{ item_id: '', quantity: 1 }]);
    reset();
  };

  const handleCancel = () => {
    handleFormClose();
  };

  const handleShowRegularForm = () => {
    setFormType('regular');
    setShowForm(true);
  };

  const handleShowComboForm = () => {
    setFormType('combo');
    setComboItems([{ item_id: '', quantity: 1 }]);
    setShowForm(true);
  };

  // Combo item management functions
  const addComboItem = () => {
    setComboItems([...comboItems, { item_id: '', quantity: 1 }]);
  };

  const removeComboItem = (index) => {
    if (comboItems.length > 1) {
      setComboItems(comboItems.filter((_, i) => i !== index));
    }
  };

  const updateComboItem = (index, field, value) => {
    const updated = [...comboItems];
    if (field === 'item_id') {
      updated[index][field] = value;
    } else if (field === 'quantity') {
      updated[index][field] = Math.max(1, parseInt(value) || 1);
    }
    setComboItems(updated);
  };



  // Get available items for combo selection (exclude combo items)
  const availableItemsForCombo = catalogItems.filter(item => !item.is_combo);

  const handleCategorySelect = (category) => {
    setValue('category', category);
    setCategoryDropdownOpen(false);
    setCategorySearchTerm('');
  };

  const handleCategoryInputChange = (e) => {
    const value = e.target.value;
    setValue('category', value);
    setCategorySearchTerm(value);
    setCategoryDropdownOpen(true);
  };

  const groupedItems = catalogItems.reduce((groups, item) => {
    const category = item.category || 'Uncategorized';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
    return groups;
  }, {});

  // Custom Category Dropdown Component
  const CategoryDropdown = ({ value, onChange, error }) => {
    return (
      <div className="relative">
        <div className="relative">
          <input
            type="text"
            value={value || ''}
            onChange={handleCategoryInputChange}
            onFocus={() => setCategoryDropdownOpen(true)}
            placeholder="Select or type category"
            className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 ${
              error 
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                : 'border-gray-300 focus:ring-orange-500 focus:border-orange-500'
            }`}
          />
          <button
            type="button"
            onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1"
          >
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${
              categoryDropdownOpen ? 'rotate-180' : ''
            }`} />
          </button>
        </div>

        {categoryDropdownOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {/* Default Categories Section */}
            <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide border-b bg-gray-50">
              Default Categories
            </div>
            
            {defaultCategories
              .filter(cat => cat.toLowerCase().includes((categorySearchTerm || '').toLowerCase()))
              .map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => handleCategorySelect(category)}
                  className="w-full px-3 py-2 text-left hover:bg-orange-50 flex items-center justify-between group"
                >
                  <span>{category}</span>
                  {category === value && <Check className="h-4 w-4 text-orange-600" />}
                </button>
              ))}

            {/* Existing Categories from Database */}
            {existingCategories.length > 0 && (
              <>
                <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide border-b bg-gray-50">
                  Your Categories
                </div>
                {existingCategories
                  .filter(cat => 
                    !defaultCategories.includes(cat) && 
                    cat.toLowerCase().includes((categorySearchTerm || '').toLowerCase())
                  )
                  .map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => handleCategorySelect(category)}
                      className="w-full px-3 py-2 text-left hover:bg-blue-50 flex items-center justify-between"
                    >
                      <span>{category}</span>
                      {category === value && <Check className="h-4 w-4 text-blue-600" />}
                    </button>
                  ))}
              </>
            )}

            {/* Create New Category Option */}
            {categorySearchTerm && 
             !allCategories.some(cat => cat.toLowerCase() === categorySearchTerm.toLowerCase()) && (
              <>
                <div className="border-t border-gray-200"></div>
                <button
                  type="button"
                  onClick={() => handleCategorySelect(categorySearchTerm)}
                  className="w-full px-3 py-2 text-left hover:bg-green-50 flex items-center text-green-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create "{categorySearchTerm}"
                </button>
              </>
            )}

            {/* No Results */}
            {filteredCategories.length === 0 && !categorySearchTerm && (
              <div className="px-3 py-2 text-sm text-gray-500 text-center">
                No categories available
              </div>
            )}
          </div>
        )}

        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Menu Catalog</h1>
          <p className="text-gray-600">Manage your standard menu items and combo deals</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search menu items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 min-w-[150px]"
                >
                  <option value="">All Categories</option>
                  {allCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Add Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleShowRegularForm}
                className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Menu Item
              </button>
              <button
                onClick={handleShowComboForm}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Package className="h-4 w-4 mr-2" />
                Add Combo
              </button>
            </div>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingItem 
                    ? `Edit ${editingItem.is_combo ? 'Combo' : 'Menu'} Item`
                    : `Add New ${formType === 'combo' ? 'Combo' : 'Menu'} Item`
                  }
                </h2>
                <div className="flex gap-2 mt-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    formType === 'regular' 
                      ? 'bg-orange-100 text-orange-700' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {formType === 'combo' ? 'Combo Item' : 'Regular Item'}
                  </span>
                </div>
              </div>
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {formType === 'combo' ? 'Combo Name' : 'Item Name'} *
                  </label>
                  <input
                    {...register('item_name', { 
                      required: `${formType === 'combo' ? 'Combo' : 'Item'} name is required`,
                      maxLength: { value: 100, message: 'Name must be less than 100 characters' }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    placeholder={formType === 'combo' ? 'e.g., Pizza & Drink Combo' : 'e.g., Margherita Pizza'}
                  />
                  {errors.item_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.item_name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <CategoryDropdown
                    value={watch('category')}
                    onChange={(value) => setValue('category', value)}
                    error={errors.category?.message}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {formType === 'combo' ? 'Combo Price' : 'Default Price'} (£) *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      {...register('default_price', { 
                        required: 'Price is required',
                        min: { value: 0.01, message: 'Price must be greater than 0' },
                        pattern: {
                          value: /^\d+(\.\d{1,2})?$/,
                          message: 'Please enter a valid price (e.g., 12.99)'
                        }
                      })}
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                      placeholder="0.00"
                    />
                  </div>
                  {errors.default_price && (
                    <p className="mt-1 text-sm text-red-600">{errors.default_price.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  placeholder={formType === 'combo' 
                    ? 'Describe what included in this combo deal...' 
                    : 'Describe the dish, ingredients, allergens, etc.'
                  }
                />
              </div>

              {/* Combo Items Selection */}
              {formType === 'combo' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Combo Items *
                    </label>
                    <button
                      type="button"
                      onClick={addComboItem}
                      className="inline-flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Item
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {comboItems.map((comboItem, index) => (
                      <div key={index} className="flex gap-3 items-start p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Menu Item
                          </label>
                          <select
                            value={comboItem.item_id || ''}
                            onChange={(e) => updateComboItem(index, 'item_id', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-sm"
                            required
                          >
                            <option value="">Select an item...</option>
                            {availableItemsForCombo.map(item => (
                              <option key={item.menu_item_id} value={item.menu_item_id}>
                                {item.item_name} - £{parseFloat(item.default_price).toFixed(2)}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="w-24">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Quantity
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={comboItem.quantity}
                            onChange={(e) => updateComboItem(index, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 text-sm"
                            required
                          />
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => removeComboItem(index)}
                          disabled={comboItems.length === 1}
                          className="mt-6 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  {comboItems.length === 0 && (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      Add items to create your combo
                    </div>
                  )}
                  
                  {/* Validation message for combo items */}
                  {formType === 'combo' && comboItems.filter(item => item.item_id).length === 0 && (
                    <p className="mt-2 text-sm text-red-600">
                      Please select at least one menu item for the combo
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading || (formType === 'combo' && comboItems.filter(item => item.item_id).length === 0)}
                  className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {formLoading ? 'Saving...' : editingItem ? `Update ${formType === 'combo' ? 'Combo' : 'Item'}` : `Add ${formType === 'combo' ? 'Combo' : 'Item'}`}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Catalog Items */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm h-48 animate-pulse">
                <div className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-4 w-2/3"></div>
                  <div className="h-20 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : Object.keys(groupedItems).length > 0 ? (
          <div className="space-y-8">
            {Object.entries(groupedItems).map(([category, items]) => (
              <div key={category}>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Package className="h-5 w-5 mr-2 text-orange-600" />
                  {category}
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({items.length} items)
                  </span>
                  {/* Show if it's a default category */}
                  {defaultCategories.includes(category) && (
                    <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                      Default
                    </span>
                  )}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {items.map(item => (
                    <div key={item.menu_item_id} className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow ${
                      item.is_combo ? 'border-l-4 border-blue-500' : ''
                    }`}>
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {item.is_combo ? item.combo_name : item.item_name}
                              </h3>
                              {item.is_combo && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                  COMBO
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-1 ml-2">
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="Edit item"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
                              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                              title="Delete item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <div className="mb-4">
                          <span className="text-2xl font-bold text-orange-600">
                            £{parseFloat(item.is_combo ? item.combo_price : item.default_price).toFixed(2)}
                          </span>
                        </div>

                        {/* Show combo items if it's a combo */}
                        {item.is_combo && item.combo_items && item.combo_items.length > 0 && (
                          <div className="mb-4">
                            <p className="text-xs font-medium text-gray-600 mb-2">Includes:</p>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {item.combo_items.map((comboItem, idx) => (
                                <li key={idx} className="flex justify-between">
                                  <span>{comboItem.item_name}</span>
                                  <span className="text-gray-400">×{comboItem.quantity}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {item.description && (
                          <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                            {item.description}
                          </p>
                        )}

                        <div className="text-xs text-gray-500">
                          ID: {item.menu_item_id}
                          {item.created_at && (
                            <div className="mt-1">
                              Added: {new Date(item.created_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || selectedCategory ? 'No items found' : 'No menu items yet'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedCategory 
                ? 'Try adjusting your search or filter criteria.'
                : 'Start building your menu catalog by adding your first item.'
              }
            </p>
            {!searchTerm && !selectedCategory && (
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleShowRegularForm}
                  className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Item
                </button>
                <button
                  onClick={handleShowComboForm}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Add Your First Combo
                </button>
              </div>
            )}
          </div>
        )}
      
        <ComboGrid combos={comboData} onEdit={handleEdit} onDelete={handleDelete} />  

        {/* Category Legend */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Available Categories</h3>
          <div className="flex flex-wrap gap-2">
            {allCategories.map(category => (
              <span
                key={category}
                className={`px-3 py-1 rounded-full text-sm ${
                  defaultCategories.includes(category)
                    ? 'bg-orange-100 text-orange-700 border border-orange-200'
                    : 'bg-blue-100 text-blue-700 border border-blue-200'
                }`}
              >
                {category}
                {defaultCategories.includes(category) && (
                  <span className="ml-1 text-xs opacity-75">(Default)</span>
                )}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Close dropdown when clicking outside */}
      {categoryDropdownOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setCategoryDropdownOpen(false)}
        />
      )}
    </div>
  );
};
export default MenuCatalogPage;