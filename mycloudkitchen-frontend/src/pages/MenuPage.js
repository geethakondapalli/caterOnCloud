import React, { useState, useEffect } from 'react';
import { Search, Calendar, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { menuService } from '../services/menu'; // Adjust import path

const MenuPage = () => {
  const navigate = useNavigate();
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [expandedMenus, setExpandedMenus] = useState(new Set());

  // Load menus function
  const loadMenus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await menuService.getScheduledMenus({ limit: 50 });
      
      // Handle the response - data should be an array of menu objects
      console.log('API Response:', data);
      
      // Ensure data is an array and properly formatted
      if (Array.isArray(data)) {
        const formattedMenus = data.map(menu => ({
          ...menu,
          // Ensure items is always an array
          items: Array.isArray(menu.items) ? menu.items : [],
          // Ensure required fields have default values
          name: menu.name || 'Unnamed Menu',
          menu_id: menu.menu_id || `menu-${Date.now()}`,
          menu_date: menu.menu_date || new Date().toISOString().split('T')[0],
          active: menu.active !== undefined ? menu.active : true,
        }));
        setMenus(formattedMenus);
      } else {
        console.warn('API returned non-array data:', data);
        setMenus([]);
      }
      
    } catch (error) {
      console.error('Error loading menus:', error);
      setError('Failed to load menus. Please try again.');
      setMenus([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Load menus on component mount
  useEffect(() => {
    loadMenus();
  }, []);

  // Filter and sort menus
  const filteredMenus = menus
    .filter(menu => {
      if (!menu || typeof menu !== 'object') return false;
      
      const menuName = menu.name || '';
      const menuDate = menu.menu_date || '';
      
      const matchesSearch = menuName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDate = selectedDate ? menuDate === selectedDate : true;
      return matchesSearch && matchesDate;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(a.menu_date) - new Date(b.menu_date);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'newest':
        default:
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      }
    });

  // Handle navigation to Schedule Menu page
  const handleScheduleMenu = () => {
    navigate('/schedule-menu');
  };

  // Handle adding a new menu (from your ScheduledMenuPage)
  const handleAddMenu = (newMenu) => {
    setMenus(prevMenus => [...prevMenus, newMenu]);
  };

  // Handle menu selection/ordering
  const handleOrderMenu = (menuId) => {
    const menu = menus.find(m => m.menu_id === menuId);
    if (menu && menu.orderlink) {
      // Navigate to order page or handle ordering
      window.location.href = menu.orderlink;
    }
  };

  // Calculate total items and price for a menu
  const getMenuSummary = (menu) => {
    if (!menu.items || !Array.isArray(menu.items)) {
      return { totalItems: 0, totalPrice: 0 };
    }
    
    const totalItems = menu.items.length;
    const totalPrice = menu.items.reduce((sum, item) => {
      if (!item || typeof item !== 'object') return sum;
      const price = parseFloat(item.price || 0);
      return sum + (isNaN(price) ? 0 : price);
    }, 0);
    
    return { totalItems, totalPrice };
  };

  // Handle expanding/collapsing menu items
  const toggleMenuExpansion = (menuId) => {
    setExpandedMenus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(menuId)) {
        newSet.delete(menuId);
      } else {
        newSet.add(menuId);
      }
      return newSet;
    });
  };

  // Menu Card Component
  const MenuCard = ({ menu }) => {
    const { totalItems, totalPrice } = getMenuSummary(menu);
    const isExpanded = expandedMenus.has(menu.menu_id);
    
    return (
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-gray-200">
        {/* Menu Header */}
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-semibold text-gray-900 flex-1 pr-4">
              {menu.name}
            </h3>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${
              menu.active 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {menu.active ? 'Active' : 'Inactive'}
            </span>
          </div>
          
          {/* Menu Details */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center text-gray-600">
              <Calendar className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">
                {new Date(menu.menu_date).toLocaleDateString('en-GB', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span className="flex items-center">
                🍽️ {totalItems} item{totalItems !== 1 ? 's' : ''}
              </span>
              <span className="font-semibold text-orange-600">
                £{totalPrice.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Menu Items Section */}
        {menu.items && Array.isArray(menu.items) && menu.items.length > 0 && (
          <div className="border-t border-gray-200">
            <div className="bg-gray-50 px-6 py-3 flex justify-between items-center">
              <h4 className="text-sm font-semibold text-gray-900">Menu Items</h4>
              <span className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                {menu.items.length}
              </span>
            </div>
            
            <div className="divide-y divide-gray-100">
              {(isExpanded ? menu.items : menu.items.slice(0, 3)).map((item, index) => {
                // Ensure item is an object and has required properties
                if (!item || typeof item !== 'object') {
                  return null;
                }
                
                const itemName = item.item_name || 'Unknown Item';
                const itemPrice = item.price ? parseFloat(item.price) : 0;
                const itemId = item.catalog_item_id || `item-${index}`;
                const itemDescription = item.description || '';
                const itemCategory = item.category || '';
                const isCombo = item.is_combo || false;
                const comboItems = item.combo_items || [];
                
                return (
                  <div 
                    key={itemId}
                    className="px-6 py-4 hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 mr-4">
                        <h5 className="font-medium text-gray-900 mb-1">
                          {itemName}
                        </h5>
                        {itemDescription && (
                          <p className="text-sm text-gray-600 mb-2 leading-relaxed">
                            {itemDescription}
                          </p>
                        )}
                        
                        {/* Combo Items Display */}
                        {isCombo && Array.isArray(comboItems) && comboItems.length > 0 && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium uppercase">
                                Combo Items
                              </span>
                            </div>
                            <div className="space-y-2">
                              {comboItems.map((comboItem, comboIndex) => {
                                const comboName = typeof comboItem === 'string' ? comboItem : (comboItem?.name || comboItem?.item_name || `Combo ${comboIndex + 1}`);
                                const comboPrice = typeof comboItem === 'object' ? parseFloat(comboItem?.price || 0) : 0;
                                
                                return (
                                  <div key={`combo-${comboIndex}`} className="flex justify-between items-center text-sm">
                                    <span className="text-blue-700 font-medium">
                                      • {comboName}
                                    </span>
                                    {comboPrice > 0 && (
                                      <span className="text-blue-600 font-medium">
                                        £{comboPrice.toFixed(2)}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        
                        {/* Combo indicator when combo_items is null/empty */}
                        {isCombo && (!comboItems || comboItems.length === 0) && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                            <div className="flex items-center gap-2">
                              <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium uppercase">
                                Combo Item
                              </span>
                              <span className="text-sm text-blue-700">
                                Combo details available at checkout
                              </span>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2">
                          {itemCategory && (
                            <span className="inline-block bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs font-medium capitalize">
                              {itemCategory}
                            </span>
                          )}
                          {isCombo && (
                            <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium uppercase">
                              Combo
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right min-w-[80px]">
                        <div className="text-lg font-bold text-orange-600">
                          £{itemPrice.toFixed(2)}
                        </div>
                        {isCombo && Array.isArray(comboItems) && comboItems.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            {comboItems.length} item{comboItems.length !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {menu.items.length > 3 && (
              <button
                onClick={() => toggleMenuExpansion(menu.menu_id)}
                className="w-full px-6 py-3 bg-gray-50 hover:bg-gray-100 transition-colors duration-200 border-t border-gray-200 text-orange-600 font-medium text-sm flex items-center justify-center gap-2"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Show All {menu.items.length} Items
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Menu Actions */}
        <div className="p-6 pt-4">
            <button 
            onClick={() => handleOrderMenu(menu.menu_id)}
            disabled={!menu.active}
            className={`w-full py-3 px-4 rounded-md font-semibold text-sm transition-all duration-200 ${
              menu.active
                ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {menu.active ? 'Order Now' : 'Not Available'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Menus</h1>
              <p className="text-gray-600">Find the scheduled menu from the caterers</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search menus..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            {/* Date Filter */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="newest">Newest First</option>
              <option value="date">Menu Date</option>
              <option value="name">Name A-Z</option>
            </select>

            {/* Clear Filters */}
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedDate('');
                setSortBy('newest');
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="mb-4">
          <p className="text-gray-600">
            {loading ? 'Loading...' : `${filteredMenus.length} menu${filteredMenus.length !== 1 ? 's' : ''} found`}
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error loading menus
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={loadMenus}
                    className="bg-red-100 px-3 py-1.5 rounded-md text-sm font-medium text-red-800 hover:bg-red-200 transition-colors duration-200"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Menu Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md h-96 animate-pulse">
                <div className="h-32 bg-gray-200 rounded-t-lg"></div>
                <div className="p-6">
                  <div className="h-6 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4 w-3/4"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredMenus.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMenus.map(menu => (
              <MenuCard key={menu.menu_id} menu={menu} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4">
              <Search className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No menus found</h3>
            <p className="text-gray-600 mb-4">
              {menus.length === 0 
                ? "No scheduled menus available at the moment." 
                : "Try adjusting your search criteria or check back later for new menus."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {menus.length === 0 && (
                <button
                  onClick={handleScheduleMenu}
                  className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  <Plus className="h-4 w-4" />
                  Schedule Your First Menu
                </button>
              )}
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedDate('');
                  setSortBy('newest');
                }}
                className="text-orange-600 hover:text-orange-700 font-medium transition-colors duration-200"
              >
                Clear all filters
              </button>
            </div>
          </div>
        )}


        {/* Debug Info (remove in production) */}
         {process.env.NODE_ENV === 'development' && (
          <div className="mt-12 bg-gray-100 rounded-lg p-6">
            <details>
              <summary className="cursor-pointer font-medium text-gray-700 mb-4">
                Debug Info (Dev Only)
              </summary>
              <pre className="bg-white p-4 rounded border text-xs overflow-x-auto">
                {JSON.stringify({ 
                  totalMenus: menus.length, 
                  filteredMenus: filteredMenus.length,
                  searchTerm,
                  selectedDate,
                  sortBy,
                  loading,
                  error 
                }, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuPage;