import React, { useState, useRef } from 'react';
import { Calendar, Download, Eye, Printer, FileText,X } from 'lucide-react';
import html2canvas from 'html2canvas';

// Mock data for demonstration
const mockMenu = {
  name: "Daily Special Menu",
  active: true,
  menu_date: "2025-01-24",
  orderlink: "https://example.com/order",
  items: [
    {
      catalog_item_id: "1",
      item_name: "Chicken Tikka Masala",
      description: "Tender chicken in creamy spiced tomato sauce",
      category: "Main Courses",
      price: "12.99",
      is_combo: false
    },
    {
      catalog_item_id: "2", 
      item_name: "Lunch Combo Deal",
      description: "Perfect midday meal with drink and side",
      category: "Combo Deals",
      price: "8.99",
      is_combo: true,
      combo_items: [
        { item_name: "Chicken Curry", quantity: 1, default_price: "6.99" },
        { item_name: "Rice", quantity: 1, default_price: "2.99" },
        { item_name: "Soft Drink", quantity: 1, default_price: "1.99" }
      ]
    },
    {
      catalog_item_id: "3",
      item_name: "Vegetable Biryani", 
      description: "Fragrant basmati rice with mixed vegetables",
      category: "Main Courses",
      price: "10.99",
      is_combo: false
    }
  ]
};

// Mock customer template
const customerTemplate = {
  businessName: "Resturant Name",
  logo: "🍛",
  colors: {
    primary: "#ff6b35",
    secondary: "#2c3e50", 
    accent: "#f39c12"
  },
  contact: {
    phone: "(555) 123-4567",
    address: "123 Main Street, City",
    website: "www.spicegarden.com"
  },
  layout: "classic" // classic, modern, minimal
};

const FlyerGenerator = ({ isOpen, onClose, menu, template={customerTemplate} }) => {
  const flyerRef = useRef();

  const format = (date) => {
    const d = new Date(date);
    const options = { year: 'numeric', month: 'short', day: '2-digit' };
    return d.toLocaleDateString('en-US', options);
  };

  const groupedItems = menu?.items ? menu.items.reduce((acc, item) => {
    const category = item.category || 'Combo Deals';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {}) : {};

  const downloadFlyer = async () => {
    if (!flyerRef.current) return;
    
    try {
      // Create a temporary container with better styling for image capture
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '800px';
      tempContainer.style.background = 'white';
      tempContainer.style.padding = '2rem';
      tempContainer.style.fontFamily = 'Arial, sans-serif';
      
      // Clone the flyer content
      const flyerClone = flyerRef.current.cloneNode(true);
      flyerClone.style.maxWidth = 'none';
      flyerClone.style.width = '100%';
      flyerClone.style.transform = 'scale(1)';
      
      tempContainer.appendChild(flyerClone);
      document.body.appendChild(tempContainer);
      
      // Use html2canvas to capture the image
      const canvas = await html2canvas(tempContainer, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher resolution
        useCORS: true,
        allowTaint: true,
        width: 800,
        height: tempContainer.scrollHeight,
        scrollX: 0,
        scrollY: 0
      });
      
      // Clean up
      document.body.removeChild(tempContainer);
      
      // Convert to blob and download
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${template.businessName}-${menu.name}-flyer.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 'image/png', 1.0);
      
    } catch (error) {
      console.error('Error generating flyer image:', error);
      // Fallback to print dialog
      alert('Image download failed. Opening print dialog instead.');
      window.print();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-bold">Menu Flyer Preview</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={downloadFlyer}
              className="flex items-center space-x-1 bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 transition-colors text-sm"
            >
              <Download className="h-4 w-4" />
              <span>Download</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-1"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Flyer Content */}
        <div className="p-6">
          <div 
            ref={flyerRef}
            className="bg-white border-2 border-gray-300 rounded-lg p-8 max-w-2xl mx-auto"
            style={{ 
              fontFamily: 'Arial, sans-serif',
              background: `linear-gradient(135deg, ${template.colors.primary}10, ${template.colors.secondary}10)`
            }}
          >
            {/* Flyer Header */}
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">{template.logo}</div>
              <h1 
                className="text-3xl font-bold mb-2"
                style={{ color: template.colors.primary }}
              >
                {template.businessName}
              </h1>
              <h2 
                className="text-xl font-semibold mb-4"
                style={{ color: template.colors.secondary }}
              >
                {menu.name}
              </h2>
              <div 
                className="text-sm px-4 py-2 rounded-full inline-block"
                style={{ 
                  backgroundColor: template.colors.accent + '20',
                  color: template.colors.accent,
                  border: `1px solid ${template.colors.accent}`
                }}
              >
                {format(new Date(menu.menu_date))}
              </div>
            </div>

            {/* Flyer Menu Items */}
            <div className="space-y-6">
              {Object.entries(groupedItems).map(([category, items]) => (
                <div key={category}>
                  <h3 
                    className="text-xl font-bold mb-3 pb-2 border-b-2"
                    style={{ 
                      color: template.colors.secondary,
                      borderColor: template.colors.primary
                    }}
                  >
                    {category}
                  </h3>
                  <div className="grid gap-3">
                  <div className="bg-white rounded-lg shadow-sm overflow-hidden">
  <table className="w-full">
    <tbody>
      {items.map((item) => (
        <React.Fragment key={item.catalog_item_id}>
          {/* Main Item Row */}
          <tr className="border-b border-gray-100 hover:bg-gray-50">
            <td className="p-4 align-top">
              <div className="font-semibold text-lg text-gray-900">
                {item.item_name}
              </div>

            </td>
            
           
            
            <td className="p-4 align-top text-right">
              <div
                className="text-xl font-bold"
                style={{ color: template.colors.primary }}
              >
                £{item.price}
                {item.is_combo && (
                  <div className="text-xs opacity-75 font-normal mt-1">
                    Includes
                  </div>
                )}
              </div>

            </td>
          </tr>
          <tr className="border-b border-gray-100 hover:bg-gray-50">
          <td className="p-4 align-top">
              {item.description && (
                <p className="text-sm text-gray-600">{item.description}</p>
              )}
            </td>
          
          {/* Combo Items Sub-rows */}
          {item.is_combo && item.combo_items && (
            <tr>
              <td colSpan="3" className="px-4 pb-4">
                <div className="bg-gray-50 rounded-lg p-3 ml-4">
                  <div className="text-sm font-medium mb-2 text-gray-700">
                    Combo includes:
                  </div>
                  <ul className="space-y-2 list-none">
                    {item.combo_items.map((comboItem, index) => (
                      <li
                        key={index}
                        className="flex justify-between items-center text-sm"
                        style={{ color: template.colors.text }}
                      >
                        <span className="flex items-center">
                          <span className="w-1 h-1 bg-current rounded-full mr-2 opacity-60"></span>
                          {comboItem.item_name}
                        </span>
                        {comboItem.quantity && (
                          <span className="text-xs opacity-75 ml-2">
                            {comboItem.quantity} portions
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </td>
            </tr>
          )}
          </tr>

        </React.Fragment>
      ))}
    </tbody>
  </table>
</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Flyer Footer */}
            <div 
              className="mt-8 p-4 rounded-lg text-center"
              style={{ backgroundColor: template.colors.secondary, color: 'white' }}
            >
              <div className="text-lg font-bold mb-2">Order Now!</div>
              <div className="text-sm space-y-1">
                <div>📞 {template.contact.phone}</div>
                <div>📍 {template.contact.address}</div>
                <div>🌐 {template.contact.website}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlyerGenerator;