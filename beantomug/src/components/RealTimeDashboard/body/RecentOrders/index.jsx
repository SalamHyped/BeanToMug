import React from 'react';
import { useDashboardComponent } from '../../../../hooks/useDashboardComponent';
import DashboardCard from '../../shared/DashboardCard';
import NavigationDots from '../../shared/NavigationDots';
import ItemDisplay from '../../shared/ItemDisplay';
import EmptyState from '../../shared/EmptyState';

const RecentOrders = ({ orders = [] }) => {
    const {
        expandedItems: expandedOrders,
        showNewItemIndicator: showNewOrderIndicator,
        newItemIds: newOrderIds,
        currentIndex,
        isSliding,
        slideDirection,
        toggleItemDetails: toggleOrderItems,
        handleDotClick,
        handleMouseEnter,
        handleMouseLeave,
        currentItem: currentOrder
    } = useDashboardComponent(orders, 'orderId');

    const renderOrderContent = (order) => (
        <>
            {/* Order Header */}
            <div className="flex justify-between items-center mb-2 pb-1 border-b border-amber-200">
                <div className="flex items-center gap-1">
                    <span className="bg-amber-700 text-white px-1 py-0.5 rounded text-xs font-bold shadow-sm transform hover:scale-110 transition-all duration-300">
                        #{order.order_id || order.orderId}
                    </span>
                    <span className={`px-1 py-0.5 rounded-full text-xs font-bold uppercase shadow-sm ${getStatusClasses(order.status)}`}>
                        {order.status}
                    </span>
                </div>
                <div className="text-xs text-amber-600 bg-amber-100 px-1 py-0.5 rounded-full">
                    {new Date(order.created_at || order.createdAt).toLocaleTimeString()}
                </div>
            </div>
            
            {/* Order Details */}
            <div className="flex justify-between items-center mb-2 pb-1 border-b border-amber-200">
                <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-1 py-0.5 rounded-full">
                    {order.order_type || order.orderType}
                </span>
                <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-1 py-0.5 rounded-full">
                    <span className="animate-spin">🕒</span>
                    <span>{new Date(order.created_at || order.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
        </>
    );

    const renderOrderDetails = (order) => (
        <div className="flex flex-col gap-1">
            {order.items && Array.isArray(order.items) && order.items.map((item, itemIndex) => (
                <div key={itemIndex} className="p-1 bg-white rounded border border-l border-amber-500 shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-105">
                    <div className="flex justify-between items-start mb-1 pb-0.5 border-b border-amber-200">
                        <span className="font-bold text-amber-800 text-xs hover:text-amber-600 transition-colors duration-300">
                            {item.item_name} x{item.quantity}
                        </span>
                        <span className="text-xs font-semibold text-amber-600 bg-amber-100 px-0.5 py-0 rounded-full">
                            ${item.price}
                        </span>
                    </div>
                    {item.ingredients && item.ingredients.length > 0 && (
                        <div className="flex flex-wrap gap-0.5 pt-0.5 border-t border-amber-100">
                            {item.ingredients.map((ingredient, ingIndex) => (
                                <span key={ingIndex} className="bg-amber-100 text-amber-700 px-1 py-0 rounded-full text-xs font-medium shadow-sm hover:shadow-md hover:scale-110 transition-all duration-300 transform hover:rotate-1">
                                    {ingredient.ingredient_name}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );

    const getStatusClasses = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'processing': return 'bg-amber-100 text-amber-800';
            case 'completed': return 'bg-green-100 text-green-800';
            default: return 'bg-red-100 text-red-800';
        }
    };

    return (
        <DashboardCard
            title="Recent Orders"
            icon="🛒"
            itemCount={orders.length}
            showNewIndicator={showNewOrderIndicator}
            isExpanded={expandedOrders.size > 0}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Single Order Display */}
            <div className={`relative overflow-hidden transition-all duration-500 ${
                expandedOrders.size > 0 ? 'min-h-40' : 'h-32'
            }`}>
                {orders.length === 0 ? (
                    <EmptyState icon="📋" message="No recent orders" />
                ) : currentOrder ? (
                    <ItemDisplay
                        item={currentOrder}
                        itemId={currentOrder.order_id || currentOrder.orderId}
                        isNew={newOrderIds.has(currentOrder.order_id || currentOrder.orderId)}
                        isSliding={isSliding}
                        slideDirection={slideDirection}
                        isExpanded={expandedOrders.has(currentOrder.order_id || currentOrder.orderId)}
                        onToggleDetails={toggleOrderItems}
                        renderItemContent={renderOrderContent}
                        renderExpandedContent={renderOrderDetails}
                    />
                ) : null}
            </div>
            
            <NavigationDots
                items={orders}
                currentIndex={currentIndex}
                onDotClick={handleDotClick}
            />
        </DashboardCard>
    );
};

export default RecentOrders;
