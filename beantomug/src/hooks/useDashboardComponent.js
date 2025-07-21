import { useState, useEffect, useRef } from 'react';

export const useDashboardComponent = (items, itemIdKey = 'id') => {
    const [expandedItems, setExpandedItems] = useState(new Set());
    const [showNewItemIndicator, setShowNewItemIndicator] = useState(false);
    const [newItemIds, setNewItemIds] = useState(new Set());
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isSliding, setIsSliding] = useState(false);
    const [slideDirection, setSlideDirection] = useState('left');
    const [isHovered, setIsHovered] = useState(false);
    
    const listRef = useRef(null);
    const prevItemsLengthRef = useRef(items.length);
    const slideIntervalRef = useRef(null);

    // Single item sliding mechanism
    useEffect(() => {
        if (items.length > 1 && !isHovered) {
            slideIntervalRef.current = setInterval(() => {
                setIsSliding(true);
                setSlideDirection('left');
                
                setTimeout(() => {
                    setCurrentIndex(prev => (prev + 1) % items.length);
                    setIsSliding(false);
                }, 300);
            }, 3000);
            
            return () => {
                if (slideIntervalRef.current) {
                    clearInterval(slideIntervalRef.current);
                }
            };
        }
    }, [items.length, isHovered]);

    // Reset sliding state if items change
    useEffect(() => {
        setIsSliding(false);
    }, [items]);

    // Track new items for animation
    useEffect(() => {
        if (items.length > prevItemsLengthRef.current) {
            const newItems = items.slice(0, items.length - prevItemsLengthRef.current);
            const newItemIdsSet = new Set(newItems.map(item => item[itemIdKey]));
            setNewItemIds(newItemIdsSet);
            
            setTimeout(() => {
                setNewItemIds(new Set());
            }, 2000);
        }
        prevItemsLengthRef.current = items.length;
    }, [items, itemIdKey]);

    // Show new item indicator
    useEffect(() => {
        if (items.length > prevItemsLengthRef.current) {
            setShowNewItemIndicator(true);
            setTimeout(() => {
                setShowNewItemIndicator(false);
            }, 4000);
        }
    }, [items.length]);

    // Cleanup timers on unmount
    useEffect(() => {
        return () => {
            if (slideIntervalRef.current) {
                clearInterval(slideIntervalRef.current);
            }
        };
    }, []);

    const toggleItemDetails = (itemId) => {
        setExpandedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(itemId)) {
                newSet.delete(itemId);
            } else {
                newSet.add(itemId);
            }
            return newSet;
        });
    };

    const getCurrentItem = () => {
        if (items.length === 0) return null;
        return items[currentIndex];
    };

    const handleDotClick = (index) => {
        setCurrentIndex(index);
        setIsSliding(false);
    };

    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => setIsHovered(false);

    return {
        // State
        expandedItems,
        showNewItemIndicator,
        newItemIds,
        currentIndex,
        isSliding,
        slideDirection,
        isHovered,
        
        // Refs
        listRef,
        
        // Functions
        toggleItemDetails,
        getCurrentItem,
        handleDotClick,
        handleMouseEnter,
        handleMouseLeave,
        
        // Current item
        currentItem: getCurrentItem()
    };
}; 