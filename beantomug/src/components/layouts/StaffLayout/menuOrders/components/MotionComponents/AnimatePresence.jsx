import React, { useEffect, useState } from 'react';

// Props that should only be passed to Framer Motion AnimatePresence
const FRAMER_MOTION_PROPS = [
  'mode', 'initial', 'onExitComplete', 'onEnterComplete',
  'onAnimationStart', 'onAnimationComplete', 'onUpdate'
];

const AnimatePresence = ({ children, ...props }) => {
  const [AnimatePresenceComponent, setAnimatePresenceComponent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFramerMotion = async () => {
      try {
        // Dynamically import Framer Motion
        const { AnimatePresence: FramerAnimatePresence } = await import('framer-motion');
        setAnimatePresenceComponent(() => FramerAnimatePresence);
        setIsLoading(false);
      } catch (error) {
        console.warn('Framer Motion AnimatePresence failed to load, using fallback:', error);
        setIsLoading(false);
      }
    };

    loadFramerMotion();
  }, []);

  // Filter out Framer Motion props for fallback components
  const filterFramerMotionProps = (allProps) => {
    const filteredProps = {};
    
    Object.keys(allProps).forEach(key => {
      if (!FRAMER_MOTION_PROPS.includes(key)) {
        filteredProps[key] = allProps[key];
      }
    });
    
    return filteredProps;
  };

  const filteredProps = filterFramerMotionProps(props);

  // Show loading state while Framer Motion loads
  if (isLoading) {
    return (
      <div className="animate-presence-fallback" {...filteredProps}>
        {children}
      </div>
    );
  }

  // If Framer Motion loaded successfully, use it with all props
  if (AnimatePresenceComponent) {
    return (
      <AnimatePresenceComponent {...props}>
        {children}
      </AnimatePresenceComponent>
    );
  }

  // Fallback to regular div (no special animation handling)
  return (
    <div className="animate-presence-fallback" {...filteredProps}>
      {children}
    </div>
  );
};

export default AnimatePresence;
