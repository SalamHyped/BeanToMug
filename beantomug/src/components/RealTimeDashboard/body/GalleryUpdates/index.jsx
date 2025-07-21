import React from 'react';
import { useDashboardComponent } from '../../../../hooks/useDashboardComponent';
import DashboardCard from '../../shared/DashboardCard';
import NavigationDots from '../../shared/NavigationDots';
import ItemDisplay from '../../shared/ItemDisplay';
import EmptyState from '../../shared/EmptyState';

const GalleryUpdates = ({ galleryUpdates = [] }) => {
    const {
        expandedItems: expandedItems,
        showNewItemIndicator: showNewItemIndicator,
        newItemIds: newItemIds,
        currentIndex,
        isSliding,
        slideDirection,
        toggleItemDetails: toggleItemDetails,
        handleDotClick,
        handleMouseEnter,
        handleMouseLeave,
        currentItem: currentItem
    } = useDashboardComponent(galleryUpdates, 'id');

    const renderItemContent = (item) => (
        <>
            {/* Item Header */}
            <div className="flex justify-between items-center mb-2 pb-1 border-b border-amber-200">
                <div className="flex items-center gap-1">
                    <span className="bg-amber-700 text-white px-1 py-0.5 rounded text-xs font-bold shadow-sm transform hover:scale-110 transition-all duration-300">
                        #{item.id}
                    </span>
                    <span className="px-1 py-0.5 rounded-full text-xs font-bold uppercase shadow-sm bg-blue-100 text-blue-800">
                        {item.fileType?.startsWith('image/') ? 'Image' : 'Video'}
                    </span>
                </div>
                <div className="text-xs text-amber-600 bg-amber-100 px-1 py-0.5 rounded-full">
                    {new Date(item.publishDate).toLocaleTimeString()}
                </div>
            </div>
            
            {/* Item Details */}
            <div className="flex justify-between items-center mb-2 pb-1 border-b border-amber-200">
                <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-1 py-0.5 rounded-full">
                    {item.fileType?.startsWith('image/') ? '📷 Image' : '🎥 Video'}
                </span>
                <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-1 py-0.5 rounded-full">
                    <span className="animate-spin">🕒</span>
                    <span>{new Date(item.publishDate).toLocaleDateString()}</span>
                </div>
            </div>
        </>
    );

    const renderItemDetails = (item) => (
        <div className="p-2 bg-white rounded border border-amber-200 shadow-sm">
            <p className="text-xs text-amber-800 mb-2">{item.description}</p>
            <div className="flex flex-wrap gap-1">
                <span className="text-xs text-amber-600 bg-amber-100 px-1 py-0.5 rounded-full">
                    Type: {item.fileType}
                </span>
                <span className="text-xs text-amber-600 bg-amber-100 px-1 py-0.5 rounded-full">
                    Size: {item.fileSize || 'Unknown'}
                </span>
            </div>
        </div>
    );

    return (
        <DashboardCard
            title="Gallery Updates"
            icon="🖼️"
            itemCount={galleryUpdates.length}
            showNewIndicator={showNewItemIndicator}
            isExpanded={expandedItems.size > 0}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Single Item Display */}
            <div className={`relative overflow-hidden transition-all duration-500 ${
                expandedItems.size > 0 ? 'min-h-40' : 'h-32'
            }`}>
                {galleryUpdates.length === 0 ? (
                    <EmptyState icon="🖼️" message="No recent uploads" />
                ) : currentItem ? (
                    <ItemDisplay
                        item={currentItem}
                        itemId={currentItem.id}
                        isNew={newItemIds.has(currentItem.id)}
                        isSliding={isSliding}
                        slideDirection={slideDirection}
                        isExpanded={expandedItems.has(currentItem.id)}
                        onToggleDetails={toggleItemDetails}
                        renderItemContent={renderItemContent}
                        renderExpandedContent={renderItemDetails}
                    />
                ) : null}
            </div>
            
            <NavigationDots
                items={galleryUpdates}
                currentIndex={currentIndex}
                onDotClick={handleDotClick}
            />
        </DashboardCard>
    );
};

export default GalleryUpdates; 