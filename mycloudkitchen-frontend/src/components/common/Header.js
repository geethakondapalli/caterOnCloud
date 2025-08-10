import React ,{ useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import ResponsiveHeader from './ResponsiveHeader';

import { ShoppingCart, User, LogOut, Menu as MenuIcon,X  } from 'lucide-react';

const Header = () => {
  return <ResponsiveHeader />;
};

export default Header;