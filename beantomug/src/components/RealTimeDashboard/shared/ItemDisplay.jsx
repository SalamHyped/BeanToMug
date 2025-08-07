import React, { useState, useCallback } from 'react';

const ItemDisplay = ({
    item,
    itemId,
    isNew = false,
    isExpanded = false,
    onToggleDetails,
    renderItemContent
}) => {
    const [isExpandedLocal, setIsExpandedLocal] = useState(isExpanded);

    const handleToggle = useCallback(() => {
        const newExpandedState = !isExpandedLocal;
        setIsExpandedLocal(newExpandedState);
        if (onToggleDetails) {
            onToggleDetails(itemId);
        }
    }, [isExpandedLocal, onToggleDetails, itemId]);

    return (
        <div className={`relative transition-all duration-500 ease-in-out transform bg-[#BFA6A0]
${
            isNew ? 'animate-pulse' : ''
        } hover:scale-[1.01]`}>
            {/* Main Item Content with integrated details and Show Details button */}
            <div className="cursor-pointer transition-all duration-300 hover:shadow-lg" onClick={handleToggle}>
                {renderItemContent && renderItemContent(item, isExpandedLocal, handleToggle)}
            </div>
        </div>
    );
};

export default React.memo(ItemDisplay); 