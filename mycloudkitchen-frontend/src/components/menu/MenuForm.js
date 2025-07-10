import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Minus, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const MenuForm = ({ menu, onSubmit, onCancel }) => {
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

  const { fields: categoryFields, append: appendCategory, remove: removeCategory } = useFieldArray({
    control,
    name: 'categories'
  });

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

  const addCategory = () => {
    appendCategory({ name: '', items: [{ name: '', price: '' }] });
  };

  const addItemToCategory = (categoryIndex) => {
    const currentCategories = watch('categories');
    const updatedCategories = [...currentCategories];
    updatedCategories[categoryIndex].items.push({ name: '', price: '' });
    setValue('categories', updatedCategories);
  };

  const removeItemFromCategory = (categoryIndex, itemIndex) => {
    const currentCategories = watch('categories');
    const updatedCategories = [...currentCategories];
    updatedCategories[categoryIndex].items.splice(itemIndex, 1);
    setValue('categories', updatedCategories);
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
          />
        </div>

        {/* Menu Categories */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Menu Items
            </label>
            <button
              type="button"
              onClick={addCategory}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Category
            </button>
          </div>

          {categoryFields.map((category, categoryIndex) => (
            <div key={category.id} className="border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-3">
                <input
                  {...register(`categories.${categoryIndex}.name`)}
                  type="text"
                  placeholder="Category name (e.g., Appetizers, Main Course)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                />
                <button
                  type="button"
                  onClick={() => removeCategory(categoryIndex)}
                  className="ml-2 p-2 text-red-600 hover:text-red-700"
                >
                  <Minus className="h-4 w-4" />
                </button>
              </div>

              {/* Items in category */}
              {watch(`categories.${categoryIndex}.items`)?.map((item, itemIndex) => (
                <div key={itemIndex} className="flex gap-2 mb-2">
                  <input
                    {...register(`categories.${categoryIndex}.items.${itemIndex}.name`)}
                    type="text"
                    placeholder="Item name"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  />
                  <input
                    {...register(`categories.${categoryIndex}.items.${itemIndex}.price`)}
                    type="number"
                    step="0.01"
                    placeholder="Price"
                    className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeItemFromCategory(categoryIndex, itemIndex)}
                    className="p-2 text-red-600 hover:text-red-700"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => addItemToCategory(categoryIndex)}
                className="text-sm text-orange-600 hover:text-orange-700"
              >
                + Add Item
              </button>
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