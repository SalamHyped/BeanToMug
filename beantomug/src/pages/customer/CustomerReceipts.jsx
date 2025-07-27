import React from 'react';
import ReceiptOrders from '../../components/ReceiptOrders';
import styles from './Receipts.module.css';

const CustomerReceipts = () => {
    return (
        <div className={styles.container}>
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>My Order Receipts</h1>
                <p className={styles.pageSubtitle}>View and download your order receipts</p>
            </div>
            
            <ReceiptOrders
                userRole="customer"
                showDownload={true}
                showView={true}
                showPrint={true}
                showSearch={true}
                showDateFilter={true}
                showPagination={true}
                pageSize={20}
                endpoint="/orders/customer/all"
                customFilters={{ userOnly: true }} // Only show current user's orders
            />
        </div>
    );
};

export default CustomerReceipts; 