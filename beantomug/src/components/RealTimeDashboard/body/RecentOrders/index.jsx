import React, { useState, useMemo, useCallback } from 'react';
import { ClipboardList, Clock, Calendar, Package, ChevronDown, ChevronUp, User } from 'lucide-react';
import DashboardCard from '../../shared/DashboardCard';
import ItemDisplay from '../../shared/ItemDisplay';
import EmptyState from '../../shared/EmptyState';

const RecentOrders = ({ orders = [] }) => {
    const [showAll, setShowAll] = useState(false);
    const [expandedOrders, setExpandedOrders] = useState(new Set());
    
    // Memoize display orders to prevent unnecessary recalculations
    const displayOrders = useMemo(() => {
        return showAll ? orders : orders.slice(0, 3);
    }, [orders, showAll]);

    // Memoize status classes function
    const getStatusClasses = useCallback((status) => {
        switch (status?.toLowerCase()) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'processing': return 'bg-amber-100 text-amber-800';
            case 'completed': return 'bg-green-100 text-green-800';
            default: return 'bg-red-100 text-red-800';
        }
    }, []);

    // Memoize toggle function
    const toggleOrderDetails = useCallback((orderId) => {
        setExpandedOrders(prev => {
            const newSet = new Set(prev);
            if (newSet.has(orderId)) {
                newSet.delete(orderId);
            } else {
                newSet.add(orderId);
            }
            return newSet;
        });
    }, []);

    // Memoize show all toggle
    const handleShowAllToggle = useCallback(() => {
        setShowAll(prev => !prev);
    }, []);

    // Memoize order content renderer
    const renderOrderContent = useCallback((order, isExpanded, handleToggle) => {
        // Pre-calculate dates to avoid repeated calculations
        // Backend sends dates as ISO strings with Z (UTC), JavaScript automatically parses them correctly
        const createdDate = new Date(order.created_at || order.createdAt);
        const timeString = createdDate.toLocaleTimeString();
        const dateString = createdDate.toLocaleDateString();
        
        // Pre-calculate order ID
        const orderId = order.order_id || order.orderId;
        const orderType = order.order_type || order.orderType;
        
        // Pre-calculate items for efficiency
        const items = order.items || [];
        const hasItems = Array.isArray(items) && items.length > 0;
        const previewItems = hasItems ? items.slice(0, 2) : [];
        const remainingItems = hasItems ? items.length - 2 : 0;

        return (
            <div className="mb-2 p-2 bg-white/60 backdrop-blur-sm rounded-lg border border-amber-200 shadow-sm hover:shadow-md transition-all duration-300">
                {/* Order Header */}
                <div className="flex justify-between items-center mb-1 pb-1 border-b border-amber-200">
                    <div className="flex items-center gap-1">
                        <ClipboardList size={16} className="text-amber-700" />
                        <span className="px-1 py-0.5 rounded-full text-xs font-bold uppercase shadow-sm bg-amber-100 text-amber-800">
                            {orderType}
                        </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-100 px-1 py-0.5 rounded-full">
                        <Clock size={12} />
                        {timeString}
                    </div>
                </div>
                
                {/* Order Message */}
                <div className="mb-1">
                    <p className="text-xs text-amber-800 line-clamp-2">Order #{orderId} - {orderType}</p>
                </div>

                {/* Order Meta Info */}
                <div className="mt-1 flex flex-wrap gap-1">
                    <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-1 py-0.5 rounded-full">
                        <Calendar size={12} />
                        {dateString}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-100 px-1 py-0.5 rounded-full">
                        <Package size={12} />
                        #{orderId}
                    </span>
                    {/* Customer name if available */}
                    {(order.first_name || order.last_name) && (
                        <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-1 py-0.5 rounded-full">
                            <User size={12} />
                            {[order.first_name, order.last_name].filter(Boolean).join(' ')}
                        </span>
                    )}
                </div>

                {/* Order Items Preview */}
                {hasItems && (
                    <div className="mt-1">
                        <div className="text-xs font-semibold text-amber-700 mb-1">Items:</div>
                        <div className="space-y-0.5">
                            {previewItems.map((item, itemIndex) => (
                                <div key={`${orderId}-item-${itemIndex}`} className="p-0.5 bg-amber-50 rounded border border-amber-100">
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium text-amber-800 text-xs">
                                            {item.item_name} x{item.quantity}
                                        </span>
                                        <span className="text-xs font-semibold text-amber-600">
                                            ${item.price}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {remainingItems > 0 && (
                                <div className="text-xs text-amber-600 italic">
                                    +{remainingItems} more items
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Complete Order Details - Inside the content */}
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
                }`}>
                    <div className="mt-2 space-y-2 border-t border-amber-200 pt-2">
                        <div className="text-xs font-semibold text-amber-800 border-b border-amber-200 pb-1">
                            Complete Order Details
                        </div>
                        
                        {/* All Order Items with Customizations */}
                        {hasItems && items.map((item, itemIndex) => (
                            <div key={`${orderId}-detail-${itemIndex}`} className="p-1.5 bg-white/60 backdrop-blur-sm rounded border border-amber-200 transform transition-all duration-200 hover:scale-[1.02]">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-semibold text-amber-800 text-xs">
                                        {item.item_name} x{item.quantity}
                                    </span>
                                    <span className="text-xs font-semibold text-amber-600">
                                        ${(item.price * item.quantity).toFixed(2)}
                                    </span>
                                </div>
                                
                                {/* Item Customizations/Ingredients */}
                                {item.ingredients && item.ingredients.length > 0 && (
                                    <div className="mt-1">
                                        <span className="text-xs font-medium text-amber-700">Customizations:</span>
                                        <div className="flex flex-wrap gap-0.5 mt-0.5">
                                            {item.ingredients.map((ingredient, ingIndex) => (
                                                <span key={`${orderId}-ingredient-${itemIndex}-${ingIndex}`} className="bg-amber-100 text-amber-700 px-0.5 py-0.5 rounded text-xs transform transition-all duration-150 hover:scale-105">
                                                    {ingredient.ingredient_name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {/* Item Options */}
                                {item.options && Object.keys(item.options).length > 0 && (
                                    <div className="mt-1">
                                        <span className="text-xs font-medium text-amber-700">Options:</span>
                                        <div className="flex flex-wrap gap-0.5 mt-0.5">
                                            {Object.entries(item.options).map(([key, option]) => (
                                                option && option.selected && (
                                                    <span key={`${orderId}-option-${itemIndex}-${key}`} className="bg-amber-100 text-amber-700 px-0.5 py-0.5 rounded text-xs transform transition-all duration-150 hover:scale-105">
                                                        {option.label}: {option.value}
                                                    </span>
                                                )
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        
                        {/* Order Summary */}
                        <div className="mt-2 p-1.5 bg-white/60 backdrop-blur-sm rounded border border-amber-200 transform transition-all duration-200 hover:shadow-md">
                            <div className="text-xs font-semibold text-amber-800 mb-1">Order Summary</div>
                            <div className="space-y-0.5 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-amber-700">Status:</span>
                                    <span className={`${getStatusClasses(order.status)}`}>
                                        {order.status}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-amber-700">Type:</span>
                                    <span className="text-amber-800">{orderType}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-amber-700">Total:</span>
                                    <span className="text-amber-800">${order.total_amount || '0.00'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-amber-700">Items:</span>
                                    <span className="text-amber-800">{items.length}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Show Details Button - Inside the content */}
                <div className="flex justify-center mt-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleToggle();
                        }}
                        className="flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors duration-200"
                    >
                        <span>{isExpanded ? 'Show Less' : 'Show Details'}</span>
                        {isExpanded ? (
                            <ChevronUp size={12} className="transition-transform duration-200" />
                        ) : (
                            <ChevronDown size={12} className="transition-transform duration-200" />
                        )}
                    </button>
                </div>
            </div>
        );
    }, [getStatusClasses]);

    return (
        <DashboardCard
            title="Recent Orders"
            icon={<ClipboardList size={20} />}
            itemCount={orders.length}
        >
            <div className="space-y-1">
                {orders.length === 0 ? (
                    <EmptyState icon={<ClipboardList size={32} />} message="No recent orders" />
                ) : (
                    <>
                        {displayOrders.map((order) => (
                            <ItemDisplay
                                key={order.order_id || order.orderId}
                                item={order}
                                itemId={order.order_id || order.orderId}
                                isExpanded={expandedOrders.has(order.order_id || order.orderId)}
                                onToggleDetails={toggleOrderDetails}
                                renderItemContent={renderOrderContent}
                            />
                        ))}
                        {orders.length > 3 && (
                            <button
                                onClick={handleShowAllToggle}
                                className="w-full mt-1 p-1.5 text-xs font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors duration-200"
                            >
                                {showAll ? 'Show Less' : `Show All (${orders.length})`}
                            </button>
                        )}
                    </>
                )}
            </div>
        </DashboardCard>
    );
};

export default React.memo(RecentOrders);
