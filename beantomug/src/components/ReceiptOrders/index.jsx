import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useUser } from '../../context/UserContext/UserContext';
import Pagination from '../controls/Pagination';
import { useReceiptLogic, generateReceiptContent } from './useReceiptLogic';
import OrderFilterControls from '../controls/OrderFilterControls';
import useOrderFiltering from '../../hooks/useOrderFiltering';
import styles from './receiptOrders.module.css';

// Prop validation
const validateProps = (props) => {
    const { userRole, pageSize, showDownload, showView, showPrint, showSearch, showDateFilter, showPagination } = props;
    
    const errors = [];
    
    if (!['staff', 'customer'].includes(userRole)) {
        errors.push(`Invalid userRole: ${userRole}. Must be 'staff' or 'customer'`);
    }
    
    if (typeof pageSize !== 'number' || pageSize < 1 || pageSize > 100) {
        errors.push(`Invalid pageSize: ${pageSize}. Must be between 1 and 100`);
    }
    
    if (typeof showDownload !== 'boolean') {
        errors.push(`Invalid showDownload: ${showDownload}. Must be boolean`);
    }
    
    if (typeof showView !== 'boolean') {
        errors.push(`Invalid showView: ${showView}. Must be boolean`);
    }
    
    if (typeof showPrint !== 'boolean') {
        errors.push(`Invalid showPrint: ${showPrint}. Must be boolean`);
    }
    
    if (typeof showSearch !== 'boolean') {
        errors.push(`Invalid showSearch: ${showSearch}. Must be boolean`);
    }
    
    if (typeof showDateFilter !== 'boolean') {
        errors.push(`Invalid showDateFilter: ${showDateFilter}. Must be boolean`);
    }
    
    if (typeof showPagination !== 'boolean') {
        errors.push(`Invalid showPagination: ${showPagination}. Must be boolean`);
    }
    
    return errors;
};

// Error Boundary Component
const ErrorBoundary = ({ children, fallback }) => {
    const [hasError, setHasError] = useState(false);
    const [error, setError] = useState(null);

    if (hasError) {
        return fallback || (
            <div className={styles.error}>
                <h3>Something went wrong</h3>
                <p>{error?.message || 'An unexpected error occurred'}</p>
                <button onClick={() => window.location.reload()} className={styles.retryButton}>
                    Reload Page
                </button>
            </div>
        );
    }

    return (
        <React.Suspense fallback={<div className={styles.loading}>Loading...</div>}>
            {children}
        </React.Suspense>
    );
};

const ReceiptOrders = ({ 
    userRole = 'staff',
    showDownload = true,
    showView = true,
    showPrint = true,
    showSearch = true,
    showDateFilter = true,
    showPagination = true,
    pageSize = 20,
    title = 'Order Receipts',
    subtitle = 'View and download order receipts',
    className = '',
    onOrderClick = null,
    customFilters = null
}) => {
    const navigate = useNavigate();
    const { user } = useUser();
    const searchInputRef = useRef(null);

    // Validate props
    const propErrors = useMemo(() => validateProps({ userRole, pageSize, showDownload, showView, showPrint, showSearch, showDateFilter, showPagination }), 
        [userRole, pageSize, showDownload, showView, showPrint, showSearch, showDateFilter, showPagination]);

    if (propErrors.length > 0) {
        console.error('ReceiptOrders prop validation errors:', propErrors);
        return (
            <div className={`${styles.container} ${className}`}>
                <div className={styles.error}>
                    <h3>Configuration Error</h3>
                    <p>Invalid component configuration. Please contact support.</p>
                    <details>
                        <summary>Error Details</summary>
                        <ul>
                            {propErrors.map((error, index) => (
                                <li key={`prop-error-${index}`}>{error}</li>
                            ))}
                        </ul>
                    </details>
                </div>
            </div>
        );
    }

    // Authentication check
    if (!user) {
        return (
            <div className={`${styles.container} ${className}`}>
                <div className={styles.error}>
                    <h3>Authentication Required</h3>
                    <p>Please log in to view your order receipts.</p>
                    <button onClick={() => navigate('/login')} className={styles.retryButton}>
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    // Optimized state management
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        limit: pageSize,
        hasNextPage: false,
        hasPrevPage: false
    });
    const [currentPage, setCurrentPage] = useState(1);

    // Use the order filtering hook
    const filtering = useOrderFiltering(orders, {
        enableTimeFilter: showDateFilter,
        enableSearch: showSearch,
        enableCustomRange: true,
        debounceDelay: 300,
        defaultTimeFilter: 'all'
    });

    const { filteredOrders, filterStats, getApiParams } = filtering;

    // Use shared receipt logic
    const { downloadReceipt, viewReceipt, printReceipt } = useReceiptLogic();

    // Memoized API endpoint
    const apiEndpoint = useMemo(() => {
        if (userRole === 'customer') {
            return '/orders/customer/all';
        } else if (userRole === 'staff') {
            return '/orders/staff/all';
        } else {
            return '/orders/customer/all'; // Safe fallback
        }
    }, [userRole]);

    // Memoized request params
    const requestParams = useMemo(() => {
        const baseParams = {
            page: currentPage,
            limit: pageSize,
            ...(customFilters && customFilters)
        };
        
        // Add filtering parameters from the hook
        const filterParams = getApiParams();
        return { ...baseParams, ...filterParams };
    }, [currentPage, pageSize, customFilters, getApiParams]);

    // Memoized fetch function
    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await axios.get(`http://localhost:8801${apiEndpoint}`, {
                params: requestParams,
                withCredentials: true,
                timeout: 10000 // 10 second timeout
            });
            
            if (response.data.success) {
                const orders = response.data.orders || [];
                setOrders(orders);
                setPagination(response.data.pagination || {
                    currentPage: 1,
                    totalPages: 1,
                    totalCount: 0,
                    limit: pageSize,
                    hasNextPage: false,
                    hasPrevPage: false
                });
            } else {
                setError('Failed to fetch orders');
            }
        } catch (err) {
            console.error('Error fetching orders:', err);
            
            if (err.response?.status === 401) {
                setError('Please log in to view receipts');
            } else if (err.code === 'ECONNABORTED') {
                setError('Request timeout. Please try again.');
            } else {
                setError('Error loading orders. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    }, [apiEndpoint, requestParams, pageSize]);

    // Fetch orders when dependencies change
    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    // Memoized handlers
    const closeReceipt = useCallback(() => {
        setSelectedOrder(null);
    }, []);

    const handleOrderClick = useCallback((order) => {
        if (onOrderClick) {
            onOrderClick(order);
        } else {
            viewReceipt(order);
        }
    }, [onOrderClick, viewReceipt]);

    const handlePageChange = useCallback((page) => {
        setCurrentPage(page);
    }, []);

    // Memoized loading state
    if (loading) {
        return (
            <div className={`${styles.container} ${className}`}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Loading orders...</p>
                </div>
            </div>
        );
    }

    // Memoized error state
    if (error) {
        return (
            <div className={`${styles.container} ${className}`}>
                <div className={styles.error}>
                    <h3>Error Loading Orders</h3>
                    <p>{error}</p>
                    {error.includes('log in') ? (
                        <button onClick={() => navigate('/login')} className={styles.retryButton}>
                            Go to Login
                        </button>
                    ) : (
                        <button onClick={fetchOrders} className={styles.retryButton}>
                            Retry
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <ErrorBoundary fallback={
            <div className={`${styles.container} ${className}`}>
                <div className={styles.error}>
                    <h3>Component Error</h3>
                    <p>Something went wrong with the receipts component.</p>
                    <button onClick={() => window.location.reload()} className={styles.retryButton}>
                        Reload
                    </button>
                </div>
            </div>
        }>
            <div className={`${styles.container} ${className}`}>
                {/* Header */}
                <div className={styles.header}>
                    <h1 className={styles.title}>{title}</h1>
                    <p className={styles.subtitle}>{subtitle}</p>
                </div>

                {/* Search and Filter Controls */}
                <div className={styles.controls}>
                    {/* Use the reusable filter controls component */}
                    <OrderFilterControls 
                        filtering={filtering}
                        options={{
                            showStats: true,
                            showClearButton: true,
                            compact: false
                        }}
                    />
                </div>

                {/* Receipts Grid */}
                <div className={styles.receiptsGrid}>
                    {filteredOrders.length === 0 ? (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>📋</div>
                            <h3>No Receipts Found</h3>
                            <p>
                                {orders.length === 0 
                                    ? 'No order receipts available.'
                                    : 'No order receipts match your current filters.'
                                }
                            </p>
                        </div>
                    ) : (
                        <div className={styles.gridContainer}>
                            {filteredOrders.map((order, index) => (
                                <div 
                                    key={order.order_id} 
                                    className={styles.receiptCard}
                                    style={{ '--card-index': index }}
                                >
                                    {/* Receipt Header */}
                                    <div className={styles.receiptHeader}>
                                        <div className={styles.receiptId}>
                                            <span className={styles.receiptNumber}>#{order.order_id || order.id || order.orderId}</span>
                                            <span className={`${styles.statusBadge} ${styles[order.status?.toLowerCase() || 'default']}`}>
                                                {order.status || 'Unknown'}
                                            </span>
                                        </div>
                                        <div className={styles.receiptDate}>
                                            <div className={styles.dateMain}>
                                                {new Date(order.created_at).toLocaleDateString()}
                                            </div>
                                            <div className={styles.dateTime}>
                                                {new Date(order.created_at).toLocaleTimeString()}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Customer Info */}
                                    <div className={styles.customerSection}>
                                        <div className={styles.customerName}>
                                            {order.customer_name || 
                                             order.customerName || 
                                             (order.first_name && order.last_name ? `${order.first_name} ${order.last_name}` : order.first_name || order.last_name || 'Customer')}
                                        </div>
                                        <div className={styles.customerEmail}>
                                            {order.customer_email || 
                                             order.customerEmail || 
                                             order.email || 
                                             'No email'}
                                        </div>
                                    </div>

                                    {/* Order Details */}
                                    <div className={styles.orderDetails}>
                                        <div className={styles.orderType}>
                                            <span className={`${styles.typeBadge} ${styles[order.order_type?.toLowerCase() || 'default']}`}>
                                                {order.order_type || order.orderType || 'Standard'}
                                            </span>
                                        </div>
                                        
                                        <div className={styles.itemsSection}>
                                            <div className={styles.itemsCount}>
                                                {order.items?.length || 0} items
                                            </div>
                                            {order.items && order.items.length > 0 ? (
                                                <div className={styles.itemsList}>
                                                    {order.items.slice(0, 3).map((item, index) => (
                                                        <div key={item.order_item_id || index} className={styles.itemPreview}>
                                                            <span className={styles.itemName}>
                                                                {item.item_name || item.name || `Item ${index + 1}`}
                                                            </span>
                                                            <span className={styles.itemQuantity}>
                                                                x{item.quantity || 1}
                                                            </span>
                                                        </div>
                                                    ))}
                                                    {order.items.length > 3 && (
                                                        <div className={styles.moreItems}>
                                                            +{order.items.length - 3} more items
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className={styles.noItems}>
                                                    No items found
                                                </div>
                                            )}
                                        </div>

                                        <div className={styles.paymentInfo}>
                                            <div className={styles.paymentMethod}>
                                                <span className={styles.paymentLabel}>Payment:</span>
                                                <span className={styles.paymentValue}>
                                                    {order.payment_method || order.paymentMethod || 'N/A'}
                                                </span>
                                            </div>
                                            <div className={styles.paymentStatus}>
                                                <span className={`${styles.statusBadge} ${styles[order.payment_status?.toLowerCase() || 'default']}`}>
                                                    {order.payment_status || order.paymentStatus || 'N/A'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className={styles.totalSection}>
                                            <div className={styles.totalLabel}>Total Amount</div>
                                            <div className={styles.totalAmount}>
                                                ${order.total_amount || order.totalAmount || '0.00'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className={styles.receiptActions}>
                                        {showView && (
                                            <button
                                                onClick={() => handleOrderClick(order)}
                                                className={styles.viewButton}
                                                title="View Receipt"
                                            >
                                                👁️ View Receipt
                                            </button>
                                        )}
                                        {showPrint && (
                                            <button
                                                onClick={() => printReceipt(order)}
                                                className={styles.printButton}
                                                title="Print Receipt"
                                            >
                                                🖨️ Print
                                            </button>
                                        )}
                                        {showDownload && (
                                            <button
                                                onClick={() => downloadReceipt(order)}
                                                className={styles.downloadButton}
                                                title="Download Receipt"
                                            >
                                                📥 Download
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {showPagination && pagination.totalPages > 1 && (
                    <div className={styles.paginationContainer}>
                        <Pagination
                            currentPage={pagination.currentPage}
                            totalPages={pagination.totalPages}
                            onPageChange={handlePageChange}
                            variant="default"
                        />
                    </div>
                )}

                {/* Receipt Modal */}
                {selectedOrder && (
                    <div className={styles.modal}>
                        <div className={styles.modalContent}>
                            <button onClick={closeReceipt} className={styles.closeButton}>
                                ×
                            </button>
                            <div className={styles.receiptContent}>
                                {generateReceiptContent(selectedOrder)}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ErrorBoundary>
    );
};

export default ReceiptOrders; 