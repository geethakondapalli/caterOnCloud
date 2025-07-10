import React, { useState } from 'react';
import { Package, Edit, Trash2, Plus, Search, Filter, DollarSign, Clock, Star } from 'lucide-react';

const VerticalCatalogGrid = ({ catalogItems ,onAddToMenu}) => {
  // Mock data - replace with your actual data
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Get unique categories
  const categories = [...new Set(catalogItems.map(item => item.category))].filter(Boolean);

  // Filter items
  const filteredItems = catalogItems.filter(item => {
    const matchesSearch = item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleEdit = (item) => {
    console.log('Edit item:', item);
  };

  const handleDelete = (item) => {
    console.log('Delete item:', item);
  };



  return (
    <div className="min-h-screen bg-gray-50">

        {/* Catalog Items - Grouped Layout */}
        <div className="space-y-8">
          {/* Combo Deals Section */}
          {filteredItems.filter(item => item.is_combo).length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-1 h-8 bg-blue-600 rounded-full mr-4"></div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Combo Deals</h2>
                    <p className="text-blue-600 text-sm font-medium">
                      {filteredItems.filter(item => item.is_combo).length} combo{filteredItems.filter(item => item.is_combo).length !== 1 ? 's' : ''} available
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                  Special Offers
                </span>
              </div>
              
              <div className="space-y-4">
                {filteredItems
                  .filter(item => item.is_combo)
                  .map((item) => (
                    <CatalogItemCard
                      key={item.menu_item_id}
                      item={item}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onAddToMenu={onAddToMenu}
                    />
                  ))}
              </div>
            </div>
          )}

          {/* Regular Items Section */}
          {filteredItems.filter(item => !item.is_combo).length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-1 h-8 bg-orange-600 rounded-full mr-4"></div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Regular Menu Items</h2>
                    <p className="text-orange-600 text-sm font-medium">
                      {filteredItems.filter(item => !item.is_combo).length} item{filteredItems.filter(item => !item.is_combo).length !== 1 ? 's' : ''} available
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-orange-100 text-orange-700 text-sm font-medium rounded-full">
                  Individual Items
                </span>
              </div>
              
              <div className="space-y-4">
                {filteredItems
                  .filter(item => !item.is_combo)
                  .map((item) => (
                    <CatalogItemCard
                      key={item.menu_item_id}
                      item={item}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onAddToMenu={onAddToMenu}
                    />
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No items found
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedCategory 
                ? 'Try adjusting your search or filter criteria.'
                : 'Start building your catalog by adding your first item.'
              }
            </p>
            <div className="flex gap-3 justify-center">
              <button className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Item
              </button>
              <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Package className="h-4 w-4 mr-2" />
                Create Your First Combo
              </button>
            </div>
          </div>
        )}

        {/* Summary Statistics */}
        {filteredItems.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Catalog Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {filteredItems.filter(item => item.is_combo).length}
                </div>
                <div className="text-sm text-gray-600 mt-1">Combo Deals</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">
                  {filteredItems.filter(item => !item.is_combo).length}
                </div>
                <div className="text-sm text-gray-600 mt-1">Regular Items</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {categories.length}
                </div>
                <div className="text-sm text-gray-600 mt-1">Categories</div>
              </div>
            </div>
          </div>
        )}
      </div>
    

  );
};

const CatalogItemCard = ({ item, onEdit, onDelete, onAddToMenu }) => {
    const [showDetails, setShowDetails] = useState(false);
    const handleAddToMenu = (catalogItem) => {
        onAddToMenu(catalogItem); // This should NOT trigger form submission
      };
  
    return (
      <div className={`bg-white rounded-lg shadow-sm border transition-all duration-200 hover:shadow-md ${
        item.is_combo ? 'border-l-4 border-l-blue-500' : 'border-l-4 border-l-orange-500'
      }`}>
        {/* Main Card - Single Line */}
        <div className="p-3">
          <div className="flex items-center justify-between">
            {/* Left Side - Item Info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Item Name and Type */}
              <div className="flex items-center gap-2 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">
                  {item.item_name}
                </h3>
                
                {item.is_combo ? (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 flex-shrink-0">
                    COMBO
                  </span>
                ) : (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 flex-shrink-0">
                    ITEM
                  </span>
                )}
              </div>
  
              {/* Category */}
              {item.category && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600 flex-shrink-0">
                  {item.category}
                </span>
              )}
  
              {/* Combo Items Quick Preview */}
              {item.is_combo && item.combo_items && (
                <div className="flex items-center gap-1 min-w-0">
                  <span className="text-sm text-blue-600 flex-shrink-0">
                    {item.combo_items.length} items:
                  </span>
                  <span className="text-sm text-gray-600 truncate">
                    {item.combo_items.slice(0, 2).map(ci => ci.item_name).join(', ')}
                    {item.combo_items.length > 2 && ` +${item.combo_items.length - 2} more`}
                  </span>
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-blue-600 hover:text-blue-800 flex-shrink-0 ml-1"
                    title={showDetails ? 'Hide details' : 'Show details'}
                  >
                    {showDetails ? '▲' : '▼'}
                  </button>
                </div>
              )}
  
              {/* Description for Regular Items */}
              {!item.is_combo && item.description && (
                <span className="text-sm text-gray-600 truncate">
                  {item.description}
                </span>
              )}
            </div>
  
            {/* Right Side - Price and Actions */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Price */}
              <div className={`text-lg font-bold ${item.is_combo ? 'text-blue-600' : 'text-orange-600'}`}>
                £{item.default_price.toFixed(2)}
              </div>
  
              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleAddToMenu(item)}
                  className={`px-3 py-1 text-white rounded text-sm font-medium transition-colors ${
                    item.is_combo 
                      ? 'bg-blue-600 hover:bg-blue-700' 
                      : 'bg-orange-600 hover:bg-orange-700'
                  }`}
                >
                  Add to Menu
                </button>
                
                <button
                  onClick={() => onEdit(item)}
                  className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Edit"
                >
                  <Edit className="h-4 w-4" />
                </button>
                
                <button
                  onClick={() => onDelete(item)}
                  className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
  
        {/* Collapsible Details */}
        {showDetails && item.is_combo && (
          <div className="border-t border-gray-100 bg-blue-50 p-3">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Combo Details:</h4>
              
              {/* Combo Items Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {item.combo_items.map((comboItem, index) => (
                  <div key={index} className="flex items-center justify-between bg-white px-2 py-1 rounded text-sm">
                    <span className="text-gray-800 truncate">
                      {comboItem.item_name}
                    </span>
                    <span className="font-medium text-blue-600 flex-shrink-0 ml-2">
                      ×{comboItem.quantity}
                    </span>
                  </div>
                ))}
              </div>
  
              {/* Additional Info */}
              {item.description && (
                <div className="pt-2 border-t border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>Description:</strong> {item.description}
                  </p>
                </div>
              )}
  
              {/* Metadata */}
              <div className="pt-2 border-t border-blue-200">
                <div className="flex items-center justify-between text-xs text-blue-700">
                  <span>ID: {item.menu_item_id}</span>
                  <span>Added: {new Date(item.created_at).toLocaleDateString('en-GB')}</span>
                </div>
              </div>
            </div>
          </div>
        )}
  
        {/* Metadata for Regular Items (always visible) */}
        {!item.is_combo && (
          <div className="px-3 pb-2">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>ID: {item.menu_item_id}</span>
              <span>Added: {new Date(item.created_at).toLocaleDateString('en-GB')}</span>
            </div>
          </div>
        )}
      </div>
    );
};

export default VerticalCatalogGrid;