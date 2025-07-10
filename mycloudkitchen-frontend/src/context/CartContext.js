import React, { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [selectedMenu, setSelectedMenu] = useState(null);

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (menuItem, quantity = 1, customization = {}) => {
    const existingItem = cartItems.find(item => 
      item.menu_id === menuItem.menu_id && 
      JSON.stringify(item.customization) === JSON.stringify(customization)
    );

    if (existingItem) {
      setCartItems(cartItems.map(item =>
        item.menu_id === menuItem.menu_id && 
        JSON.stringify(item.customization) === JSON.stringify(customization)
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      setCartItems([...cartItems, {
        ...menuItem,
        quantity,
        customization,
        cartId: Date.now() + Math.random()
      }]);
    }
  };

  const removeFromCart = (cartId) => {
    setCartItems(cartItems.filter(item => item.cartId !== cartId));
  };

  const updateQuantity = (cartId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(cartId);
    } else {
      setCartItems(cartItems.map(item =>
        item.cartId === cartId ? { ...item, quantity } : item
      ));
    }
  };

  const clearCart = () => {
    setCartItems([]);
    setSelectedMenu(null);
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      const itemPrice = calculateItemPrice(item);
      return total + (itemPrice * item.quantity);
    }, 0);
  };

  const calculateItemPrice = (item) => {
    // Calculate base price from menu items
    let total = 0;
    if (item.items && typeof item.items === 'object') {
      Object.values(item.items).forEach(categoryItems => {
        if (Array.isArray(categoryItems)) {
          categoryItems.forEach(menuItem => {
            if (menuItem.price) {
              total += parseFloat(menuItem.price);
            }
          });
        }
      });
    }
    return total;
  };

  const value = {
    cartItems,
    selectedMenu,
    setSelectedMenu,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    cartCount: cartItems.reduce((total, item) => total + item.quantity, 0)
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};