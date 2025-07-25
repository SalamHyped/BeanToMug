import React from 'react';
import ReceiptOrders from '../../components/ReceiptOrders';
import styles from './Receipts.module.css';

const CustomerReceipts = () => {
    return (
        <ReceiptOrders
            userRole="customer"
            showDownload={true}
            showView={true}
            showSearch={true}
            showDateFilter={true}
            showPagination={true}
            pageSize={20}
            endpoint="/orders/customer/all"
            title="My Order Receipts"
            subtitle="View and download your order receipts"
            className={styles.container}
            customFilters={{ userOnly: true }} // Only show current user's orders
        />
    );
};

export default CustomerReceipts; 