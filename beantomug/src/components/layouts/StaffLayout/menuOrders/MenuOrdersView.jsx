import React, { useState, useEffect, useCallback } from 'react';
import { LazyAnimatePresence } from './components/MotionComponents';
import { RefreshCw } from 'lucide-react';
import ToggleSwitch from '../../../controls/ToggleSwitch';
import OrderFilterControls from '../../../controls/OrderFilterControls';
import Pagination from '../../../controls/Pagination';
import OrderCard from './components/OrderCard';
import OrderItem from './components/OrderItem';
import useOrderFiltering from '../../../../hooks/useOrderFiltering';
import { useOrderContext } from './contexts/OrderContext';
import { useOrderWebSocket } from './hooks/useOrderWebSocket';
import { formatLastUpdate } from './utils/orderFormatters';
import { PAGINATION_DEFAULTS, ITEM_DISPLAY } from './constants/orderConstants';
import classes from './menuOrders.module.css';

/**
 * Main view component for MenuOrders
 * Handles layout, filtering, and coordination between components
 */
const MenuOrdersView = () => {
  // Local state for view-specific concerns
  const [showCompleted, setShowCompleted] = useState(false);
  const [currentPage, setCurrentPage] = useState(PAGINATION_DEFAULTS.INITIAL_PAGE);
  const [pageSize, setPageSize] = useState(PAGINATION_DEFAULTS.PAGE_SIZE);

  // Get order context
  const {
    orders,
    setOrders,
    loading,
    error,
    lastFetchTime,
    pagination,
    fetchOrders,
    updateOrderStatus,
    setError,
    draggedItem,
    dragProgress,
    doneOrders,
    setDoneOrders,
    handleDragStart,
    handleDrag,
    handleDragEnd,
    preparedItems,
    expandedOrders,
    toggleItemPrepared,
    toggleExpandedItems,
    getSortedItems
  } = useOrderContext();

  // Use the order filtering hook
  const filtering = useOrderFiltering(orders, {
    enableTimeFilter: true,
    enableSearch: true,
    enableCustomRange: true,
    debounceDelay: 300,
    defaultTimeFilter: 'all'
  });

  const { filteredOrders, filterStats, getApiParams } = filtering;

  // WebSocket setup - MUST be called before any conditional returns to maintain hook order
  // Note: WebSocket handling is now done directly in useOrderWebSocket hook

  // Always call useOrderWebSocket to maintain hook order consistency
  useOrderWebSocket({
    showCompleted,
    setOrders
  });

  // Fetch orders when dependencies change
  useEffect(() => {
    const fetchData = async () => {
      const apiParams = getApiParams();
      const requestParams = {
        ...apiParams,
        status: showCompleted ? 'completed' : 'processing',
        limit: pageSize,
        page: currentPage
      };
      
      await fetchOrders(requestParams);
    };

    fetchData();
  }, [showCompleted, currentPage, pageSize, filtering.timeFilter, filtering.debouncedSearchTerm, filtering.customTimeRange, fetchOrders, getApiParams]);

  // Handle view switching - clear doneOrders when switching views
  useEffect(() => {
    // Clear doneOrders when switching between views to prevent stale state
    setDoneOrders([]);
  }, [showCompleted, setDoneOrders]);

  // Handle order completion
  const handleMarkDone = useCallback(async (order_id) => {
    try {
      // Optimistic UI update - add to done orders for animation
      setDoneOrders(prev => [...prev, order_id]);
      
      // Remove from processing view after animation
      setTimeout(() => {
        setOrders(prev => prev.filter(order => order.order_id !== order_id));
      }, 300);
      
      await updateOrderStatus(order_id, 'completed');
      
      // WebSocket will handle updates for other views
    } catch (err) {
      setError('Failed to update order status');
      
      // Rollback optimistic update on error
      setDoneOrders(prev => prev.filter(id => id !== order_id));
      // Refetch to restore the order
      const apiParams = getApiParams();
      const requestParams = {
        ...apiParams,
        status: 'processing',
        limit: pageSize,
        page: currentPage
      };
      await fetchOrders(requestParams);
    }
  }, [updateOrderStatus, setError, setDoneOrders, setOrders, getApiParams, pageSize, currentPage, fetchOrders]);

  // Handle restore to processing
  const handleToggleBackToProcessing = useCallback(async (order_id) => {
    try {
      // Optimistic UI update - immediately remove from completed view
      if (showCompleted) {
        setOrders(prev => prev.filter(order => order.order_id !== order_id));
      }
      
      await updateOrderStatus(order_id, 'processing');
      
      // WebSocket will handle adding it to processing view
    } catch (err) {
      setError('Failed to update order status');
      
      // Rollback optimistic update on error
      if (showCompleted) {
        // Refetch to restore the order
        const apiParams = getApiParams();
        const requestParams = {
          ...apiParams,
          status: 'completed',
          limit: pageSize,
          page: currentPage
        };
        await fetchOrders(requestParams);
      }
    }
  }, [updateOrderStatus, setError, showCompleted, setOrders, getApiParams, pageSize, currentPage, fetchOrders]);

  // Pagination handlers
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  }, []);

  // Manual refresh
  const handleRefresh = useCallback(() => {
    const apiParams = getApiParams();
    const requestParams = {
      ...apiParams,
      status: showCompleted ? 'completed' : 'processing',
      limit: pageSize,
      page: currentPage
    };
    
    fetchOrders(requestParams);
  }, [fetchOrders, getApiParams, showCompleted, pageSize, currentPage]);

  // Loading state
  if (loading && orders.length === 0) {
    return (
      <div className={classes.container}>
        <div className={classes.loading}>
          <div className={classes.spinner}></div>
          <p>Loading orders...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && orders.length === 0) {
    return (
      <div className={classes.container}>
        <div className={classes.error}>
          <p>{error}</p>
          <button onClick={handleRefresh} className={classes.retryButton}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={classes.container}>
      {/* Header */}
      <div className={classes.header}>
        <div className={classes.instructionText}>
          {showCompleted 
            ? '📋 Viewing completed orders - Click to mark back as processing'
            : '💡 Drag orders to reorder by priority or drag right to mark as done'
          }
        </div>
        <div className={classes.headerControls}>
          <div className={classes.toggleSection}>
            <ToggleSwitch
              isOn={showCompleted}
              onToggle={() => setShowCompleted(!showCompleted)}
              leftLabel="Processing Orders"
              rightLabel="Completed Orders"
            />
          </div>
          <button 
            onClick={handleRefresh} 
            className={classes.refreshButton}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? classes.spinning : ''} />
            Refresh
          </button>
          {lastFetchTime && (
            <span className={classes.lastUpdate}>
              Last updated: {formatLastUpdate(lastFetchTime)}
            </span>
          )}
        </div>
      </div>

      {/* Filter Controls */}
      <OrderFilterControls 
        filtering={filtering}
        options={{
          showStats: true,
          showClearButton: true,
          compact: false
        }}
      />
      
      {/* Orders Grid */}
      {orders.length === 0 ? (
        <div className={classes.emptyState}>
          <div className={classes.emptyIcon}>
            {showCompleted ? '✅' : '📋'}
          </div>
          <h3>
            {showCompleted 
              ? 'No completed orders found'
              : 'No orders to prepare'
            }
          </h3>
          <p>
            {showCompleted 
              ? 'There are no completed orders in the system.'
              : 'All orders are completed or there are no processing orders.'
            }
          </p>
        </div>
      ) : (
        <div className={classes.ordersGrid}>
          <LazyAnimatePresence>
            {orders.map((order) => (
              <OrderCard
                key={order.order_id}
                order={order}
                showCompleted={showCompleted}
                dragState={{
                  draggedItem,
                  dragProgress,
                  doneOrders
                }}
                onDragStart={handleDragStart}
                onDrag={handleDrag}
                onDragEnd={(event, info, order_id) => {
                  handleDragEnd(event, info, order_id);
                }}
                onToggleBackToProcessing={handleToggleBackToProcessing}
              >
                {/* Order Items */}
                <div className={classes.itemsList}>
                  {(() => {
                    const sortedItemsWithIndex = getSortedItems(order.items, order.order_id);
                    const itemsToShow = expandedOrders[order.order_id] 
                      ? sortedItemsWithIndex 
                      : sortedItemsWithIndex.slice(0, ITEM_DISPLAY.INITIAL_ITEMS);
                    
                    return itemsToShow.map(({ item, originalIndex, isPrepared }) => (
                      <OrderItem
                        key={originalIndex}
                        item={item}
                        originalIndex={originalIndex}
                        isPrepared={isPrepared}
                        order_id={order.order_id}
                        toggleItemPrepared={toggleItemPrepared}
                        parentClasses={classes} // Pass parent CSS classes
                      />
                    ));
                  })()}
                  
                  {/* Show More/Less button */}
                  {order.items.length > ITEM_DISPLAY.INITIAL_ITEMS && (
                    <div className={classes.expandToggle}>
                      <button 
                        className={classes.expandButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpandedItems(order.order_id);
                        }}
                      >
                        {expandedOrders[order.order_id] 
                          ? `Hide ${order.items.length - ITEM_DISPLAY.INITIAL_ITEMS} items ↑` 
                          : `Show ${order.items.length - ITEM_DISPLAY.INITIAL_ITEMS} more items ↓`
                        }
                      </button>
                    </div>
                  )}
                </div>
              </OrderCard>
            ))}
          </LazyAnimatePresence>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className={classes.paginationContainer}>
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalCount={pagination.totalCount}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            showPageSizeSelector={true}
            showPageInfo={true}
            variant="default"
          />
        </div>
      )}
    </div>
  );
};

export default MenuOrdersView;
