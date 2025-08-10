import React, { useState } from 'react';
import { ChevronDown, User, LogOut, Menu, X } from 'lucide-react';

const ResponsiveHeader = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);

  const toggleDropdown = (dropdown) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a className="text-2xl font-bold text-orange-600" href="/dashboard">
            Caterer Name
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-4">
            {/* Dashboard Dropdown */}
            <div className="relative group">
              <a className="text-gray-700 hover:text-orange-600 flex items-center" href="/dashboard">
                Dashboard
                <ChevronDown className="w-4 h-4 ml-1" />
              </a>
              <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <a className="block px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-600" href="/manage-reviews">
                  Manage Reviews
                </a>
                <a className="block px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-600" href="/manage-inquiry">
                  Manage Inquiries
                </a>
              </div>
            </div>

            {/* My Orders Dropdown */}
            <div className="relative group">
              <a className="text-gray-700 hover:text-orange-600 flex items-center" href="/myorders">
                My Orders
                <ChevronDown className="w-4 h-4 ml-1" />
              </a>
              <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <a className="block px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-600" href="/manage-payments">
                  Manage Payments
                </a>
                <a className="block px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-600" href="/manageorders">
                  Manage Orders
                </a>
              </div>
            </div>

            {/* Manage Menu Dropdown */}
            <div className="relative group">
              <button className="text-gray-700 hover:text-orange-600 flex items-center">
                Manage Menu
                <ChevronDown className="w-4 h-4 ml-1" />
              </button>
              <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <a className="block px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-600" href="/scheduled-menu">
                  Schedule A Menu
                </a>
                <a className="block px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-600" href="/featured-menus">
                  Featured Menus
                </a>
                <a className="block px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-600" href="/menu-catalog">
                  Menu Items Catalog
                </a>
              </div>
            </div>
          </nav>

          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="relative group">
              <button className="flex items-center space-x-2 text-gray-700 hover:text-orange-600">
                <User className="h-6 w-6" />
                <span>Mexican</span>
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <a className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" href="/profile">
                  Profile
                </a>
                <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <LogOut className="inline h-4 w-4 mr-2" />
                  Logout
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-4">
            {/* Mobile User Icon */}
            <div className="relative">
              <button 
                className="text-gray-700 hover:text-orange-600"
                onClick={() => toggleDropdown('user')}
              >
                <User className="h-6 w-6" />
              </button>
              {openDropdown === 'user' && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 border border-gray-200">
                  <div className="px-4 py-2 text-sm font-medium text-gray-900 border-b">user.name</div>
                  <a className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" href="/profile">
                    Profile
                  </a>
                  <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <LogOut className="inline h-4 w-4 mr-2" />
                    Logout
                  </button>
                </div>
              )}
            </div>

            {/* Hamburger Menu Button */}
            <button
              className="text-gray-700 hover:text-orange-600 p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 mt-4 pt-4">
            <div className="space-y-1">
              {/* Dashboard Section */}
              <div>
                <button
                  className="flex items-center justify-between w-full px-3 py-2 text-gray-700 hover:text-orange-600 hover:bg-gray-50"
                  onClick={() => toggleDropdown('dashboard')}
                >
                  Dashboard
                  <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === 'dashboard' ? 'rotate-180' : ''}`} />
                </button>
                {openDropdown === 'dashboard' && (
                  <div className="pl-6 space-y-1">
                    <a className="block px-3 py-2 text-sm text-gray-600 hover:text-orange-600 hover:bg-gray-50" href="/manage-reviews">
                      Manage Reviews
                    </a>
                    <a className="block px-3 py-2 text-sm text-gray-600 hover:text-orange-600 hover:bg-gray-50" href="/manage-inquiry">
                      Manage Inquiries
                    </a>
                  </div>
                )}
              </div>

              {/* My Orders Section */}
              <div>
                <button
                  className="flex items-center justify-between w-full px-3 py-2 text-gray-700 hover:text-orange-600 hover:bg-gray-50"
                  onClick={() => toggleDropdown('orders')}
                >
                  My Orders
                  <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === 'orders' ? 'rotate-180' : ''}`} />
                </button>
                {openDropdown === 'orders' && (
                  <div className="pl-6 space-y-1">
                    <a className="block px-3 py-2 text-sm text-gray-600 hover:text-orange-600 hover:bg-gray-50" href="/manage-payments">
                      Manage Payments
                    </a>
                    <a className="block px-3 py-2 text-sm text-gray-600 hover:text-orange-600 hover:bg-gray-50" href="/manageorders">
                      Manage Orders
                    </a>
                  </div>
                )}
              </div>

              {/* Manage Menu Section */}
              <div>
                <button
                  className="flex items-center justify-between w-full px-3 py-2 text-gray-700 hover:text-orange-600 hover:bg-gray-50"
                  onClick={() => toggleDropdown('menu')}
                >
                  Manage Menu
                  <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === 'menu' ? 'rotate-180' : ''}`} />
                </button>
                {openDropdown === 'menu' && (
                  <div className="pl-6 space-y-1">
                    <a className="block px-3 py-2 text-sm text-gray-600 hover:text-orange-600 hover:bg-gray-50" href="/scheduled-menu">
                      Schedule A Menu
                    </a>
                    <a className="block px-3 py-2 text-sm text-gray-600 hover:text-orange-600 hover:bg-gray-50" href="/featured-menus">
                      Featured Menus
                    </a>
                    <a className="block px-3 py-2 text-sm text-gray-600 hover:text-orange-600 hover:bg-gray-50" href="/menu-catalog">
                      Menu Items Catalog
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default ResponsiveHeader;