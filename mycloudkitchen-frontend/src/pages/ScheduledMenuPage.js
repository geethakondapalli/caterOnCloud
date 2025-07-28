import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { menuService } from '../services/menu';
import { useAuth } from '../context/AuthContext';
import FlyerGenerator from '../components/menu/FlyerGenerator';
import { 
  Plus, 
  Minus, 
  Save, 
  Upload, 
  Calendar, 
  DollarSign,
  Package,
  Link as LinkIcon,
  Image,
  FileText,
  X,
  Check,
  AlertCircle,
  Copy
} from 'lucide-react';
import toast from 'react-hot-toast';
import VerticalCatalogGrid from '../components/menu/VerticalCatalogGrid';

const customerTemplate = {
  businessName: "Resturant Name",
  logo: "🍛",
  colors: {
    primary: "#ff6b35",
    secondary: "#2c3e50", 
    accent: "#f39c12"
  },
  contact: {
    phone: "(555) 123-4567",
    address: "123 Main Street, City",
    website: "www.spicegarden.com"
  },
  layout: "classic" // classic, modern, minimal
};

const ScheduledMenuPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [catalogItems, setCatalogItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createdMenu, setCreatedMenu] = useState(null);
  const [showFlyerModal, setShowFlyerModal] = useState(false);

  const { register, control, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      menu_date: '',
      items: []
    }
  });

  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({
    control,
    name: 'items'
  });

  useEffect(() => {
    loadCatalogItems();
  }, []);

  const loadCatalogItems = async () => {
    try {
      const items = await menuService.getAllCatalogItems();
      setCatalogItems(items);
    } catch (error) {
      toast.error('Failed to load catalog items');
    }
  };

  const addItemFromCatalog = (catalogItem) => {
    if (catalogItem.is_combo) {
      // Handle combo items - adjust property names as needed
      appendItem({
        catalog_item_id: catalogItem.combo_id ,
        item_name: catalogItem.combo_name ,
        description: catalogItem.combo_description ,
        price: catalogItem.combo_default_price ,
        category: catalogItem.combo_category,
        is_combo: true,
        combo_items: catalogItem.combo_items || []
      });
    } else {
      // Handle regular menu items
      appendItem({
        catalog_item_id: catalogItem.menu_item_id,
        item_name: catalogItem.item_name,
        description: catalogItem.description,
        price: catalogItem.default_price,
        category: catalogItem.category,
        is_combo: false,
        combo_items: null
      });
    }
  };


  const onSubmit = async (data) => {
    if (data.items.length === 0) {
      toast.error('Please add at least one menu item');
      return;
    }

    setLoading(true);
    try {
      const scheduledMenu = await menuService.createScheduledMenu(data);
      setCreatedMenu(scheduledMenu);
      toast.success('Scheduled menu created successfully!');
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to create scheduled menu';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const copyOrderLink = () => {
    const orderLink = `${window.location.origin}${createdMenu.orderlink}`;
    navigator.clipboard.writeText(orderLink);
    toast.success('Order link copied to clipboard!');
  };



  // Success Screen
  if (createdMenu) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Menu Created!</h2>
          <p className="text-gray-600 mb-6">Your scheduled menu has been created successfully.</p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="text-sm text-gray-600 mb-2">Menu ID</div>
            <div className="font-mono text-lg font-bold text-gray-900">{createdMenu.menu_id}</div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="text-sm text-gray-600 mb-2">Order Link</div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={`${window.location.origin}${createdMenu.orderlink}`}
                readOnly
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white"
              />
              <button
                onClick={copyOrderLink}
                className="p-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
              >
                <Copy className="h-4 w-4" />
              </button>
              
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="text-sm text-gray-600 mb-2">
            <button 
                  onClick={() => setShowFlyerModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md">
                    Generate Flyer
              </button>
                <FlyerGenerator
                  isOpen={showFlyerModal}
                  onClose={() => setShowFlyerModal(false)}
                  menu={createdMenu}
                  template={customerTemplate}
                />
              </div>
            
          </div>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/menu/scheduled')}
              className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700"
            >
              View All Scheduled Menus
            </button>
            <button
              onClick={() => {
                setCreatedMenu(null);
                setValue('name', '');
                setValue('menu_date', '');
                setValue('items', []);
              }}
              className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50"
            >
              Create Another Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Scheduled Menu</h1>
          <p className="text-gray-600">Build your menu from catalog items</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Menu Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Menu Name *
                </label>
                <input
                  {...register('name', { required: 'Menu name is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  placeholder="e.g., Friday Special Menu"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Menu Date *
                </label>
                <input
                  {...register('menu_date', { required: 'Menu date is required' })}
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                />
                {errors.menu_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.menu_date.message}</p>
                )}
              </div>
            </div>
          </div>
          {/* Menu Items */}
          {itemFields.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Menu Items ({itemFields.length})</h2>
              
              <div className="space-y-4">
                {itemFields.map((field, index) => (
                  <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-medium text-gray-900">Item {index + 1}</h3>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:bg-red-50 p-1 rounded transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Item Name *
                        </label>
                        <input
                          {...register(`items.${index}.item_name`, { required: 'Item name is required' })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                          placeholder="Enter item name"
                        />
                        {errors.items?.[index]?.item_name && (
                          <p className="mt-1 text-sm text-red-600">{errors.items[index].item_name.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Price (£) *
                        </label>
                        <input
                          {...register(`items.${index}.price`, { 
                            required: 'Price is required',
                            min: { value: 0.01, message: 'Price must be greater than 0' }
                          })}
                          type="number"
                          step="0.01"
                          min="0.01"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                          placeholder="0.00"
                        />
                        {errors.items?.[index]?.price && (
                          <p className="mt-1 text-sm text-red-600">{errors.items[index].price.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Category
                        </label>
                        <input
                          {...register(`items.${index}.category`)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                          placeholder="e.g., Main Course"
                        />
                      </div>
                    </div>
 
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        {...register(`items.${index}.description`)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Describe the item..."
                      />
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center">
                        <input
                          {...register(`items.${index}.is_combo`)}
                          type="checkbox"
                          className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                          disabled // Make it read-only since it's determined by the data
                        />
                        <label className="ml-2 text-sm text-gray-700">
                          This is a combo deal
                        </label>
                      </div>

                      {/* Show combo items section when is_combo is true */}
                      {watch(`items.${index}.is_combo`) && (
                        <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                          <h4 className="text-sm font-medium text-gray-900 mb-3">
                            Combo Items
                            {field.combo_items && field.combo_items.length > 0 && (
                              <span className="ml-2 text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded-full">
                                {field.combo_items.length} item{field.combo_items.length !== 1 ? 's' : ''}
                              </span>
                            )}
                          </h4>
                          
                          {/* Read-only display of combo items */}
                          {field.combo_items && field.combo_items.length > 0 ? (
                            <div className="space-y-2">
                              {field.combo_items.map((comboItem, comboIndex) => (
                                <div key={comboIndex} className="bg-white p-3 rounded border border-gray-200">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium text-gray-900">{comboItem.item_name}</span>
                                    {comboItem.quantity && (
                                      <span className="text-green-600 font-medium">{comboItem.quantity}x</span>
                                    )}
                                  </div>
                                  {comboItem.description && (
                                    <p className="text-sm text-gray-600 mt-1">{comboItem.description}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="bg-white p-3 rounded border border-gray-200">
                              <p className="text-sm text-gray-500 italic">No combo items specified</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/menu/scheduled')}
              className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || itemFields.length === 0}
              className="inline-flex items-center px-6 py-3 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 transition-colors"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Creating Menu...' : 'Create Scheduled Menu'}
            </button>
          </div>
        </form>
          {/* Catalog Items */}
        
        <VerticalCatalogGrid catalogItems={catalogItems} onAddToMenu={addItemFromCatalog}/>   
 
      </div>
    </div>
  );
};

export default ScheduledMenuPage;