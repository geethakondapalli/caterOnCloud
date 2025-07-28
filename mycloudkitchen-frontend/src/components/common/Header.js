import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { ShoppingCart, User, LogOut, Menu as MenuIcon } from 'lucide-react';

const Header = () => {
  const { user, logout, isAuthenticated, isCaterer } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/dashboard" className="text-2xl font-bold text-orange-600">
            Caterer Name  
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            
            {isCaterer && isAuthenticated && (
              <div className="relative group">
                <Link to="/dashboard" className="text-gray-700 hover:text-orange-600 flex items-center">
                    Dashboard
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </Link>
                <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <Link 
                    to="/manage-reviews" 
                    className="block px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-600"
                  >
                    Manage Reviews
                  </Link>
                  <Link 
                    to="/manage-inquiry" 
                    className="block px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-600"
                  >
                    Manage Inquiries
                  </Link>
                </div>
              </div>
            )}

            {isAuthenticated && isCaterer && (
              <div className="relative group">
                <Link to="/myorders" className="text-gray-700 hover:text-orange-600 flex items-center">
                    My Orders
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </Link>
                <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <Link 
                    to="/manage-payments" 
                    className="block px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-600"
                  >
                    Manage Payments
                  </Link>
                  <Link 
                    to="/manageorders" 
                    className="block px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-600"
                  >
                    Manage Orders
                  </Link>
                </div>
              </div>
            )}

            {isCaterer && isAuthenticated && (
              <div className="relative group">
                <button className="text-gray-700 hover:text-orange-600 flex items-center">
                  Manage Menu
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  
                  <Link 
                    to="/scheduled-menu" 
                    className="block px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-600"
                  >
                    Schedule A  Menu
                  </Link>
                  <Link 
                    to="/featured-menus" 
                    className="block px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-600"
                  >
                    Featured Menus 
                  </Link>
                  <Link 
                    to="/menu-catalog" 
                    className="block px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-600"
                  >
                    Menu Items Catalog
                  </Link>

                </div>
              </div>
            )}
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Cart */}
            {!isCaterer && (
              <Link to="/cart" className="relative">
                <ShoppingCart className="h-6 w-6 text-gray-700 hover:text-orange-600" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-orange-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}

            {/* User menu */}
            {isAuthenticated && (
              <div className="relative group">
                <button className="flex items-center space-x-2 text-gray-700 hover:text-orange-600">
                  <User className="h-6 w-6" />
                  <span className="hidden md:block">{user?.name}</span>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <LogOut className="inline h-4 w-4 mr-2" />
                    Logout
                  </button>
                </div>
              </div>
            ) 
            }
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;