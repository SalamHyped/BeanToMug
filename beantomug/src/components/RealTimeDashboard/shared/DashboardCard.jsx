import React from 'react';
import { Bell, Sparkles } from 'lucide-react';

const DashboardCard = ({ 
    children, 
    title, 
    icon, 
    itemCount, 
    showNewIndicator, 
    isExpanded, 
    onMouseEnter, 
    onMouseLeave 
}) => {
    return (
        <div 
            className={`relative bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl p-4 border border-amber-200/50 overflow-hidden transition-all duration-500 ${
                isExpanded ? 'min-h-80' : 'min-h-56'
            }`}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            {/* Crystal clear background decorations */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-amber-100/20 rounded-full blur-lg animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-12 h-12 bg-amber-100/20 rounded-full blur-md animate-bounce"></div>
            
            <div className="relative z-10">
                {/* Header Section */}
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-amber-200">
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <div className="bg-amber-700 p-1 rounded-md shadow-md transform hover:scale-105 transition-all duration-300">
                                <span className="text-white text-sm">{icon}</span>
                            </div>
                            <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></div>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-amber-800">
                                {title}
                            </h3>
                            <p className="text-xs text-amber-600">{itemCount} items</p>
                        </div>
                    </div>
                    
                    {/* New Item Indicator */}
                    {showNewIndicator && (
                        <div className="bg-amber-600 text-white px-2 py-1 rounded-full text-xs font-bold animate-pulse shadow-md">
                            <span className="flex items-center gap-1">
                                <Bell size={12} />
                                <span>New!</span>
                                <Sparkles size={12} className="animate-ping" />
                            </span>
                        </div>
                    )}
                </div>
                
                {children}
            </div>
        </div>
    );
};

export default DashboardCard; 