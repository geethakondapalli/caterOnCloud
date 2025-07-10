import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { menuService } from '../services/menu';
import MenuCard from '../components/menu/MenuCard';
import { Search, ChefHat, Clock, Star, ArrowRight, Users, Award, Truck } from 'lucide-react';

const HomePage = () => {
  const { isAuthenticated, isCaterer, user } = useAuth();
  const [featuredMenus, setFeaturedMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [stats] = useState({
    totalCaterers: 150,
    totalOrders: 2500,
    happyCustomers: 1200
  });

  useEffect(() => {
    loadFeaturedMenus();
  }, []);

  const loadFeaturedMenus = async () => {
    try {
      const menus = await menuService.getScheduledMenus({ limit: 3})
      setFeaturedMenus(menus);
    } catch (error) {
      console.error('Failed to load featured menus:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-orange-500 to-red-500 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative container mx-auto px-4 py-2 lg:py-4">
          <div className="max-w-lg">
            <h1 className="text-xl md:text-xl font-bold mb-1 leading-tight">
              Delicious Meals,<br />
              <span className="text-yellow-300">Delivered Fresh</span>
            </h1>
            <p className="text-sm md:text-base mb-2 opacity-90 max-w-md">
              We are passionate local caterers. Enjoy restaurant-quality meals prepared with love and delivered to your door.
            </p>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-10 right-10 opacity-20">
          <ChefHat className="h-32 w-32" />
        </div>
      </section>

      <section className="py-4 bg-gray-50">
      <div className="container mx-auto px-4">
        <div 
          className="flex items-center justify-between cursor-pointer py-3 border-b border-gray-200"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div>
            <h2 className="text-xl font-semibold text-gray-900">How It Works</h2>
            {!isExpanded && (
              <p className="text-sm text-gray-500">Three simple steps to get your meal</p>
            )}
          </div>
          <svg 
            className={`w-5 h-5 transform transition-transform duration-200 text-gray-400 ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M19 9l-7 7-7-7" 
            />
          </svg>
        </div>

        {isExpanded && (
          <div className="py-6 space-y-4">
            <div className="flex items-start space-x-4 p-4 bg-white rounded-lg">
              <div className="bg-orange-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Browse & Choose</h3>
                <p className="text-gray-600 text-sm">Explore menus from local caterers and choose your favorite dishes.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4 bg-white rounded-lg">
              <div className="bg-orange-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Order & Pay</h3>
                <p className="text-gray-600 text-sm">Place your order with delivery details and pay securely.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4 bg-white rounded-lg">
              <div className="bg-orange-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Enjoy</h3>
                <p className="text-gray-600 text-sm">Receive your freshly prepared meal and enjoy at home.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>

      {/* Featured Menus Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-2">
                Featured Menus
              </h2>
              <p className="text-xl text-gray-600">
                Discover today's most popular dishes
              </p>
            </div>
            <Link
              to="/menu"
              className="hidden md:inline-flex items-center text-orange-600 hover:text-orange-700 font-semibold text-lg"
            >
              View All Menus
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="bg-gray-200 rounded-lg h-80 animate-pulse"></div>
              ))}
            </div>
          ) : featuredMenus.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {featuredMenus.map(menu => (
                  <MenuCard key={menu.menu_id} menu={menu} />
                ))}
              </div>
              
              <div className="text-center mt-12 md:hidden">
                <Link
                  to="/browsemenu"
                  className="inline-flex items-center px-6 py-3 border border-orange-600 text-orange-600 font-semibold rounded-lg hover:bg-orange-50"
                >
                  View All Menus
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <ChefHat className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No menus available</h3>
              <p className="text-gray-600">Check back soon for delicious new offerings!</p>
            </div>
          )}
        </div>
      </section>

      
    </div>
  );
};

export default HomePage;