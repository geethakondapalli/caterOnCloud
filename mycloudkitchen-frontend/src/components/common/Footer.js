import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, ChefHat } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-4">
              <ChefHat className="h-8 w-8 text-orange-500 mr-2" />
              <span className="text-2xl font-bold">MyCloudKitchen</span>
            </div>
            <p className="text-gray-400 mb-6 max-w-md">
              Connecting food lovers with passionate caterers. Experience restaurant-quality 
              meals prepared with love and delivered fresh to your door.
            </p>
      
          </div>

          {/* Quick Links */}

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-center text-gray-400">
                <Mail className="h-5 w-5 mr-3 text-orange-500" />
                <span>hello@mycloudkitchen.com</span>
              </li>
              <li className="flex items-center text-gray-400">
                <Phone className="h-5 w-5 mr-3 text-orange-500" />
                <span>+44 20 1234 5678</span>
              </li>
              <li className="flex items-start text-gray-400">
                <MapPin className="h-5 w-5 mr-3 mt-1 text-orange-500 flex-shrink-0" />
                <span>
                  123 Food Street<br />
                  London, UK<br />
                  SW1A 1AA
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex flex-wrap justify-center md:justify-start space-x-6 mb-4 md:mb-0">
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                Terms of Service
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                Cookie Policy
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                Refund Policy
              </a>
            </div>
            <div className="text-center md:text-right">
              <p className="text-gray-400 text-sm">
                © {new Date().getFullYear()} MyCloudKitchen. All rights reserved.
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Made with ❤️ for food lovers everywhere
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;