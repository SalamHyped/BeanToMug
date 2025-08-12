import React, { Suspense, lazy } from 'react';
import classes from '../../menuOrders.module.css';

// Lazy load Framer Motion components
const MotionDiv = lazy(() => import('./MotionDiv'));
const AnimatePresence = lazy(() => import('./AnimatePresence'));

// Fallback components with CSS animations
const FallbackDiv = ({ children, className, style, ...props }) => (
  <div 
    className={className} 
    style={{
      transition: 'all 0.3s ease',
      ...style
    }}
    {...props}
  >
    {children}
  </div>
 );

const FallbackAnimatePresence = ({ children, ...props }) => (
  <div className={classes.animatePresenceFallback} {...props}>
    {children}
  </div>
);

// Loading fallback
const MotionFallback = () => (
  <div className={classes.motionLoading}>
    <div className={classes.spinner}></div>
  </div>
);

// Export lazy-loaded components with fallbacks
export const LazyMotionDiv = (props) => (
  <Suspense fallback={<MotionFallback />}>
    <MotionDiv {...props} />
  </Suspense>
);

export const LazyAnimatePresence = (props) => (
  <Suspense fallback={<MotionFallback />}>
    <AnimatePresence {...props} />
  </Suspense>
);

// Export fallback components for immediate use
export { FallbackDiv, FallbackAnimatePresence };
