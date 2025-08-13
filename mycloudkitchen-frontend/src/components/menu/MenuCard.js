import { React , useState, useEffect} from 'react';
import { Calendar,AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { menuService } from '../../services/menu';
import { orderService } from '../../services/orders';
import MenuForm from './MenuForm'; // Assuming you have a MenuForm component for editing menus
import { data } from 'react-router-dom';

const MenuCard = ({ menu }) => {
  const { isCaterer } = useAuth()
  const [hasOrders, setHasOrders] = useState(false);
  const [isEditable, setIsEditable] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const calculatePrice = () => {
    let total = 0;
    if (menu.items && typeof menu.items === 'object') {
      Object.values(menu.items).forEach(categoryItems => {
        if (Array.isArray(categoryItems)) {
          categoryItems.forEach(item => {
            if (item.price) {
              total += parseFloat(item.price);
            }
          });
        }
      });
    }
    return total;
  };

  useEffect(() => {
    checkMenuHasOrders(menu.menu_date);
  }, [menu.menu_date]);

  const checkMenuHasOrders = async (menu_date) => {
  const response = await orderService.getOrdersbyMenuDate({ menu_date: menu_date});
    if (response.length > 0) {
      setHasOrders(true);
      setIsEditable(false);
      //toast.error('Cannot edit menu with existing orders');
      return;
    }
    else {
      setHasOrders(false);
      setIsEditable(true);
      //toast.success('Menu is editable now');
      
    }

  };

  const handleEditMenuClick = async () => {
    
    try {


      // Set form data and show form
      setFormData(menu);
      setIsEditing(true); // This will trigger the form to render
      
    } catch (error) {
      console.error('Error opening edit form:', error);
      toast.error('Failed to open edit form');
    }

    setIsModalOpen(true); // Open the modal
  };


  const handleFormCancel = (data) => {
    console.log('Form submitted with data:', data);
  };
  
  const renderMenuItems = () => {
    if (!menu.items || typeof menu.items !== 'object') return null;
     // Group items by category
     const groupedItems = menu.items.reduce((acc, item) => {
      const category = item.category || 'Combo Deals';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {});

    return Object.entries(groupedItems).map(([category, items]) => (
      <div key={category} className="mb-4">
        <h4 className="font-medium text-gray-800 mb-2 text-lg border-b border-gray-200 pb-1">
          {category}
        </h4>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.catalog_item_id} className="bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900">{item.item_name}</h5>
                  {item.description && (
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                  )}
                  
                  {/* Show combo items details */}
                  {item.is_combo && item.combo_items && Array.isArray(item.combo_items) && (
                    <div className="mt-2 p-2 bg-white rounded border">
                      <p className="text-xs font-medium text-gray-700 mb-1">Includes:</p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {item.combo_items.map((comboItem, idx) => (
                          <li key={idx} className="flex justify-between">
                            <span>{comboItem.item_name} × {comboItem.quantity}</span>
                            <span className="text-gray-500">£{comboItem.default_price} each</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                <div className="ml-4 text-right">
                  <span className="font-bold text-lg text-green-600">£{item.price}</span>
                  {item.is_combo && (
                    <div className="text-xs text-gray-500 mt-1">Combo Deal</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ));
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold text-gray-900">{menu.name}</h3>
       
          <span className={`px-2 py-1 text-xs rounded ${
            menu.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {menu.active ? 'Active' : 'Inactive'}
          </span>
    
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-500 mt-2">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            {format(new Date(menu.menu_date), 'MMM dd, yyyy')}
          </div>
        </div>
        
        <div className="flex items-center">
        {isCaterer && menu.active && (
            <button
              onClick={() => {
                const fullOrderLink = `${window.location.origin}${menu.orderlink}`;
                navigator.clipboard.writeText(fullOrderLink).then(() => {
                  // Optional: Show a temporary success message
                  alert('Order link copied to clipboard!');
                }).catch(err => {
                  console.error('Failed to copy: ', err);
                  // Fallback for older browsers
                  const textArea = document.createElement('textarea');
                  textArea.value = fullOrderLink;
                  document.body.appendChild(textArea);
                  textArea.select();
                  document.execCommand('copy');
                  document.body.removeChild(textArea);
                  alert('Order link copied to clipboard!');
                });
              }}
              className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors"
            >
              Copy Order Link
            </button>
          )}
        </div>
      </div>
      </div>

      {/* Menu Items */}
      <div className="p-4">
        {renderMenuItems()}
      </div>

      {/* Footer */}
      <div className="p-4 bg-gray-50 border-t">
        <div className="flex justify-between items-center">
        <button
            onClick={async () => {
              try {
                const newStatus = !menu.active;
                
                // Check if trying to activate a backdated menu
                if (newStatus && new Date(menu.menu_date) < new Date().setHours(0,0,0,0)) {
                  toast.error('Cannot activate menu for past dates');
                  return;
                }
              
                await menuService.updateScheduledMenuStatus(menu.menu_id, { active: newStatus });
                menu.active = newStatus; // Update local state
                toast.success(`Menu ${newStatus ? 'activated' : 'deactivated'}`);
              } catch (error) {
                toast.error('Failed to update menu status');
                console.error('Menu status update error:', error);
              }
            }}
            disabled={!menu.active && new Date(menu.menu_date) < new Date().setHours(0,0,0,0)}
            className={`text-sm transition-colors ${
              !menu.active && new Date(menu.menu_date) < new Date().setHours(0,0,0,0)
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-600 hover:text-gray-700'
            }`}
          >
          {menu.active ? 'Deactivate' : 'Activate'}
          </button>
          {menu.active && new Date(menu.menu_date) < new Date().setHours(0,0,0,0) && (
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-300">
          <AlertTriangle className="h-3 w-3 mr-1" />
             Menu date has passed 
             consider deactivating
          </div>
          )}
{/* 
          <button
            onClick={handleEditMenuClick}
            className={`text-sm px-4 py-2 rounded-md transition-colors ${ 
              hasOrders ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-orange-600 text-white hover:bg-orange-700'
            }`}
           >
            {hasOrders || new Date(menu.menu_date) < new Date().setHours(0,0,0,0) ? 'Menu Not Editable' : 'Edit Menu '}
          </button> */}

       {/*  {/* Menu Form - Only renders when isEditing is true */}
        {/* {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
             <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              {menu && (
                <MenuForm 
                  menu= {menu}
                  isEditable={true}
                  onSubmit={async (data) => {
                    try {
                      await menuService.updateScheduledMenu(menu.menu_id, data);
                      toast.success('Menu updated successfully');
                      setFormData(null); // Clear form after submission
                      setIsEditable(false); // Close modal
                    } catch (error) {
                      console.error('Error updating menu:', error);
                      toast.error('Failed to update menu');
                    }
                  }}
                  onCancel={handleFormCancel}
                />
              )}
            </div>
        </div>
      )}  */}
    
        </div>
      </div>
    </div>
  );
};

export default MenuCard;