import React, { useState, useEffect, act } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { menuService } from '../services/menu';
import { orderService } from '../services/orders';
import MenuForm from '../components/menu/MenuForm';
import OrderCard from '../components/orders/OrderCard';
import { Plus, Calendar, Package, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { set } from 'date-fns';

const DashboardPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('menus');
  const [menus, setMenus] = useState([]);
  const [orders, setOrders] = useState([]);
  const [showMenuForm, setShowMenuForm] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [menusData, ordersData] = await Promise.all([
        menuService.getScheduledMenus(),
        orderService.getOrders()
      ]);

      setMenus(menusData);
      setOrders(ordersData);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMenu = async (menuData) => {
    try {
      await menuService.createMenuItem(menuData);
      setShowMenuForm(false);
      loadDashboardData();
    } catch (error) {
      throw error;
    }
  };

  const handleUpdateMenu = async (menuData) => {
    try {
      await menuService.updateMenuItem(editingMenu.menu_id, menuData);
      setEditingMenu(null);
      setShowMenuForm(false);
      loadDashboardData();
    } catch (error) {
      throw error;
    }
  };

  const handleOrderStatusUpdate = async (orderId, newStatus) => {
    try {
      await orderService.updateOrderStatus(orderId, { status: newStatus });
      setOrders(orders.map(order => 
        order.order_id === orderId 
          ? { ...order, status: newStatus }
          : order
      ));
      toast.success('Order status updated');
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const getStats = () => {
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const totalRevenue = orders
      .filter(o => o.payment_status === 'completed')
      .reduce((sum, o) => sum + parseFloat(o.total), 0);
    const activeMenus = menus.filter(m => m.active).length;

    return { totalOrders, pendingOrders, totalRevenue, activeMenus };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600"></div>
      </div>
    );
  }


  

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
          <p className="text-gray-600 mt-2">Manage your kitchen and track your orders</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-gray-900">£{stats.totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Plus className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Menus</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeMenus}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'menus', label: 'Menus' }
                /*{ id: 'overview', label: 'Overview' },
                { id: 'orders', label: 'Orders' }*/
                
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {orders.slice(0, 5).map(order => (
                    <div key={order.order_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">Order #{order.order_id}</p>
                        <p className="text-sm text-gray-600">{order.customer_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">£{parseFloat(order.total).toFixed(2)}</p>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Manage Orders</h3>
                </div>
                
                <div className="space-y-4">
                  {orders.map(order => (
                    <OrderCard
                      key={order.order_id}
                      order={order}
                      onStatusUpdate={handleOrderStatusUpdate}
                      userRole="caterer"
                    />
                  ))}
                  
                  {orders.length === 0 && (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No orders yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Menus Tab */}
            {activeTab === 'menus' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Manage Menus</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {menus.map(menu => {
                  // Calculate order statistics for this menu
                  const menuOrders = orders.filter(order => 
                    order.menu_id === menu.menu_id &&
                    order.menu_date === menu.menu_date && 
                    order.status !== 'cancelled'
        
                  );
                  console.log(`Menu ${menu.menu_id} has ${menuOrders.length} orders`);                
                  const totalOrders = menuOrders.length;
                  const totalRevenue = menuOrders.reduce((sum, order) => sum + parseFloat(order.total || 0), 0);
                  
  // Calculate individual item portions needed for preparation (including combo breakdowns)
  const calculateItemPortions = () => {
    const itemPortions = {};
    
    // Count from actual orders to get preparation quantities
    menuOrders.forEach(order => {
      if (!order.items) return;
      
      let orderItems = [];
      if (typeof order.items === 'string') {
        try {
          const parsed = JSON.parse(order.items);
          orderItems = Object.values(parsed);
        } catch (e) {
          console.error('Error parsing order items:', e, order.items);
          return;
        }
      } else if (typeof order.items === 'object') {
        orderItems = Object.values(order.items);
      }
      console.log(`Processing order ${order.order_id} with items:`, orderItems);
      
      orderItems.forEach(orderItem => {
        const orderedQuantity = orderItem.quantity || orderItem.quantit || 1;
        
        if (orderItem.is_combo && orderItem.combo_items && Array.isArray(orderItem.combo_items)) {
          // This is a combo order - break it down to individual items
          orderItem.combo_items.forEach(comboItem => {
            // Try multiple fields for item name
            const itemName = comboItem.item_name || 
                             comboItem.name || 
                             comboItem.title ||
                             comboItem.description ||
                             `Item ${comboItem.menu_item_id || comboItem.catalog_item_id || 'Unknown'}`;
            
            const comboItemQuantity = comboItem.quantity || 1;
            const totalNeeded = orderedQuantity * comboItemQuantity;
            
            // Clean the item name (remove extra quotes, trim whitespace)
            const cleanItemName = itemName.replace(/['"]/g, '').trim();
            
            console.log(`Combo breakdown - Order: ${orderItem.item_name}, Contains: ${cleanItemName} x${comboItemQuantity}, Ordered: ${orderedQuantity}, Total needed: ${totalNeeded}`);
            
            if (cleanItemName && cleanItemName !== 'Item Unknown') {
              itemPortions[cleanItemName] = (itemPortions[cleanItemName] || 0) + totalNeeded;
            }
          });
        } else {
          // Direct item order (not a combo)
          const itemName = orderItem.item_name || 
                           orderItem.name || 
                           orderItem.title ||
                           orderItem.description ||
                           `Item ${orderItem.catalog_item_id || 'Unknown'}`;
          
          // Clean the item name
          const cleanItemName = itemName.replace(/['"]/g, '').trim();
          
          console.log(`Direct order - Item: ${cleanItemName}, Quantity: ${orderedQuantity}`);
          
          if (cleanItemName && cleanItemName !== 'Item Unknown') {
            itemPortions[cleanItemName] = (itemPortions[cleanItemName] || 0) + orderedQuantity;
          }
        }
      });
    });
    
    console.log('=== CHEF PREPARATION SUMMARY ===');
    console.log('Menu Orders Count:', menuOrders.length);
    console.log('Final Item Portions:', itemPortions);
    console.log('Items Found:', Object.keys(itemPortions));
    console.log('================================');
    
    return itemPortions;
  };

  const itemPortions = calculateItemPortions();
  const totalPortionsNeeded = Object.values(itemPortions).reduce((sum, count) => sum + count, 0);
  const uniqueItemsCount = Object.keys(itemPortions).length;

  // Calculate total items ordered from this menu (for order statistics)
  const totalItemsOrdered = menuOrders.reduce((sum, order) => {
    if (!order.items) return sum;
    
    let itemCount = 0;
    if (typeof order.items === 'string') {
      try {
        const parsed = JSON.parse(order.items);
        itemCount = Object.values(parsed).reduce((count, item) => {
          return count + (item.quantity || item.quantit || 1);
        }, 0);
      } catch (e) {
        itemCount = 1;
      }
    } else if (typeof order.items === 'object') {
      itemCount = Object.values(order.items).reduce((count, item) => {
        if (typeof item === 'object' && (item.quantity || item.quantit)) {
          return count + (item.quantity || item.quantit);
        }
        return count + 1;
      }, 0);
    }
    
    return sum + itemCount;
  }, 0);

  return (
    <div key={menu.menu_id} className="bg-white border rounded-lg p-4">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-gray-900">{menu.name}</h4>
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          menu.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {menu.active ? 'Active' : 'Inactive'}
        </span>
      </div>
      
      <p className="text-sm text-gray-600 mb-3">
        Date: {new Date(menu.menu_date).toLocaleDateString()}
      </p>

      {/* Chef's Preparation Guide */}
      {totalOrders > 0 && Object.keys(itemPortions).length > 0 && (
        <div className="bg-green-50 rounded-lg p-3 mb-3">
          <h5 className="text-sm font-medium text-green-700 mb-2 flex items-center">
            🍳 Chef's Preparation Guide
          </h5>
          <div className="grid grid-cols-2 gap-3 text-center mb-3">
            <div className="bg-white rounded p-2">
              <div className="text-lg font-bold text-green-600">{uniqueItemsCount}</div>
              <div className="text-xs text-gray-600">Unique Items</div>
            </div>
            <div className="bg-white rounded p-2">
              <div className="text-lg font-bold text-green-700">{totalPortionsNeeded}</div>
              <div className="text-xs text-gray-600">Total Portions</div>
            </div>
          </div>
          
          {/* Individual Item Breakdown */}
          <div className="space-y-1 max-h-32 overflow-y-auto">
            <div className="text-xs font-medium text-green-700 border-b border-green-200 pb-1 mb-2">
              Items to Prepare:
            </div>
            {Object.entries(itemPortions)
              .sort(([,a], [,b]) => b - a) // Sort by quantity needed (highest first)
              .map(([itemName, count]) => (
                <div key={itemName} className="flex justify-between items-center bg-white rounded p-2">
                  <span className="text-sm text-gray-800 font-medium">{itemName}</span>
                  <span className="text-sm font-bold text-green-600 bg-green-100 px-2 py-1 rounded">
                    {count} portions
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Order Statistics */}
      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <h5 className="text-sm font-medium text-gray-700 mb-2">Order Statistics</h5>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-white rounded p-2">
            <div className="text-lg font-bold text-gray-900">{totalOrders}</div>
            <div className="text-xs text-gray-600">Total Orders</div>
          </div>
          <div className="bg-white rounded p-2">
            <div className="text-lg font-bold text-green-600">£{totalRevenue.toFixed(2)}</div>
            <div className="text-xs text-gray-600">Revenue</div>
          </div>
        </div>
        
        {/* Recent Order Status */}
        {totalOrders > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Recent Orders:</span>
              <span>
                {menuOrders.filter(o => o.status === 'pending').length} pending, 
                {menuOrders.filter(o => o.status === 'delivered').length} delivered
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex space-x-2">
        <button
          onClick={() => {
            setEditingMenu(menu);
            setShowMenuForm(true);
          }}
          className="text-sm text-orange-600 hover:text-orange-700"
        >
          Edit
        </button>
        <button
          onClick={async () => {
            try {
              const status = !menu.active;
              await menuService.updateScheduledMenuStatus(menu.menu_id, {active:status});
              loadDashboardData();
              toast.success(`Menu ${menu.active ? 'deactivated' : 'activated'}`);
            } catch (error) {
              toast.error('Failed to update menu');
            }
          }}
          className="text-sm text-gray-600 hover:text-gray-700"
        >
          {menu.active ? 'Deactivate' : 'Activate'}
        </button>
        
        {/* View Orders Button */}
        {totalOrders > 0 && (
          <button
            onClick={ () => navigate('/myorders?menudate=' + menu.menu_date)
            }
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            View Orders ({totalOrders})
          </button>
        )}
      </div>
    </div>
  );
})}
                </div>

                {menus.length === 0 && (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No menus created yet</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;