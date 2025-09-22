import { useState, useEffect } from "react";

/**
 * Hook to detect if the user prefers reduced motion
 * @returns boolean indicating if reduced motion is preferred
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => {
    // Check on initial render if window is available
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    // Function to handle changes to the media query
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches);

    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return prefersReducedMotion;
}

/**
 * Hook to get reduced motion animation configuration
 * @returns object with animation settings based on reduced motion preference
 */
export function useMotionConfig() {
  const prefersReducedMotion = useReducedMotion();

  return {
    prefersReducedMotion,
    transition: prefersReducedMotion 
      ? { duration: 0.01, ease: "linear" }
      : { duration: 0.3, ease: "easeOut" },
    shimmerDuration: prefersReducedMotion ? 0.01 : 1.5,
    // Disable animations entirely if reduced motion is preferred
    shouldAnimate: !prefersReducedMotion,
    // Reduced animation variants
    reducedVariants: {
      initial: { opacity: prefersReducedMotion ? 1 : 0 },
      animate: { opacity: 1 },
      exit: { opacity: prefersReducedMotion ? 1 : 0 }
    }
  };
}