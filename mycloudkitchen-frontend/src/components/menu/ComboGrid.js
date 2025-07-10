import React, { useState } from 'react';
import { Package, Edit, Trash2, Users, Clock, Star } from 'lucide-react';

const ComboGrid = ({ combos, onEdit, onDelete}) => {
  if (!combos || combos.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Package className="h-6 w-6 text-blue-600 mr-3" />
          <h2 className="text-2xl font-bold text-gray-900">
            Combo Deals
          </h2>
          <span className="ml-3 px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
            {combos.length} {combos.length === 1 ? 'combo' : 'combos'}
          </span>
          <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
            Special Offers
          </span>
        </div>
      </div>

      {/* Combo Items Horizontal Scroll */}
      <div className="relative">
        <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
          {combos.map((combo) => (
            <div key={combo.combo_id} className="flex-none w-80">
              <ComboCard 
                combo={combo} onEdit={onEdit} onDelete={onDelete}
              />
            </div>
          ))}
        </div>
        
        {/* Scroll indicators */}
        {combos.length > 3 && (
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-gradient-to-l from-gray-50 via-gray-50 to-transparent w-12 h-full pointer-events-none" />
        )}
      </div>
      
      {/* Add scrollbar styling */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

  const ComboCard = ({ combo, onEdit, onDelete }) => {
    const [showDetails, setShowDetails] = useState(false);

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    };

  const calculateTotalValue = () => {
    return combo.combo_items.reduce((total, item) => {
      return total + (parseFloat(item.default_price) * item.quantity);
    }, 0);
  };

  const calculateSavings = () => {
    const totalValue = calculateTotalValue();
    const comboPrice = parseFloat(combo.combo_default_price);
    return totalValue - comboPrice;
  };

  const savings = calculateSavings();

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border-l-4 border-blue-500 overflow-hidden h-full">
      {/* Card Header */}
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center mb-2">
              <h3 className="text-lg font-bold text-gray-900 mr-2 truncate">
                {combo.combo_name}
              </h3>
              <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded-full flex-shrink-0">
                COMBO
              </span>
            </div>
            {combo.combo_description && (
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {combo.combo_description}
              </p>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex space-x-1 ml-2 flex-shrink-0">
            <button
              onClick={() => onEdit(combo)}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              title="Edit combo"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(combo)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              title="Delete combo"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Price Section */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xl font-bold text-blue-600">
                £{parseFloat(combo.combo_default_price).toFixed(2)}
              </span>
              {savings > 0 && (
                <div className="flex items-center mt-1">
                  <span className="text-sm text-gray-500 line-through mr-2">
                    £{calculateTotalValue().toFixed(2)}
                  </span>
                  <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full">
                    Save £{savings.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="flex items-center text-sm text-gray-500 mb-1">
                <Users className="h-4 w-4 mr-1" />
                {combo.item_count} items
              </div>
              {combo.combo_category && (
                <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                  {combo.combo_category}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Combo Items Quick Preview */}
        <div className="mb-4">
          <div className="space-y-1.5">
            {combo.combo_items.slice(0, 2).map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-gray-700 truncate">
                  {item.item_name}
                </span>
                <span className="text-blue-600 font-medium flex-shrink-0">
                  ×{item.quantity}
                </span>
              </div>
            ))}
            {combo.combo_items.length > 2 && (
              <div className="text-sm text-gray-500">
                +{combo.combo_items.length - 2} more items...
              </div>
            )}
          </div>
        </div>

        {/* Expandable Details Button */}
        <div className="mb-4">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full text-left"
          >
            <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <span className="text-sm font-medium text-gray-700">
                {showDetails ? 'Hide details' : 'View all items'}
              </span>
              <div className={`transform transition-transform text-blue-600 ${showDetails ? 'rotate-180' : ''}`}>
                ▼
              </div>
            </div>
          </button>
        </div>

        {/* Expandable Combo Items Details */}
        {showDetails && (
          <div className="space-y-2 mb-4">
            {combo.combo_items.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-2.5 bg-blue-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 text-sm truncate">
                    {item.item_name}
                  </div>
                  <div className="text-xs text-gray-500">
                    £{parseFloat(item.default_price).toFixed(2)} each
                  </div>
                </div>
                <div className="flex-shrink-0 ml-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full">
                    {item.quantity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Info */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {formatDate(combo.created_at)}
          </div>
          <div>
            ID: {combo.combo_id}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComboGrid;