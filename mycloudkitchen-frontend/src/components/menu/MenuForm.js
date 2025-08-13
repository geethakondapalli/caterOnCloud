import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Minus, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const MenuForm = ({ menu, isEditable, onSubmit, onCancel}) => {
  const [loading, setLoading] = useState(false);
  
  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      name: menu?.name || '',
      menu_date: menu?.menu_date || '',
      orderlink: menu?.orderlink || '',
      categories: menu?.items ? Object.entries(menu.items).map(([name, items]) => ({
        name,
        items: Array.isArray(items) ? items : [{ name: items, price: '' }]
      })) : [{ name: '', items: [{ name: '', price: '' }] }]
    }
  });

  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({
    control,
    name: 'items'
  });


  const groupedItems = itemFields.reduce((acc, item, index) => {
    const category = item.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push({ ...item, fieldIndex: index });
    return acc;
  }, {});

  const addItemFromCatalog = (catalogItem) => {
    // Check for duplicates (using the function from earlier)
    const catalogItemId = catalogItem.is_combo 
      ? catalogItem.combo_id 
      : catalogItem.menu_item_id;

    const isDuplicate = itemFields.some(item => 
      item.catalog_item_id === catalogItemId
    );

    if (isDuplicate) {
      toast.error(`Item "${catalogItem.is_combo ? catalogItem.combo_name : catalogItem.item_name}" already exists in menu`);
      return;
    }

    if (catalogItem.is_combo) {
      appendItem({
        catalog_item_id: catalogItem.combo_id,
        item_name: catalogItem.combo_name,
        description: catalogItem.combo_description,
        price: catalogItem.combo_default_price,
        category: catalogItem.combo_category,
        is_combo: true,
        combo_items: catalogItem.combo_items || []
      });
    } else {
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

  const onFormSubmit = async (data) => {
    setLoading(true);
    try {
      // Transform categories back to the expected format
      const items = {};
      data.categories.forEach(category => {
        if (category.name) {
          items[category.name] = category.items.filter(item => item.name);
        }
      });

      const menuData = {
        name: data.name,
        menu_date: data.menu_date,
        orderlink: data.orderlink || null,
        items
      };

      await onSubmit(menuData);
      toast.success(menu ? 'Menu updated successfully!' : 'Menu created successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save menu');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {menu ? 'Edit Menu' : 'Create New Menu'}
      </h2>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Menu Name *
            </label>
            <input
              {...register('name', { required: 'Menu name is required' })}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              placeholder="e.g., Italian Dinner Special"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
            />
            {errors.menu_date && (
              <p className="mt-1 text-sm text-red-600">{errors.menu_date.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Order Link (Optional)
          </label>
          <input
            {...register('orderlink')}
            type="url"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
            placeholder="https://your-ordering-site.com"
            disabled={!!menu?.orderlink}
          />
        </div>

        {/* Menu Categories */}
        <div className="space-y-4">
        {Object.entries(groupedItems).map(([category, itemFields]) => (
        <div key={category} className="mb-6">
          <h4 className="font-medium text-gray-800 mb-3 text-lg border-b border-gray-200 pb-1">
            {category}
          </h4>
          <div className="space-y-3">
            {itemFields.map((item) => (
              <div key={item.fieldIndex} className="bg-gray-50 p-4 rounded-lg border">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left side - Item details */}
                  <div className="space-y-3">
                    {/* Item Name */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Item Name
                      </label>
                        <p className="font-medium text-gray-900">{item.item_name}</p>
                
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Description
                      </label>
                          <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
               
                  </div>

                  {/* Right side - Price and actions */}
                  <div className="space-y-3">
                    {/* Price */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Price
                      </label>
                      
                        <span className="font-bold text-lg text-green-600">£{item.price}</span>
                    </div>

                    {/* Combo indicator and actions */}
                    <div className="flex justify-between items-center">
                      {item.is_combo && (
                        <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                          Combo Deal
                        </div>
                      )}
                        <button
                          type="button"
                          onClick={() => removeItem(item.fieldIndex)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                          title="Remove item"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
        
                    </div>
                  </div>
                </div>

                {/* Combo items details */}
                {item.is_combo && item.combo_items && Array.isArray(item.combo_items) && (
                  <div className="mt-3 p-3 bg-white rounded border">
                    <p className="text-xs font-medium text-gray-700 mb-2">Combo Includes:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {item.combo_items.map((comboItem, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-gray-700">
                            {comboItem.item_name} × {comboItem.quantity}
                          </span>
                          <span className="text-gray-500">£{comboItem.default_price} each</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hidden fields for form data */}
                <input
                  type="hidden"
                  {...register(`items.${item.fieldIndex}.catalog_item_id`)}
                />
                <input
                  type="hidden"
                  {...register(`items.${item.fieldIndex}.is_combo`)}
                />
                {item.combo_items && (
                  <input
                    type="hidden"
                    {...register(`items.${item.fieldIndex}.combo_items`)}
                    value={JSON.stringify(item.combo_items)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
        </div>
        

      

        {/* Form Actions */}
        
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save Menu'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MenuForm;