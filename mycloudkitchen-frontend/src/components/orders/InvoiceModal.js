// InvoiceModal.js - Standalone Modal Component
import React, { useState } from 'react';
import { Download, Mail, MessageSquare, Plus, X, CheckCircle } from 'lucide-react';

const InvoiceModal = ({ 
  isOpen, 
  onClose, 
  invoiceData, 
  currentOrderDetails, 
  customerInfo, 
  invoiceService,
  handleInvoiceGeneration,
  resetForm 
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isSendingSMS, setIsSendingSMS] = useState(false);
  const [lastEmailSent, setLastEmailSent] = useState(null);
  const [lastSMSSent, setLastSMSSent] = useState(null);

  // Don't render if modal is not open
  if (!isOpen || !invoiceData || !currentOrderDetails) return null;

  // Enhanced download handler with error handling
  const handleDownloadInvoice = async () => {
    setIsDownloading(true);
    try {
      await invoiceService.downloadInvoice(invoiceData);
      // Optional: Show success notification
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download invoice. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Enhanced email resend with loading state
  const handleResendEmail = async () => {
    setIsSendingEmail(true);
    try {
      await handleInvoiceGeneration(currentOrderDetails, customerInfo, 'email');
      setLastEmailSent(new Date());
    } catch (error) {
      console.error('Email sending failed:', error);
      alert('Failed to send email. Please try again.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Enhanced SMS resend with loading state
  const handleResendSMS = async () => {
    setIsSendingSMS(true);
    try {
      await handleInvoiceGeneration(currentOrderDetails, customerInfo, 'sms');
      setLastSMSSent(new Date());
    } catch (error) {
      console.error('SMS sending failed:', error);
      alert('Failed to send SMS. Please try again.');
    } finally {
      setIsSendingSMS(false);
    }
  };

  const handleNewOrder = () => {
    resetForm();
    onClose();
  };

  const handleCloseModal = () => {
    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-t-xl relative">
          <button
            onClick={handleCloseModal}
            className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="text-center">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Order Completed Successfully!</h2>
            <p className="text-green-100">
              Your order has been placed and invoice has been generated
            </p>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          
          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Order Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order ID:</span>
                    <span className="font-medium">#{currentOrderDetails.order_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Customer:</span>
                    <span className="font-medium">{customerInfo.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service Type:</span>
                    <span className="font-medium capitalize">{customerInfo.orderType}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Invoice Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Invoice:</span>
                    <span className="font-medium">{invoiceData.invoice.number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-bold text-green-600">£{invoiceData.totals.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Status:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      invoiceData.invoice.status === 'PAID' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {invoiceData.invoice.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Actions */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-800 mb-4">Invoice Actions:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Download PDF Button */}
              <button
                onClick={handleDownloadInvoice}
                disabled={isDownloading}
                className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                {isDownloading ? (
                  <>
                    <svg className="w-5 h-5 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 mr-2" />
                    Download PDF
                  </>
                )}
              </button>
              
              {/* Preview Button */}
              <button
                onClick={() => invoiceService.previewInvoice(invoiceData)}
                className="flex items-center justify-center bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                </svg>
                Preview Invoice
              </button>
            </div>
          </div>

          {/* Help Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h5 className="font-medium text-blue-900 mb-2">Need Assistance?</h5>
            <p className="text-blue-700 text-sm mb-2">
              If you have questions about your order or need support:
            </p>
            <div className="space-y-1 text-sm text-blue-700">
              <p className="flex items-center">
                <span className="mr-2">📞</span>
                020 1234 5678
              </p>
              <p className="flex items-center">
                <span className="mr-2">📧</span>
                orders@deliciouscatering.co.uk
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-xl border-t">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleCloseModal}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              Close
            </button>
            <button
              onClick={handleNewOrder}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Place Another Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal