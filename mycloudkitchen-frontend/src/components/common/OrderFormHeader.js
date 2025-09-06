import React from 'react';
import { useParams,Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';

const OrderFormHeader = () => {

  const { menuId } = useParams();


  return (
    <header className="bg-white shadow-md border-b border-gray-200">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex items-center justify-between h-16">
      
      {/* Left Section - Back Navigation */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => window.location.href = '/'}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          <span className="hidden sm:inline">Back</span>
        </button>
        
        <div className="h-6 border-l border-gray-300"></div>
        
        <button
          onClick={() => window.location.href = '/'}
          className="text-2xl font-bold text-orange-600"
        >
          Caterer Name {/* Replace with actual caterer name */}
        </button>
      </div>

      {/* Center Section - Order Info (Desktop only) */}
      <div className="hidden md:flex items-center space-x-6">
        <div className="flex items-center text-gray-600">
          <Link to="/browsemenu" className="text-gray-700 hover:text-orange-600">
            Browse Menus
          </Link>
        </div>
        
        <div className="flex items-center text-gray-600">
        </div>
      </div>

      {/* Right Section - Order Status */}
      <div className="flex items-center space-x-4">
        {/* Mobile Browse Menus - visible only on mobile */}
        <div className="md:hidden">
          <Link to="/browsemenu" className="text-gray-700 hover:text-orange-600 text-sm font-medium">
            Browse Menus
          </Link>
        </div>
        
        {/* Mobile menu button or additional actions */}
        <div className="flex items-center space-x-2">
        </div>
      </div>
    </div>

    {/* Mobile Order Info */}
    <div className="md:hidden pb-3 border-t border-gray-100 pt-3">
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center">
          <Calendar className="w-4 h-4 mr-2" />
          <span>Menu: {menuId}</span>
        </div>
        <div className="flex items-center">
          <Clock className="w-4 h-4 mr-2" />
          <span>Order in Progress</span>
        </div>
      </div>
    </div>
  </div>
</header>
  );
};

export default OrderFormHeader;