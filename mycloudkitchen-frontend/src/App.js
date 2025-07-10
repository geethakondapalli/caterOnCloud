// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route ,useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import OrderFormHeader from './components/common/OrderFormHeader';
import ProtectedRoute from './components/common/ProtectedRoute';
import MenuCatalogPage from './pages/MenuCatalogPage';
import ConnectionTest from './components/common/ConnectionTest';

// Pages
import HomePage from './pages/HomePage';
import IntroPage from './pages/IntroPage';
import LoginPage from './components/auth/Login';
import RegisterPage from './components/auth/Register';
import DashboardPage from './pages/DashboardPage';
import MenuPage from './pages/MenuPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import ProfilePage from './components/auth/Profile';
import ScheduledMenuPage from './pages/ScheduledMenuPage';
import MenuOrderForm from './pages/OrderPage';
import ManageOrdersPage from './pages/ManageOrdersPage';
import FeaturedMenus from './pages/FeaturedMenus';
import ManagePayments from './pages/ManagePayments';
import MyOrdersPage from './pages/MyOrdersPage';

// Component to handle conditional header rendering
const ConditionalHeader = () => {
  const location = useLocation();
  
  // Check if current path is an order page
  // Adjust the condition based on your routing structure 
  const isOrderPageHeader = location.pathname.startsWith('/order/') || location.pathname.startsWith('/browsemenu') || 
                              location.pathname.startsWith('/home') || location.pathname.startsWith('/intro')||location.pathname === '/'
                              || location.pathname.startsWith('/login');
  // Render appropriate header based on route
  return isOrderPageHeader ? <OrderFormHeader /> : <Header />;
};

function App() {

  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="min-h-screen flex flex-col">
          <ConditionalHeader />
            <main className="flex-1">
              <Routes>
                {/* Public routes */}
                <Route path="/home" element={<HomePage />} />
                <Route path="/intro" element={<IntroPage />} />
                <Route path="/" element={<IntroPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/browsemenu" element={<MenuPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/order/:menuId" element={<MenuOrderForm/>}  />

                {/* Protected routes for caterers */}
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/manageorders" element={<ProtectedRoute><ManageOrdersPage /></ProtectedRoute>} />
                <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute requiredRole="caterer"><DashboardPage /></ProtectedRoute>} />
                <Route path="/menu-catalog" element={<ProtectedRoute requiredRole="caterer"><MenuCatalogPage /></ProtectedRoute>} />
                <Route path="/scheduled-menu" element={<ProtectedRoute requiredRole="caterer"><ScheduledMenuPage /></ProtectedRoute>} />
                <Route path="/featured-menus" element={<ProtectedRoute requiredRole="caterer"><FeaturedMenus /></ProtectedRoute>} />
                <Route path="/myorders" element={<ProtectedRoute requiredRole="caterer"><MyOrdersPage /></ProtectedRoute>} />
                <Route path="/manage-payments" element={<ProtectedRoute requiredRole="caterer"><ManagePayments /></ProtectedRoute>} />
                

              </Routes>
            </main>
            <Footer />
          </div>
          <Toaster position="top-right" />
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;