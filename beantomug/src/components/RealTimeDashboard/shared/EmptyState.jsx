import React from 'react';
import { Inbox } from 'lucide-react';

const EmptyState = ({ icon, message }) => {
    return (
        <div className="text-center py-6 border-2 border-dashed border-amber-300 rounded-lg bg-white/50">
            <div className="text-amber-400 mb-1 animate-bounce">
                {icon || <Inbox size={32} />}
            </div>
            <p className="text-amber-500 italic text-xs animate-pulse">{message}</p>
        </div>
    );
};

export default EmptyState; 