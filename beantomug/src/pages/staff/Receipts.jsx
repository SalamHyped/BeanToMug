import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Pagination from '../../components/controls/Pagination';
import styles from './Receipts.module.css';

const Receipts = () => {
    const [allOrders, setAllOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [dateFilter, setDateFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        limit: 20,
        hasNextPage: false,
        hasPrevPage: false
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);

    // Ref to maintain input focus
    const searchInputRef = useRef(null);

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500); // Wait 500ms after user stops typing

        return () => clearTimeout(timer);
    }, [searchTerm]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:8801/orders/staff/all', {
                params: {
                    page: currentPage,
                    limit: pageSize,
                    dateFilter: dateFilter,
                    searchTerm: debouncedSearchTerm,
                    ...(startDate && { startDate }),
                    ...(endDate && { endDate })
                },
                withCredentials: true
            });
            
            if (response.data.success) {
                const orders = response.data.orders || [];
                setAllOrders(orders);
                setFilteredOrders(orders); // Use backend-filtered data directly
                setPagination(response.data.pagination || {
                    currentPage: 1,
                    totalPages: 1,
                    totalCount: 0,
                    limit: 20,
                    hasNextPage: false,
                    hasPrevPage: false
                });
            } else {
                setError('Failed to fetch orders');
            }
        } catch (err) {
            setError('Error loading orders');
            console.error('Error fetching orders:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [currentPage, pageSize, dateFilter, debouncedSearchTerm, startDate, endDate]);



    const downloadReceipt = async (order) => {
        try {
            // Generate receipt content
            const receiptContent = generateReceiptContent(order);
            
            // Create and download file
            const blob = new Blob([receiptContent], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `receipt-${order.order_id || order.orderId}.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Error downloading receipt:', err);
            alert('Failed to download receipt');
        }
    };

    const generateReceiptContent = (order) => {
        const orderId = order.order_id || order.orderId;
        const orderDate = new Date(order.created_at || order.createdAt);
        const items = order.items || [];
        
        // Calculate totals
        const subtotal = items.reduce((sum, item) => {
            const price = parseFloat(item.price) || 0;
            const quantity = parseInt(item.quantity) || 1;
            return sum + (price * quantity);
        }, 0);
        
        // Use actual VAT amount from order data, or calculate if not available
        let vatAmount = parseFloat(order.vat_amount) || 0;
        if (vatAmount === 0 && subtotal > 0) {
            // Calculate VAT if not stored in database (15% rate)
            vatAmount = subtotal * 0.15;
        }
        const total = parseFloat(order.total_amount) || (subtotal + vatAmount);
        
        // Debug logging
        console.log('Receipt calculation:', {
            orderId: order.order_id,
            subtotal,
            storedVat: order.vat_amount,
            calculatedVat: vatAmount,
            storedTotal: order.total_amount,
            calculatedTotal: total,
            items: items.length
        });
        
        let content = '';
        content += '='.repeat(50) + '\n';
        content += '           BEAN TO MUG CAFE\n';
        content += '='.repeat(50) + '\n';
        content += `Order ID: ${orderId}\n`;
        content += `Date: ${orderDate.toLocaleDateString()}\n`;
        content += `Time: ${orderDate.toLocaleTimeString()}\n`;
        content += `Status: ${order.status}\n`;
        content += `Type: ${order.order_type || order.orderType}\n`;
        content += `Payment Method: ${order.payment_method || 'Not specified'}\n`;
        content += '-'.repeat(50) + '\n';
        content += 'ITEMS:\n';
        content += '-'.repeat(50) + '\n';
        
        items.forEach((item, index) => {
            const price = parseFloat(item.price) || 0;
            const quantity = parseInt(item.quantity) || 1;
            const itemTotal = price * quantity;
            
            content += `${index + 1}. ${item.name || item.item_name}\n`;
            content += `   Quantity: ${quantity}\n`;
            content += `   Unit Price: $${price.toFixed(2)}\n`;
            content += `   Item Total: $${itemTotal.toFixed(2)}\n`;
            if (item.customizations && item.customizations.length > 0) {
                content += `   Customizations: ${item.customizations.join(', ')}\n`;
            }
            content += '\n';
        });
        
        content += '-'.repeat(50) + '\n';
        content += 'PAYMENT SUMMARY:\n';
        content += '-'.repeat(50) + '\n';
        content += `Subtotal: $${subtotal.toFixed(2)}\n`;
        content += `VAT Amount: $${vatAmount.toFixed(2)}\n`;
        content += `Total Amount: $${total.toFixed(2)}\n`;
        content += `Payment Method: ${order.payment_method || 'Not specified'}\n`;
        if (order.payment_status) {
            content += `Payment Status: ${order.payment_status}\n`;
        }
        content += '='.repeat(50) + '\n';
        content += 'Thank you for your order!\n';
        content += '='.repeat(50) + '\n';
        
        return content;
    };

    const viewReceipt = (order) => {
        setSelectedOrder(order);
    };

    const closeReceipt = () => {
        setSelectedOrder(null);
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>Loading orders...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>{error}</div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Order Receipts</h1>
                <p className={styles.subtitle}>View and download order receipts</p>
            </div>

            {/* Search and Filter Controls */}
            <div className={styles.filterControls}>
                <div className={styles.filterSection}>
                                        <div className={styles.searchSection}>
                        <label htmlFor="searchOrder" className={styles.filterLabel}>Search Orders:</label>
                        <div className={styles.searchContainer}>
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="Search by Order ID, Type, Status, or Payment Method..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={styles.searchInput}
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setDebouncedSearchTerm('');
                                        // Focus back to input after clearing
                                        setTimeout(() => {
                                            if (searchInputRef.current) {
                                                searchInputRef.current.focus();
                                            }
                                        }, 0);
                                    }}
                                    className={styles.clearSearch}
                                    title="Clear search"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                        {searchTerm !== debouncedSearchTerm && (
                            <div className={styles.searchIndicator}>
                                Searching...
                            </div>
                        )}
                    </div>
                    <div className={styles.dateSection}>
                        <label htmlFor="dateFilter" className={styles.filterLabel}>Filter by Date:</label>
                        <div className={styles.dateFilterContainer}>
                            <select 
                                id="dateFilter"
                                value={dateFilter} 
                                onChange={(e) => {
                                    setDateFilter(e.target.value);
                                    setStartDate('');
                                    setEndDate('');
                                    setCurrentPage(1);
                                }}
                                className={styles.filterSelect}
                            >
                                <option value="all">All Orders</option>
                                <option value="today">Today</option>
                                <option value="yesterday">Yesterday</option>
                                <option value="week">Last 7 Days</option>
                                <option value="month">Last 30 Days</option>
                                <option value="custom">Custom Date Range</option>
                            </select>
                            
                            {dateFilter === 'custom' && (
                                <div className={styles.customDateContainer}>
                                    <div className={styles.dateInputGroup}>
                                        <label htmlFor="startDate" className={styles.dateLabel}>From:</label>
                                        <input
                                            type="date"
                                            id="startDate"
                                            value={startDate}
                                            onChange={(e) => {
                                                setStartDate(e.target.value);
                                                setCurrentPage(1);
                                            }}
                                            className={styles.dateInput}
                                        />
                                    </div>
                                    <div className={styles.dateInputGroup}>
                                        <label htmlFor="endDate" className={styles.dateLabel}>To:</label>
                                        <input
                                            type="date"
                                            id="endDate"
                                            value={endDate}
                                            onChange={(e) => {
                                                setEndDate(e.target.value);
                                                setCurrentPage(1);
                                            }}
                                            className={styles.dateInput}
                                        />
                                    </div>
                                    {(startDate || endDate) && (
                                        <button
                                            onClick={() => {
                                                setStartDate('');
                                                setEndDate('');
                                                setCurrentPage(1);
                                            }}
                                            className={styles.clearDateButton}
                                            title="Clear custom date range"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                </div>
                <div className={styles.orderCount}>
                    <span className={styles.countLabel}>Showing:</span>
                    <span className={styles.countValue}>{filteredOrders.length} orders</span>
                    <span className={styles.pageInfo}>
                        (Page {pagination.currentPage} of {pagination.totalPages})
                    </span>
                </div>
            </div>

            {/* Pagination Component */}
            <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalCount={pagination.totalCount}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(newPageSize) => {
                    setPageSize(newPageSize);
                    setCurrentPage(1); // Reset to first page when changing page size
                }}
                showPageSizeSelector={true}
                showPageInfo={true}
                variant="default"
            />

            <div className={styles.ordersList}>
                {filteredOrders.length === 0 ? (
                    <div className={styles.empty}>
                        <p>No orders found for the selected date range</p>
                    </div>
                ) : (
                    filteredOrders.map((order) => (
                        <div key={order.order_id || order.orderId} className={styles.orderCard}>
                            <div className={styles.orderHeader}>
                                <div className={styles.orderInfo}>
                                    <h3>Order #{order.order_id || order.orderId}</h3>
                                    <p className={styles.orderDate}>
                                        {new Date(order.created_at || order.createdAt).toLocaleDateString()}
                                    </p>
                                    <p className={styles.orderTime}>
                                        {new Date(order.created_at || order.createdAt).toLocaleTimeString()}
                                    </p>
                                </div>
                                <div className={styles.orderStatus}>
                                    <span className={`${styles.status} ${styles[order.status.toLowerCase()]}`}>
                                        {order.status}
                                    </span>
                                </div>
                            </div>
                            
                            <div className={styles.orderDetails}>
                                <p><strong>Type:</strong> {order.order_type || order.orderType}</p>
                                <p><strong>Items:</strong> {(order.items || []).length} items</p>
                                <p><strong>Payment:</strong> {order.payment_method || 'Not specified'}</p>
                                {order.payment_status && (
                                    <p><strong>Payment Status:</strong> {order.payment_status}</p>
                                )}
                                {order.total_amount || order.totalAmount ? (
                                    <p><strong>Total:</strong> ${order.total_amount || order.totalAmount}</p>
                                ) : null}
                            </div>

                            <div className={styles.orderActions}>
                                <button 
                                    className={styles.viewButton}
                                    onClick={() => viewReceipt(order)}
                                >
                                    👁️ View Receipt
                                </button>
                                <button 
                                    className={styles.downloadButton}
                                    onClick={() => downloadReceipt(order)}
                                >
                                    📥 Download Receipt
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Receipt Modal */}
            {selectedOrder && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h2>Receipt - Order #{selectedOrder.order_id || selectedOrder.orderId}</h2>
                            <button className={styles.closeButton} onClick={closeReceipt}>
                                ✕
                            </button>
                        </div>
                        <div className={styles.receiptContent}>
                            <pre>{generateReceiptContent(selectedOrder)}</pre>
                        </div>
                        <div className={styles.modalActions}>
                            <button 
                                className={styles.downloadButton}
                                onClick={() => downloadReceipt(selectedOrder)}
                            >
                                📥 Download Receipt
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Receipts; 