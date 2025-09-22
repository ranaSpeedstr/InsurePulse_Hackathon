import * as React from "react"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"
import { inputVariants, ANIMATION_CONFIG, animationUtils } from "@/lib/animations"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

interface InputProps extends React.ComponentProps<"input"> {
  error?: boolean
  success?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, success, onFocus, onBlur, ...props }, ref) => {
    const prefersReducedMotion = useReducedMotion();
    const motionConfig = animationUtils.getReducedMotionConfig(prefersReducedMotion);
    const [isFocused, setIsFocused] = React.useState(false);
    
    // Determine input state for animations
    const getInputState = () => {
      if (error) return 'error';
      if (success) return 'success';
      if (isFocused) return 'focus';
      return 'idle';
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    // h-9 to match icon buttons and default buttons.
    return (
      <motion.input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-all duration-200",
          // Conditional border colors for error/success states
          {
            "border-destructive focus-visible:ring-destructive": error,
            "border-chart-2 focus-visible:ring-chart-2": success,
          },
          className
        )}
        ref={ref}
        variants={prefersReducedMotion ? undefined : inputVariants}
        initial="idle"
        animate={getInputState()}
        transition={motionConfig.transition}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
