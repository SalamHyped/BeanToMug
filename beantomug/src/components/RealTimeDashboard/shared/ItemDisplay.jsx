import React from 'react';

const ItemDisplay = ({ 
    item, 
    itemId, 
    isNew, 
    isSliding, 
    slideDirection, 
    isExpanded, 
    onToggleDetails,
    renderItemContent,
    renderExpandedContent
}) => {
    return (
        <div className={`transition-all duration-300 ease-in-out ${
            isSliding 
                ? slideDirection === 'left' 
                    ? 'transform -translate-x-full opacity-0' 
                    : 'transform translate-x-full opacity-0'
                : 'transform translate-x-0 opacity-100'
        }`}>
            <div className={`bg-white rounded-lg p-3 shadow-md border border-l-2 transform hover:scale-105 transition-all duration-300 ${
                isNew
                    ? 'border-amber-500 border-l-amber-500 bg-amber-50 shadow-lg animate-pulse' 
                    : 'border-amber-300 border-l-amber-500 hover:border-amber-400 hover:border-l-amber-600'
            }`}>
                <div className="relative z-10">
                    {renderItemContent(item)}
                    
                    {renderExpandedContent && (
                        <div className="mt-2 pt-1 border-t border-amber-200">
                            <button 
                                className="w-full bg-amber-50 hover:bg-amber-100 border border-amber-200 p-1 cursor-pointer flex justify-between items-center text-amber-700 text-xs rounded transition-all duration-300 font-semibold shadow-sm hover:shadow-md transform hover:scale-105"
                                onClick={() => onToggleDetails(itemId)}
                            >
                                <span className="flex items-center gap-1">
                                    <span className="animate-bounce">📋</span>
                                    <span>
                                        {isExpanded ? 'Hide Details' : 'Show Details'}
                                    </span>
                                </span>
                                <span className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                            </button>
                            
                            {isExpanded && (
                                <div className="mt-2 p-2 bg-amber-50 rounded border border-amber-200 shadow-sm">
                                    {renderExpandedContent(item)}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ItemDisplay; 