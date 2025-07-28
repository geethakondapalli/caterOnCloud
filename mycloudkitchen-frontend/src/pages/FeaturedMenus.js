import React, { useState, useEffect } from 'react';
import MenuCard from '../components/menu/MenuCard'; // Adjust the import path as needed
import { menuService } from '../services/menu'; // Adjust the import path as needed
import { Star} from 'lucide-react';

const FeaturedMenus = () => {
  const [featuredMenus, setFeaturedMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAllMenus, setShowAllMenus] = useState(false);
  const [allMenus, setAllMenus] = useState([]);
  const [showingActiveMenus, setShowingActiveMenus] = useState(true); // Track which type is shown

  useEffect(() => {
    const fetchFeaturedMenus = async () => {
      setLoading(true);
      try {
        const params = {
          active: true,
          limit: 6,
          sort: 'menu_date',
          order: 'desc'
        };
        
        const data = await menuService.getScheduledMenus(params);
        console.log('Fetched data:', data);
        
        if (data) {
          const menus = data.results || data.menus || data || [];
          console.log('Processed menus:', menus);
          setFeaturedMenus(menus);
        }
      } catch (err) {
        console.error('Error fetching featured menus:', err);
        setError('Failed to load featured menus');
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedMenus();
  }, []);

  const handleViewAllMenus = async () => {
    try {
      const fetchedMenus = await menuService.getScheduledInactiveMenus();
      setAllMenus(fetchedMenus);
      setShowAllMenus(true);
      setShowingActiveMenus(false); // Now showing inactive menus
    } catch (error) {
      console.error('Failed to fetch menus:', error);
    }
  };

  const handleViewActiveMenus = async () => {
    try {
      // Fetch all active menus (not just featured/limited ones)
      const params = {
        active: true,
        sort: 'menu_date',
        order: 'desc'
      };
      const fetchedMenus = await menuService.getScheduledMenus(params);
      const menus = fetchedMenus.results || fetchedMenus.menus || fetchedMenus || [];
      setAllMenus(menus);
      setShowAllMenus(true);
      setShowingActiveMenus(true); // Now showing active menus
    } catch (error) {
      console.error('Failed to fetch active menus:', error);
    }
  };

  const handleBackToFeatured = () => {
    setShowAllMenus(false);
    setShowingActiveMenus(true);
  };

  if (loading) {
    return (
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading featured menus...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Star className="h-8 w-8 text-orange-600 mr-2" />
            <h2 className="text-3xl font-bold text-gray-900">
              {showAllMenus 
                ? (showingActiveMenus ? 'All Active Menus' : 'All Inactive Menus')
                : 'Featured Menus'
              }
            </h2>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {showAllMenus 
              ? (showingActiveMenus 
                  ? 'Browse all available active menus' 
                  : 'Browse all inactive menus')
              : 'Discover our most popular and trending menu selections, carefully crafted by our expert chefs'
            }
          </p>
          <div className="text-center mt-12">
          {!showAllMenus ? (
            // Show when displaying featured menus
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleViewActiveMenus}
                className="bg-orange-600 text-white px-8 py-3 rounded-lg hover:bg-orange-700 transition-colors font-medium"
              >
                View All Active Menus
              </button>
              <button
                onClick={handleViewAllMenus}
                className="bg-gray-600 text-white px-8 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                View Inactive Menus
              </button>
            </div>
          ) : (
            // Show when displaying all menus
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleBackToFeatured}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Back to Featured
              </button>
              {showingActiveMenus ? (
                <button
                  onClick={handleViewAllMenus}
                  className="bg-gray-600 text-white px-8 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  View Inactive Menus
                </button>
              ) : (
                <button
                  onClick={handleViewActiveMenus}
                  className="bg-orange-600 text-white px-8 py-3 rounded-lg hover:bg-orange-700 transition-colors font-medium"
                >
                  View Active Menus
                </button>
              )}
            </div>
          )}
        </div>
        </div>

        {/* Featured Menus Grid */}
        {featuredMenus && featuredMenus.length > 0 && !showAllMenus && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredMenus.map((menu, index) => (
              <div key={menu.id || `featured-${index}`} className="transform hover:scale-105 transition-transform duration-200">
                <MenuCard menu={menu} />
              </div>
            ))}
          </div>
        )}

        {/* All Menus Grid */}
        {showAllMenus && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {allMenus.map((menu, index) => (
              <div key={menu.id || `all-${index}`} className="transform hover:scale-105 transition-transform duration-200">
                <MenuCard menu={menu} />
              </div>
            ))}
          </div>
        )}

        {/* No menus message */}
        {featuredMenus.length === 0 && !showAllMenus && (
          <div className="text-center py-8">
            <p className="text-gray-500">No featured menus available at the moment.</p>
          </div>
        )}

        {/* Action Buttons */}
       
      </div>
    </section>
  );
};
export default FeaturedMenus;