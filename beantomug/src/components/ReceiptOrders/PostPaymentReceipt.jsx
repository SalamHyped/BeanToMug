import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useUser } from '../../context/UserContext/UserContext';
import { useReceiptLogic, generateReceiptContent, downloadReceipt, printReceipt } from './useReceiptLogic';
import styles from './postPaymentReceipt.module.css';

const PostPaymentReceipt = ({ 
    orderId, 
    onClose = null,
    showDownload = true,
    showPrint = true,
    showEmail = false,
    className = ''
}) => {
    const navigate = useNavigate();
    const { user } = useUser();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const { 
        loading: receiptLoading, 
        error: receiptError 
    } = useReceiptLogic(orderId);

    useEffect(() => {
        if (orderId) {
            fetchOrderDetails();
        }
    }, [orderId]);

    const fetchOrderDetails = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Determine endpoint based on user authentication
            const endpoint = user 
                ? `http://localhost:8801/orders/${orderId}`  // Authenticated user
                : `http://localhost:8801/orders/guest/${orderId}`; // Guest user
            
            const response = await axios.get(endpoint, {
                withCredentials: true
            });
            
            if (response.data.success) {
                setOrder(response.data.order);
            } else {
                setError('Failed to fetch order details');
            }
        } catch (err) {
            console.error('Error fetching order:', err);
            
            if (err.response?.status === 401) {
                setError('Please log in to view this receipt');
            } else if (err.response?.status === 404) {
                setError('Order not found or not accessible');
            } else {
                setError('Error loading order details');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        if (order) {
            await downloadReceipt(order);
        }
    };

    const handlePrint = () => {
        if (order) {
            printReceipt(order);
        }
    };

    const handleClose = () => {
        if (onClose) {
            onClose();
        }
    };

    if (loading) {
        return (
            <div className={`${styles.container} ${className}`}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Loading your receipt...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`${styles.container} ${className}`}>
                <div className={styles.error}>
                    <h3>Error Loading Receipt</h3>
                    <p>{error}</p>
                    {error.includes('log in') ? (
                        <button onClick={() => navigate('/login')} className={styles.retryButton}>
                            Go to Login
                        </button>
                    ) : error.includes('not accessible') ? (
                        <div>
                            <p>This receipt may be for a guest order or requires authentication.</p>
                            <button onClick={fetchOrderDetails} className={styles.retryButton}>
                                Try Again
                            </button>
                        </div>
                    ) : (
                        <button onClick={fetchOrderDetails} className={styles.retryButton}>
                            Try Again
                        </button>
                    )}
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className={`${styles.container} ${className}`}>
                <div className={styles.error}>
                    <h3>Order Not Found</h3>
                    <p>We couldn't find the order details.</p>
                </div>
            </div>
        );
    }

    const receiptContent = generateReceiptContent(order);

    return (
        <div className={`${styles.container} ${className}`}>
            {/* Success Header */}
            <div className={styles.successHeader}>
                <div className={styles.successIcon}>✅</div>
                <h1 className={styles.title}>Payment Successful!</h1>
                <p className={styles.subtitle}>Your order has been placed and paid</p>
                <div className={styles.orderInfo}>
                    <span className={styles.orderId}>Order #{orderId}</span>
                    <span className={styles.orderDate}>
                        {new Date(order.created_at || order.createdAt).toLocaleDateString()}
                    </span>
                </div>
            </div>

            {/* Receipt Content */}
            <div className={styles.receiptSection}>
                <h2 className={styles.receiptTitle}>Payment Receipt</h2>
                <div className={styles.receiptContent}>
                    <pre>{receiptContent}</pre>
                </div>
            </div>

            {/* Order Summary */}
            <div className={styles.orderSummary}>
                <h3>Order Summary</h3>
                <div className={styles.summaryGrid}>
                    <div className={styles.summaryItem}>
                        <span className={styles.label}>Order ID:</span>
                        <span className={styles.value}>#{orderId}</span>
                    </div>
                    <div className={styles.summaryItem}>
                        <span className={styles.label}>Order Type:</span>
                        <span className={styles.value}>{order.order_type || order.orderType}</span>
                    </div>
                    <div className={styles.summaryItem}>
                        <span className={styles.label}>Payment Method:</span>
                        <span className={styles.value}>{order.payment_method || 'Not specified'}</span>
                    </div>
                    <div className={styles.summaryItem}>
                        <span className={styles.label}>Total Amount:</span>
                        <span className={styles.value}>${order.total_amount || order.totalAmount}</span>
                    </div>
                    <div className={styles.summaryItem}>
                        <span className={styles.label}>Items:</span>
                        <span className={styles.value}>{(order.items || []).length} items</span>
                    </div>
                    <div className={styles.summaryItem}>
                        <span className={styles.label}>Status:</span>
                        <span className={`${styles.status} ${styles[order.status.toLowerCase()]}`}>
                            {order.status}
                        </span>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className={styles.actions}>
                {showDownload && (
                    <button 
                        onClick={handleDownload} 
                        className={styles.downloadButton}
                        disabled={receiptLoading}
                    >
                        {receiptLoading ? '⏳' : '📥'} Download Receipt
                    </button>
                )}
                
                {showPrint && (
                    <button 
                        onClick={handlePrint} 
                        className={styles.printButton}
                    >
                        🖨️ Print Receipt
                    </button>
                )}
                
                {showEmail && (
                    <button 
                        onClick={() => {/* Email functionality */}} 
                        className={styles.emailButton}
                    >
                        📧 Email Receipt
                    </button>
                )}
                
                <button 
                    onClick={handleClose} 
                    className={styles.closeButton}
                >
                    Continue Shopping
                </button>
            </div>

            {/* Next Steps */}
            <div className={styles.nextSteps}>
                <h3>What's Next?</h3>
                <div className={styles.stepsList}>
                    <div className={styles.step}>
                        <span className={styles.stepNumber}>1</span>
                        <div className={styles.stepContent}>
                            <h4>Order Confirmed</h4>
                            <p>Your order has been received and payment processed</p>
                        </div>
                    </div>
                    <div className={styles.step}>
                        <span className={styles.stepNumber}>2</span>
                        <div className={styles.stepContent}>
                            <h4>Preparing Your Order</h4>
                            <p>Our team is preparing your items</p>
                        </div>
                    </div>
                    <div className={styles.step}>
                        <span className={styles.stepNumber}>3</span>
                        <div className={styles.stepContent}>
                            <h4>Ready for Pickup</h4>
                            <p>We'll notify you when your order is ready</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Error Display */}
            {receiptError && (
                <div className={styles.errorMessage}>
                    <p>⚠️ {receiptError}</p>
                </div>
            )}
        </div>
    );
};

export default PostPaymentReceipt; 