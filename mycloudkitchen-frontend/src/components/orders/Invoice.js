import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { sendNotifications } from '../../services/notifications';


class InvoiceService {
  
  // Generate invoice data structure
  generateInvoiceData(orderDetails, customerInfo, menuData) {
    const invoiceNumber = `INV-${orderDetails.order_id}-${new Date().getFullYear()}`;
    const invoiceDate = new Date().toLocaleDateString('en-GB');
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB'); // 30 days from now

    return {
      invoice: {
        number: invoiceNumber,
        date: invoiceDate,
        dueDate: dueDate,
        status: orderDetails.payment_status === 'completed' ? 'PAID' : 'PENDING'
      },
      company: {
        name: "Test Kitchen",
        address: "123 Main Street",
        city: "London",
        postcode: "SW1A 1AA",
        phone: "020 1234 5678",
        email: "orders@deliciouscatering.co.uk",
        website: "www.deliciouscatering.co.uk"
      },
      customer: {
        name: customerInfo.name,
        email: customerInfo.email,
        phone: customerInfo.phone,
        address: customerInfo.address
      },
      order: {
        id: orderDetails.order_id,
        date: new Date(orderDetails.order_date).toLocaleDateString('en-GB'),
        deliveryDate: new Date(orderDetails.delivery_date).toLocaleDateString('en-GB'),
        type: customerInfo.orderType,
        menuName: menuData?.name || 'Custom Menu'
      },
      items: Object.values(orderDetails.items).map(item => ({
        name: item.item_name,
        quantity: item.quantity,
        unitPrice: parseFloat(item.price),
        total: parseFloat(item.price) * item.quantity,
        description: item.description || ''
      })),
      totals: {
        subtotal: parseFloat(orderDetails.total),
        tax: 0, // Add tax calculation if needed
        total: parseFloat(orderDetails.total)
      },
      notes: orderDetails.special_instructions || customerInfo.notes || '',
      paymentMethod: orderDetails.payment_method
    };
  }

  // Generate HTML invoice template
  generateInvoiceHTML(invoiceData) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: white;
            color: #333;
          }
          .invoice-container { 
            max-width: 800px; 
            margin: 0 auto; 
            background: white;
            border: 1px solid #ddd;
          }
          .header { 
            background: #2563eb; 
            color: white; 
            padding: 30px; 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-start;
          }
          .company-info h1 { 
            margin: 0 0 10px 0; 
            font-size: 28px; 
          }
          .company-info p { 
            margin: 2px 0; 
            opacity: 0.9; 
          }
          .invoice-info { 
            text-align: right; 
          }
          .invoice-info h2 { 
            margin: 0 0 10px 0; 
            font-size: 24px; 
          }
          .status-badge { 
            display: inline-block; 
            padding: 5px 15px; 
            border-radius: 20px; 
            font-weight: bold; 
            font-size: 12px;
          }
          .status-paid { 
            background: #10b981; 
            color: white; 
          }
          .status-pending { 
            background: #f59e0b; 
            color: white; 
          }
          .content { 
            padding: 30px; 
          }
          .billing-section { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 30px; 
          }
          .billing-info h3 { 
            margin: 0 0 15px 0; 
            color: #2563eb; 
            border-bottom: 2px solid #e5e7eb; 
            padding-bottom: 5px; 
          }
          .billing-info p { 
            margin: 5px 0; 
          }
          .order-details { 
            background: #f8fafc; 
            padding: 20px; 
            border-radius: 8px; 
            margin-bottom: 30px; 
          }
          .order-details h3 { 
            margin: 0 0 15px 0; 
            color: #2563eb; 
          }
          .order-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 15px; 
          }
          .items-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 30px; 
          }
          .items-table th { 
            background: #f1f5f9; 
            padding: 12px; 
            text-align: left; 
            border-bottom: 2px solid #e2e8f0; 
            font-weight: bold; 
          }
          .items-table td { 
            padding: 12px; 
            border-bottom: 1px solid #e2e8f0; 
          }
          .items-table tr:hover { 
            background: #f8fafc; 
          }
          .text-right { 
            text-align: right; 
          }
          .totals-section { 
            float: right; 
            width: 300px; 
            margin-top: 20px; 
          }
          .total-row { 
            display: flex; 
            justify-content: space-between; 
            padding: 8px 0; 
            border-bottom: 1px solid #e2e8f0; 
          }
          .total-row.final { 
            background: #2563eb; 
            color: white; 
            padding: 15px; 
            margin-top: 10px; 
            font-weight: bold; 
            font-size: 18px; 
          }
          .notes-section { 
            clear: both; 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 2px solid #e5e7eb; 
          }
          .footer { 
            background: #f8fafc; 
            padding: 20px 30px; 
            text-align: center; 
            border-top: 1px solid #e2e8f0; 
            color: #6b7280; 
            font-size: 14px; 
          }
          @media print {
            body { margin: 0; padding: 0; }
            .invoice-container { border: none; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <!-- Header -->
          <div class="header">
            <div class="company-info">
              <h1>${invoiceData.company.name}</h1>
              <p>${invoiceData.company.address}</p>
              <p>${invoiceData.company.city}, ${invoiceData.company.postcode}</p>
              <p>Phone: ${invoiceData.company.phone}</p>
              <p>Email: ${invoiceData.company.email}</p>
            </div>
            <div class="invoice-info">
              <h2>INVOICE</h2>
              <p><strong>${invoiceData.invoice.number}</strong></p>
              <p>Date: ${invoiceData.invoice.date}</p>
              <p>Due: ${invoiceData.invoice.dueDate}</p>
              <span class="status-badge ${invoiceData.invoice.status === 'PAID' ? 'status-paid' : 'status-pending'}">
                ${invoiceData.invoice.status}
              </span>
            </div>
          </div>

          <!-- Content -->
          <div class="content">
            <!-- Billing Information -->
            <div class="billing-section">
              <div class="billing-info">
                <h3>Bill To:</h3>
                <p><strong>${invoiceData.customer.name}</strong></p>
                ${invoiceData.customer.email ? `<p>${invoiceData.customer.email}</p>` : ''}
                <p>${invoiceData.customer.phone}</p>
                ${invoiceData.customer.address ? `<p>${invoiceData.customer.address}</p>` : ''}
              </div>
              <div class="billing-info">
                <h3>Order Information:</h3>
                <p><strong>Order #:</strong> ${invoiceData.order.id}</p>
                <p><strong>Order Date:</strong> ${invoiceData.order.date}</p>
                <p><strong>Delivery Date:</strong> ${invoiceData.order.deliveryDate}</p>
                <p><strong>Service Type:</strong> ${invoiceData.order.type === 'pickup' ? 'Pickup' : 'Delivery'}</p>
                <p><strong>Menu:</strong> ${invoiceData.order.menuName}</p>
              </div>
            </div>

            <!-- Items Table -->
            <table class="items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th class="text-right">Qty</th>
                  <th class="text-right">Unit Price</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${invoiceData.items.map(item => `
                  <tr>
                    <td>
                      <strong>${item.name}</strong>
                      ${item.description ? `<br><small style="color: #6b7280;">${item.description}</small>` : ''}
                    </td>
                    <td class="text-right">${item.quantity}</td>
                    <td class="text-right">£${item.unitPrice.toFixed(2)}</td>
                    <td class="text-right">£${item.total.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <!-- Totals -->
            <div class="totals-section">
              <div class="total-row">
                <span>Subtotal:</span>
                <span>£${invoiceData.totals.subtotal.toFixed(2)}</span>
              </div>
              ${invoiceData.totals.tax > 0 ? `
                <div class="total-row">
                  <span>Tax:</span>
                  <span>£${invoiceData.totals.tax.toFixed(2)}</span>
                </div>
              ` : ''}
              <div class="total-row final">
                <span>Total:</span>
                <span>£${invoiceData.totals.total.toFixed(2)}</span>
              </div>
            </div>

            <!-- Notes -->
            ${invoiceData.notes ? `
              <div class="notes-section">
                <h3>Special Instructions:</h3>
                <p>${invoiceData.notes}</p>
              </div>
            ` : ''}

            <!-- Payment Information -->
            <div class="notes-section">
              <h3>Payment Information:</h3>
              <p><strong>Payment Method:</strong> ${invoiceData.paymentMethod === 'online' ? 'Online Payment' : 'Pay on Collection/Delivery'}</p>
              ${invoiceData.invoice.status === 'PENDING' && invoiceData.paymentMethod === 'offline' ? 
                '<p style="color: #f59e0b;"><strong>Please have payment ready upon collection/delivery.</strong></p>' : ''}
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p>Thank you for choosing ${invoiceData.company.name}!</p>
            <p>For any questions regarding this invoice, please contact us at ${invoiceData.company.phone} or ${invoiceData.company.email}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Generate PDF from HTML
  async generateInvoicePDF(invoiceData) {
    const html = this.generateInvoiceHTML(invoiceData);
    
    // Create temporary div to render HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = '800px';
    document.body.appendChild(tempDiv);

    try {
      // Convert HTML to canvas
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      // Add image to PDF
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add new page if content is longer than one page
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      return pdf;
    } finally {
      // Clean up
      document.body.removeChild(tempDiv);
    }
  }

  // Email service integration
  async sendInvoiceByEmail(invoiceData, recipientEmail) {
    try {
      const pdf = await this.generateInvoicePDF(invoiceData);
      const pdfBlob = pdf.output('blob');

      // Convert blob to base64 for email attachment
      const base64PDF = await this.blobToBase64(pdfBlob);

      const emailData = {
        to: recipientEmail,
        subject: `Invoice ${invoiceData.invoice.number} - ${invoiceData.company.name}`,
        html: this.generateEmailTemplate(invoiceData),
        attachments: [{
          filename: `invoice-${invoiceData.invoice.number}.pdf`,
          content: base64PDF,
          type: 'application/pdf'
        }]
      };
      console.log('Sending email with data:', emailData);
     
      const response = await sendNotifications.sendInvoicebyEmail(emailData);

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      return { success: true, message: 'Invoice sent successfully via email' };
    } catch (error) {
      console.error('Error sending invoice by email:', error);
      throw error;
    }
  }

  // SMS service integration
  async sendInvoiceBySMS(invoiceData, phoneNumber) {
    try {
      const smsMessage = `
Hello ${invoiceData.customer.name}!

Your invoice is ready:
Invoice: ${invoiceData.invoice.number}
Order: #${invoiceData.order.id}
Total: £${invoiceData.totals.total.toFixed(2)}
Status: ${invoiceData.invoice.status}

${invoiceData.invoice.status === 'PENDING' ? 
  `Payment due: ${invoiceData.invoice.dueDate}` : 
  'Payment completed - Thank you!'
}

View full invoice: ${window.location.origin}/invoice/${invoiceData.invoice.number}

${invoiceData.company.name}
${invoiceData.company.phone}
      `.trim();

      const smsData = {
        to: phoneNumber,
        message: smsMessage
      };

      const response = await sendNotifications.sendInvoicebySMS(smsData);
      // Send SMS via your backend API

      if (!response.ok) {
        throw new Error('Failed to send SMS');
      }

      return { success: true, message: 'Invoice sent successfully via SMS' };
    } catch (error) {
      console.error('Error sending invoice by SMS:', error);
      throw error;
    }
  }

  // Generate email template
  generateEmailTemplate(invoiceData) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2563eb; color: white; padding: 20px; text-align: center;">
          <h1>${invoiceData.company.name}</h1>
          <p>Invoice ${invoiceData.invoice.number}</p>
        </div>
        
        <div style="padding: 20px; background: #f8fafc;">
          <h2>Hello ${invoiceData.customer.name},</h2>
          
          <p>Thank you for your order! Please find your invoice attached.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Order Summary:</h3>
            <p><strong>Order #:</strong> ${invoiceData.order.id}</p>
            <p><strong>Delivery Date:</strong> ${invoiceData.order.deliveryDate}</p>
            <p><strong>Total Amount:</strong> £${invoiceData.totals.total.toFixed(2)}</p>
            <p><strong>Status:</strong> <span style="color: ${invoiceData.invoice.status === 'PAID' ? '#10b981' : '#f59e0b'};">${invoiceData.invoice.status}</span></p>
          </div>
          
          ${invoiceData.invoice.status === 'PENDING' ? `
            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
              <p><strong>Payment Due:</strong> ${invoiceData.invoice.dueDate}</p>
              <p>Please ensure payment is ready for ${invoiceData.order.type === 'pickup' ? 'collection' : 'delivery'}.</p>
            </div>
          ` : `
            <div style="background: #d1fae5; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981;">
              <p><strong>Payment Completed</strong> - Thank you!</p>
            </div>
          `}
          
          <p>If you have any questions, please don't hesitate to contact us:</p>
          <p>📞 ${invoiceData.company.phone}<br>
          📧 ${invoiceData.company.email}</p>
          
          <p>Thank you for choosing ${invoiceData.company.name}!</p>
        </div>
        
        <div style="background: #374151; color: white; padding: 20px; text-align: center; font-size: 14px;">
          <p>${invoiceData.company.name} | ${invoiceData.company.address}, ${invoiceData.company.city}</p>
        </div>
      </div>
    `;
  }

  // Helper function to convert blob to base64
  blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Download invoice PDF
  async downloadInvoice(invoiceData) {
    try {
      const pdf = await this.generateInvoicePDF(invoiceData);
      pdf.save(`invoice-${invoiceData.invoice.number}.pdf`);
      return { success: true, message: 'Invoice downloaded successfully' };
    } catch (error) {
      console.error('Error downloading invoice:', error);
      throw error;
    }
  }

  // Preview invoice in new window
  previewInvoice(invoiceData) {
    const html = this.generateInvoiceHTML(invoiceData);
    const newWindow = window.open('', '_blank');
    newWindow.document.write(html);
    newWindow.document.close();
  }
}

// Usage in your OrderForm component:
// Add this to your handlePaymentSuccess and offline order completion

const invoiceService = new InvoiceService();

// Example usage after order completion:
const sendInvoiceToCustomer = async (orderDetails, customerInfo, menuData) => {
  try {
    const invoiceData = invoiceService.generateInvoiceData(orderDetails, customerInfo, menuData);
    
    // Send via email if customer provided email
    if (customerInfo.email) {
      await invoiceService.sendInvoiceByEmail(invoiceData, customerInfo.email);
      console.log('Invoice sent via email');
    }
    
    // Send via SMS if customer provided phone
    if (customerInfo.phone) {
      await invoiceService.sendInvoiceBySMS(invoiceData, customerInfo.phone);
      console.log('Invoice sent via SMS');
    }
    
    // Also offer download option
    return invoiceData;
  } catch (error) {
    console.error('Error sending invoice:', error);
    throw error;
  }
};

export { InvoiceService, sendInvoiceToCustomer };