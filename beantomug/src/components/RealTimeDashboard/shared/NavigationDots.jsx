import React from 'react';

const NavigationDots = ({ 
    items, 
    currentIndex, 
    onDotClick 
}) => {
    if (items.length <= 1) return null;

    return (
        <div className="absolute bottom-0.2 left-1/2 transform -translate-x-1/2 flex justify-center gap-2 mt-2 z-20">
            {items.map((_, index) => (
                <button
                    key={index}
                        className={`w-1 h-1 rounded-full transition-transform duration-200 cursor-pointer ${
                        index === currentIndex
                          ? 'bg-amber-800 scale-100'
                          : 'bg-amber-300 hover:scale-110'
                      }`}
                    onClick={() => onDotClick(index)}
                />
            ))}
        </div>
    );
};

export default NavigationDots; 