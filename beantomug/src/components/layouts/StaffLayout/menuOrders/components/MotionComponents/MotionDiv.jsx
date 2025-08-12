import React, { useEffect, useState } from 'react';

// Props that should only be passed to Framer Motion components
const FRAMER_MOTION_PROPS = [
  'layout', 'drag', 'dragConstraints', 'dragElastic', 'dragMomentum',
  'whileDrag', 'initial', 'animate', 'exit', 'transition',
  'onDragStart', 'onDrag', 'onDragEnd', 'onAnimationStart',
  'onAnimationComplete', 'onUpdate', 'onLayoutAnimationComplete'
];

const MotionDiv = ({ children, className, style, ...props }) => {
  const [MotionComponent, setMotionComponent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFramerMotion = async () => {
      try {
        // Dynamically import Framer Motion
        const { motion } = await import('framer-motion');
        setMotionComponent(() => motion.div);
        setIsLoading(false);
      } catch (error) {
        console.warn('Framer Motion failed to load, using fallback:', error);
        setIsLoading(false);
      }
    };

    loadFramerMotion();
  }, []);

  // Filter out Framer Motion props for fallback components
  const filterFramerMotionProps = (allProps) => {
    const filteredProps = {};
    const framerMotionProps = {};
    
    Object.keys(allProps).forEach(key => {
      if (FRAMER_MOTION_PROPS.includes(key)) {
        framerMotionProps[key] = allProps[key];
      } else {
        filteredProps[key] = allProps[key];
      }
    });
    
    return { filteredProps, framerMotionProps };
  };

  const { filteredProps, framerMotionProps } = filterFramerMotionProps(props);

  // Show loading state while Framer Motion loads
  if (isLoading) {
    return (
      <div 
        className={className} 
        style={{
          transition: 'all 0.3s ease',
          ...style
        }}
        {...filteredProps}
      >
        {children}
      </div>
    );
  }

  // If Framer Motion loaded successfully, use it with all props
  if (MotionComponent) {
    return (
      <MotionComponent
        className={className}
        style={style}
        {...props} // Pass all props including Framer Motion ones
      >
        {children}
      </MotionComponent>
    );
  }

  // Fallback to regular div with CSS transitions (only non-Framer Motion props)
  return (
    <div 
      className={className} 
      style={{
        transition: 'all 0.3s ease',
        ...style
      }}
      {...filteredProps}
    >
      {children}
    </div>
  );
};

export default MotionDiv;
