import React from 'react';

const EmptyState = ({ icon, message }) => {
    return (
        <div className="text-center py-6 border-2 border-dashed border-amber-300 rounded-lg bg-white/50">
            <div className="text-amber-400 text-3xl mb-1 animate-bounce">{icon}</div>
            <p className="text-amber-500 italic text-xs animate-pulse">{message}</p>
        </div>
    );
};

export default EmptyState; 