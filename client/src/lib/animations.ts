import { Variants } from "framer-motion";

/**
 * Animation constants for consistent timing and easing across the app
 */
export const ANIMATION_CONFIG = {
  // Timing
  fast: 0.15,
  normal: 0.25,
  slow: 0.35,
  
  // Easing curves
  easing: {
    spring: [0.68, -0.55, 0.265, 1.55] as const,
    smooth: [0.4, 0, 0.2, 1] as const,
    bounce: [0.175, 0.885, 0.32, 1.275] as const,
    sharp: [0.4, 0, 1, 1] as const,
  },
  
  // Spring configurations
  spring: {
    gentle: { type: "spring" as const, stiffness: 400, damping: 17 },
    snappy: { type: "spring" as const, stiffness: 500, damping: 25 },
    bouncy: { type: "spring" as const, stiffness: 600, damping: 12 },
  }
} as const;

/**
 * Common button animation variants
 */
export const buttonVariants: Variants = {
  // Base button animations
  idle: {
    scale: 1,
    transition: ANIMATION_CONFIG.spring.gentle
  },
  hover: {
    scale: 1.02,
    transition: ANIMATION_CONFIG.spring.gentle
  },
  tap: {
    scale: 0.98,
    transition: { ...ANIMATION_CONFIG.spring.snappy, duration: ANIMATION_CONFIG.fast }
  },
  // Focus state for keyboard navigation
  focus: {
    scale: 1.01,
    transition: ANIMATION_CONFIG.spring.gentle
  },
  // Loading state
  loading: {
    scale: 1,
    transition: {
      repeat: Infinity,
      repeatType: "reverse" as const,
      duration: ANIMATION_CONFIG.normal * 2,
      ease: ANIMATION_CONFIG.easing.smooth
    }
  },
  // Disabled state
  disabled: {
    scale: 1,
    opacity: 0.5,
    transition: ANIMATION_CONFIG.spring.gentle
  }
};

/**
 * Card animation variants for hover and interaction effects
 */
export const cardVariants: Variants = {
  idle: {
    scale: 1,
    y: 0,
    opacity: 1,
    transition: ANIMATION_CONFIG.spring.gentle
  },
  hover: {
    scale: 1.01,
    y: -2,
    opacity: 1,
    transition: ANIMATION_CONFIG.spring.gentle
  },
  tap: {
    scale: 0.99,
    y: 0,
    transition: { ...ANIMATION_CONFIG.spring.snappy, duration: ANIMATION_CONFIG.fast }
  },
  // Focus state for keyboard navigation
  focus: {
    scale: 1.005,
    opacity: 1,
    transition: ANIMATION_CONFIG.spring.gentle
  }
};

/**
 * Input field animation variants
 */
export const inputVariants: Variants = {
  idle: {
    scale: 1,
    borderColor: "hsl(var(--border))",
    boxShadow: "0 0 0 0px transparent",
    transition: ANIMATION_CONFIG.spring.gentle
  },
  focus: {
    scale: 1.01,
    borderColor: "hsl(var(--ring))",
    boxShadow: "0 0 0 2px hsla(var(--ring) / 0.2)",
    transition: ANIMATION_CONFIG.spring.gentle
  },
  error: {
    scale: 1.01,
    borderColor: "hsl(var(--destructive))",
    boxShadow: "0 0 0 2px hsla(var(--destructive) / 0.2)",
    transition: ANIMATION_CONFIG.spring.gentle
  },
  success: {
    scale: 1.005,
    borderColor: "hsl(var(--chart-2))",
    boxShadow: "0 0 0 2px hsla(var(--chart-2) / 0.2)",
    transition: ANIMATION_CONFIG.spring.gentle
  }
};

/**
 * Progress bar animation variants
 */
export const progressVariants: Variants = {
  empty: {
    width: "0%",
    transition: { duration: ANIMATION_CONFIG.slow, ease: ANIMATION_CONFIG.easing.smooth }
  },
  filled: (value: number) => ({
    width: `${value}%`,
    transition: { 
      duration: ANIMATION_CONFIG.slow, 
      ease: ANIMATION_CONFIG.easing.smooth,
      delay: 0.1 
    }
  }),
  pulse: {
    opacity: [0.6, 1, 0.6],
    transition: {
      repeat: Infinity,
      duration: 2,
      ease: ANIMATION_CONFIG.easing.smooth
    }
  }
};

/**
 * Badge animation variants
 */
export const badgeVariants: Variants = {
  idle: {
    scale: 1,
    transition: ANIMATION_CONFIG.spring.gentle
  },
  hover: {
    scale: 1.05,
    transition: ANIMATION_CONFIG.spring.gentle
  },
  tap: {
    scale: 0.95,
    transition: { ...ANIMATION_CONFIG.spring.snappy, duration: ANIMATION_CONFIG.fast }
  },
  pulse: {
    scale: [1, 1.05, 1],
    transition: {
      repeat: Infinity,
      duration: 2,
      ease: ANIMATION_CONFIG.easing.smooth
    }
  },
  notification: {
    scale: [1, 1.2, 1],
    transition: {
      duration: 0.6,
      ease: ANIMATION_CONFIG.easing.bounce
    }
  }
};

/**
 * Modal/Dialog animation variants
 */
export const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: ANIMATION_CONFIG.normal,
      ease: ANIMATION_CONFIG.easing.smooth,
      staggerChildren: 0.1
    }
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: -20,
    transition: {
      duration: ANIMATION_CONFIG.fast,
      ease: ANIMATION_CONFIG.easing.sharp
    }
  }
};

/**
 * Toast notification animation variants
 */
export const toastVariants: Variants = {
  hidden: {
    opacity: 0,
    x: "100%",
    scale: 0.8
  },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: ANIMATION_CONFIG.normal,
      ease: ANIMATION_CONFIG.easing.bounce
    }
  },
  exit: {
    opacity: 0,
    x: "100%",
    scale: 0.8,
    transition: {
      duration: ANIMATION_CONFIG.fast,
      ease: ANIMATION_CONFIG.easing.sharp
    }
  }
};

/**
 * Tab switching animation variants
 */
export const tabVariants: Variants = {
  inactive: {
    backgroundColor: "transparent",
    color: "hsl(var(--muted-foreground))",
    scale: 1,
    transition: ANIMATION_CONFIG.spring.gentle
  },
  active: {
    backgroundColor: "hsl(var(--background))",
    color: "hsl(var(--foreground))",
    scale: 1.02,
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
    transition: ANIMATION_CONFIG.spring.gentle
  },
  hover: {
    backgroundColor: "hsl(var(--accent))",
    scale: 1.01,
    transition: ANIMATION_CONFIG.spring.gentle
  }
};

/**
 * Tab content animation variants
 */
export const tabContentVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -10,
    scale: 0.98
  },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: ANIMATION_CONFIG.normal,
      ease: ANIMATION_CONFIG.easing.smooth
    }
  },
  exit: {
    opacity: 0,
    x: 10,
    scale: 0.98,
    transition: {
      duration: ANIMATION_CONFIG.fast,
      ease: ANIMATION_CONFIG.easing.sharp
    }
  }
};

/**
 * Stagger animation configurations
 */
export const staggerVariants: Variants = {
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  },
  item: {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: ANIMATION_CONFIG.normal,
        ease: ANIMATION_CONFIG.easing.smooth
      }
    }
  }
};

/**
 * Dropdown menu animation variants
 */
export const dropdownVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: -10
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: ANIMATION_CONFIG.normal,
      ease: ANIMATION_CONFIG.easing.smooth
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -10,
    transition: {
      duration: ANIMATION_CONFIG.fast,
      ease: ANIMATION_CONFIG.easing.sharp
    }
  },
  hover: {
    backgroundColor: "hsl(var(--accent))",
    transition: ANIMATION_CONFIG.spring.gentle
  }
};

/**
 * Icon animation variants
 */
export const iconVariants: Variants = {
  idle: {
    rotate: 0,
    scale: 1,
    transition: ANIMATION_CONFIG.spring.gentle
  },
  hover: {
    rotate: 5,
    scale: 1.1,
    transition: ANIMATION_CONFIG.spring.gentle
  },
  spin: {
    rotate: 360,
    transition: {
      duration: 1,
      ease: "linear",
      repeat: Infinity
    }
  },
  bounce: {
    y: [-2, 0, -2],
    transition: {
      duration: 1.5,
      ease: ANIMATION_CONFIG.easing.smooth,
      repeat: Infinity
    }
  }
};

/**
 * Utility functions for animation configurations
 */
export const animationUtils = {
  /**
   * Get reduced motion configuration
   */
  getReducedMotionConfig: (prefersReducedMotion: boolean) => ({
    transition: prefersReducedMotion 
      ? { duration: 0.01, ease: "linear" as const }
      : { duration: ANIMATION_CONFIG.normal, ease: ANIMATION_CONFIG.easing.smooth },
    shouldAnimate: !prefersReducedMotion,
    variants: prefersReducedMotion ? {
      initial: { opacity: 1 },
      animate: { opacity: 1 },
      exit: { opacity: 1 }
    } : undefined
  }),

  /**
   * Create a delayed animation
   */
  withDelay: (variants: Variants, delay: number): Variants => {
    const delayedVariants: Variants = {};
    Object.keys(variants).forEach(key => {
      const variant = variants[key];
      if (typeof variant === 'object' && variant !== null && 'transition' in variant) {
        delayedVariants[key] = {
          ...variant,
          transition: {
            ...variant.transition,
            delay
          }
        };
      } else {
        delayedVariants[key] = variant;
      }
    });
    return delayedVariants;
  },

  /**
   * Create staggered container variants
   */
  createStaggerContainer: (staggerDelay: number = 0.1): Variants => ({
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0.1
      }
    }
  }),

  /**
   * Get appropriate spring configuration based on context
   */
  getSpringConfig: (context: 'gentle' | 'snappy' | 'bouncy' = 'gentle') => 
    ANIMATION_CONFIG.spring[context]
};

/**
 * Animation presets for common components
 */
export const animationPresets = {
  // Fade in from bottom with scale
  fadeInUp: {
    initial: { opacity: 0, y: 20, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -10, scale: 0.95 }
  },
  
  // Fade in from left
  fadeInLeft: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 }
  },
  
  // Scale in
  scaleIn: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 }
  },
  
  // Slide in from right
  slideInRight: {
    initial: { opacity: 0, x: "100%" },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: "100%" }
  }
};