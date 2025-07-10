import React from 'react';
import { Calendar, MapPin, Star, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

const MenuCard = ({ menu }) => {
  const { addToCart } = useCart();
  const { isCaterer } = useAuth();


  const calculatePrice = () => {
    let total = 0;
    if (menu.items && typeof menu.items === 'object') {
      Object.values(menu.items).forEach(categoryItems => {
        if (Array.isArray(categoryItems)) {
          categoryItems.forEach(item => {
            if (item.price) {
              total += parseFloat(item.price);
            }
          });
        }
      });
    }
    return total;
  };

  const renderMenuItems = () => {
    if (!menu.items || typeof menu.items !== 'object') return null;
     // Group items by category
     const groupedItems = menu.items.reduce((acc, item) => {
      const category = item.category || 'Combo Deals';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {});

    return Object.entries(groupedItems).map(([category, items]) => (
      <div key={category} className="mb-4">
        <h4 className="font-medium text-gray-800 mb-2 text-lg border-b border-gray-200 pb-1">
          {category}
        </h4>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.catalog_item_id} className="bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900">{item.item_name}</h5>
                  {item.description && (
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                  )}
                  
                  {/* Show combo items details */}
                  {item.is_combo && item.combo_items && Array.isArray(item.combo_items) && (
                    <div className="mt-2 p-2 bg-white rounded border">
                      <p className="text-xs font-medium text-gray-700 mb-1">Includes:</p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {item.combo_items.map((comboItem, idx) => (
                          <li key={idx} className="flex justify-between">
                            <span>{comboItem.item_name} × {comboItem.quantity}</span>
                            <span className="text-gray-500">£{comboItem.default_price} each</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                <div className="ml-4 text-right">
                  <span className="font-bold text-lg text-green-600">£{item.price}</span>
                  {item.is_combo && (
                    <div className="text-xs text-gray-500 mt-1">Combo Deal</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ));
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold text-gray-900">{menu.name}</h3>
       
          <span className={`px-2 py-1 text-xs rounded ${
            menu.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {menu.active ? 'Active' : 'Inactive'}
          </span>
    
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-500 mt-2">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            {format(new Date(menu.menu_date), 'MMM dd, yyyy')}
          </div>
        </div>
        
        <div className="flex items-center">
          {!isCaterer && menu.active && (
            <button
              onClick={() => window.open(menu.orderlink, '_blank', 'noopener,noreferrer')}
              className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors"
            >
              Place Order
            </button>
          )}
        </div>
      </div>
      </div>

      {/* Menu Items */}
      <div className="p-4">
        {renderMenuItems()}
      </div>

      {/* Footer */}
      <div className="p-4 bg-gray-50 border-t">
        <div className="flex justify-between items-center">
        </div>
      </div>
    </div>
  );
};

export default MenuCard;