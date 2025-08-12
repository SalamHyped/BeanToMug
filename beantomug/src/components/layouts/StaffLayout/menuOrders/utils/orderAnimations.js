/**
 * Animation configurations for order components
 * Centralizes all motion variants and transition settings
 */

/**
 * Order card animation variants
 */
export const orderCardVariants = {
  initial: { x: 0, opacity: 1, scale: 1, rotate: 0 },
  animate: ({ isDone = false, isDragging = false, dragProgress = 0 }) => ({
    x: isDone ? -200 : 0,
    opacity: isDone ? 0 : 1,
    scale: isDragging ? 1.05 : 1,
    rotate: isDragging 
      ? dragProgress > 60 
        ? 5 
        : dragProgress > 30 
          ? 2 
          : 0
      : 0
  }),
  exit: { x: -200, opacity: 0, scale: 0.8, rotate: -10 }
};

/**
 * Order card transition settings
 */
export const orderCardTransition = {
  duration: 0.3,
  type: "spring",
  stiffness: 300,
  damping: 30
};

/**
 * Drag configuration for order cards
 */
export const orderCardDragConfig = {
  drag: "x",
  dragConstraints: { left: -50, right: 200 },
  dragElastic: 0.1,
  dragMomentum: false,
  whileDrag: { 
    scale: 1.08, 
    rotate: 3,
    zIndex: 10,
    boxShadow: "0 15px 35px rgba(0,0,0,0.4)"
  }
};

/**
 * Progress bar animation variants
 */
export const progressBarVariants = {
  initial: { width: 0 },
  animate: (progress) => ({ 
    width: progress ? `${progress}%` : 0 
  })
};

/**
 * Item expansion animation variants
 */
export const itemExpansionVariants = {
  collapsed: { 
    height: 0, 
    opacity: 0,
    transition: { duration: 0.2 }
  },
  expanded: { 
    height: "auto", 
    opacity: 1,
    transition: { duration: 0.3 }
  }
};

/**
 * Loading spinner animation
 */
export const spinnerVariants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "linear"
    }
  }
};

/**
 * Get data-progress attribute value based on drag progress
 */
export const getDragProgressData = (dragProgress) => {
  if (dragProgress > 60) return "high";
  if (dragProgress > 30) return "medium";
  return "low";
};
