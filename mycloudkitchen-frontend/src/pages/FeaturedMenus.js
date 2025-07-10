import React, { useState, useEffect } from 'react';
import MenuCard from '../components/menu/MenuCard'; // Adjust the import path as needed
import { menuService } from '../services/menu'; // Adjust the import path as needed
import { Star, TrendingUp } from 'lucide-react';

const FeaturedMenus = () => {
  const [featuredMenus, setFeaturedMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFeaturedMenus = async () => {
      try {
        setLoading(true);
        // Fetch scheduled menus and limit to featured ones (e.g., first 6 active menus)
        const params = {
          active: true,
          limit: 6,
          sort: 'menu_date',
          order: 'desc'
        };
        
        const data = await menuService.getScheduledMenus(params);
        setFeaturedMenus(data.menus || data || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching featured menus:', err);
        setError('Failed to load featured menus');
        setLoading(false);
      }
    };

    fetchFeaturedMenus();
  }, []);

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
            <h2 className="text-3xl font-bold text-gray-900">Featured Menus</h2>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover our most popular and trending menu selections, carefully crafted by our expert chefs
          </p>
        </div>

        {/* Featured Badge */}
        <div className="flex items-center justify-center mb-8">
          <div className="bg-orange-100 text-orange-800 px-4 py-2 rounded-full flex items-center">
            <TrendingUp className="h-4 w-4 mr-2" />
            <span className="font-medium">Trending This Week</span>
          </div>
        </div>

        {/* Menu Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredMenus.map((menu) => (
            <div key={menu.id} className="transform hover:scale-105 transition-transform duration-200">
              <MenuCard menu={menu} />
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <button className="bg-orange-600 text-white px-8 py-3 rounded-lg hover:bg-orange-700 transition-colors font-medium">
            View All Menus
          </button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedMenus;