import { useState } from 'react';
import axios from 'axios';

/**
 * Custom hook for shared receipt logic
 * @param {string} orderId - The order ID to work with
 * @returns {object} Receipt utilities and state
 */
// Pure utility functions (better for tree shaking)
export const generateReceiptContent = (order) => {
    if (!order) return '';

    const items = order.items || [];
    const totalAmount = parseFloat(order.total_amount || order.totalAmount || 0);
    const vatRate = 0.15; // 15% VAT
    const subtotal = totalAmount / (1 + vatRate);
    const vatAmount = totalAmount - subtotal;

    let receipt = '';
    receipt += '='.repeat(40) + '\n';
    receipt += '        BEAN TO MUG CAFE\n';
    receipt += '='.repeat(40) + '\n';
    receipt += `Order ID: ${order.order_id || order.orderId}\n`;
    receipt += `Date: ${new Date(order.created_at || order.createdAt).toLocaleString()}\n`;
    receipt += `Type: ${order.order_type || order.orderType}\n`;
    receipt += `Status: ${order.status}\n`;
    receipt += `Payment: ${order.payment_method || 'Not specified'}\n`;
    if (order.payment_status) {
        receipt += `Payment Status: ${order.payment_status}\n`;
    }
    receipt += '-'.repeat(40) + '\n';
    receipt += 'ITEMS:\n';
    receipt += '-'.repeat(40) + '\n';

    items.forEach((item, index) => {
        const itemName = item.name || item.item_name || `Item ${index + 1}`;
        const itemPrice = parseFloat(item.price || item.item_price || 0);
        const itemQuantity = parseInt(item.quantity || 1);
        const itemTotal = itemPrice * itemQuantity;

        receipt += `${itemName}\n`;
        receipt += `  ${itemQuantity} x $${itemPrice.toFixed(2)} = $${itemTotal.toFixed(2)}\n`;
        
        // Add options/customizations if available
        if (item.options && item.options.length > 0) {
            receipt += `  Options:\n`;
            item.options.forEach(option => {
                const optionPrice = parseFloat(option.price || 0);
                const priceText = optionPrice > 0 ? ` (+$${optionPrice.toFixed(2)})` : '';
                receipt += `    • ${option.name}${priceText}\n`;
            });
        }
        
        // Add customizations if available (for backward compatibility)
        if (item.customizations && item.customizations.length > 0) {
            receipt += `  Customizations:\n`;
            item.customizations.forEach(custom => {
                const customPrice = parseFloat(custom.price || 0);
                const priceText = customPrice > 0 ? ` (+$${customPrice.toFixed(2)})` : '';
                receipt += `    • ${custom.name}${priceText}\n`;
            });
        }
        
        // Add special instructions if available
        if (item.special_instructions || item.specialInstructions) {
            receipt += `  Special Instructions: ${item.special_instructions || item.specialInstructions}\n`;
        }
        
        receipt += '\n';
    });

    receipt += '-'.repeat(40) + '\n';
    receipt += `Subtotal: $${subtotal.toFixed(2)}\n`;
    receipt += `VAT (15%): $${vatAmount.toFixed(2)}\n`;
    receipt += `TOTAL: $${totalAmount.toFixed(2)}\n`;
    receipt += '='.repeat(40) + '\n';
    receipt += 'Thank you for your order!\n';
    receipt += '='.repeat(40) + '\n';

    return receipt;
};

export const downloadReceipt = async (order) => {
    try {
        const receiptContent = generateReceiptContent(order);
        const orderId = order.order_id || order.orderId;
        const fileName = `receipt_${orderId}_${new Date().toISOString().split('T')[0]}.txt`;

        // Create blob and download
        const blob = new Blob([receiptContent], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

    } catch (err) {
        console.error('Error downloading receipt:', err);
        throw new Error('Failed to download receipt');
    }
};

export const printReceipt = (order) => {
    const receiptContent = generateReceiptContent(order);
    const orderId = order.order_id || order.orderId;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Receipt - Order ${orderId}</title>
                <style>
                    body { 
                        font-family: 'Courier New', monospace; 
                        font-size: 12px; 
                        line-height: 1.4; 
                        margin: 0;
                        padding: 20px;
                    }
                    .receipt { 
                        max-width: 400px; 
                        margin: 0 auto; 
                        padding: 20px; 
                    }
                    .header { 
                        text-align: center; 
                        border-bottom: 2px solid #000; 
                        padding-bottom: 10px; 
                        margin-bottom: 20px; 
                    }
                    .item { 
                        margin: 10px 0; 
                    }
                    .total { 
                        border-top: 1px solid #000; 
                        padding-top: 10px; 
                        margin-top: 20px; 
                        font-weight: bold; 
                    }
                    .footer { 
                        text-align: center; 
                        margin-top: 30px; 
                        font-size: 10px; 
                    }
                    @media print { 
                        body { margin: 0; } 
                    }
                </style>
            </head>
            <body>
                <div class="receipt">
                    <div class="header">
                        <h2>BEAN TO MUG CAFE</h2>
                        <p>Payment Receipt</p>
                    </div>
                    <pre>${receiptContent}</pre>
                    <div class="footer">
                        <p>Thank you for your order!</p>
                    </div>
                </div>
            </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
};

export const viewReceipt = (order, onView = null) => {
    const receiptContent = generateReceiptContent(order);
    
    if (onView) {
        onView(order, receiptContent);
    } else {
        // Default modal behavior
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;
        
        const content = document.createElement('div');
        content.style.cssText = `
            background: white;
            padding: 2rem;
            border-radius: 0.5rem;
            max-width: 90%;
            max-height: 90%;
            overflow: auto;
            font-family: 'Courier New', monospace;
            white-space: pre-wrap;
            font-size: 0.9rem;
            line-height: 1.4;
        `;
        content.textContent = receiptContent;
        
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.style.cssText = `
            position: absolute;
            top: 1rem;
            right: 1rem;
            padding: 0.5rem 1rem;
            background: #e74c3c;
            color: white;
            border: none;
            border-radius: 0.25rem;
            cursor: pointer;
        `;
        closeButton.onclick = () => document.body.removeChild(modal);
        
        content.appendChild(closeButton);
        modal.appendChild(content);
        modal.onclick = (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        };
        
        document.body.appendChild(modal);
    }
};

// Hook for components that need state management
export const useReceiptLogic = (orderId = null) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Download receipt with loading state
     * @param {object} order - Order data
     */
    const downloadReceiptWithLoading = async (order) => {
        try {
            setLoading(true);
            setError(null);
            await downloadReceipt(order);
        } catch (err) {
            setError('Failed to download receipt');
            console.error('Error downloading receipt:', err);
        } finally {
            setLoading(false);
        }
    };

    return {
        generateReceiptContent,
        downloadReceipt: downloadReceiptWithLoading,
        viewReceipt,
        printReceipt,
        loading,
        error
    };
}; 