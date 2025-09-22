"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"
import { progressVariants, ANIMATION_CONFIG, animationUtils } from "@/lib/animations"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  animated?: boolean
  showPulse?: boolean
  colorVariant?: 'default' | 'success' | 'warning' | 'danger'
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, animated = true, showPulse = false, colorVariant = 'default', ...props }, ref) => {
  const prefersReducedMotion = useReducedMotion();
  const motionConfig = animationUtils.getReducedMotionConfig(prefersReducedMotion);
  
  // Color variants for different progress states
  const getColorClasses = () => {
    switch (colorVariant) {
      case 'success':
        return 'bg-chart-2';
      case 'warning':
        return 'bg-chart-3';
      case 'danger':
        return 'bg-chart-4';
      default:
        return 'bg-primary';
    }
  };

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
      {...props}
    >
      {animated && !prefersReducedMotion ? (
        <motion.div
          className={cn(
            "h-full flex-1 rounded-full",
            getColorClasses(),
            {
              "relative overflow-hidden": showPulse,
            }
          )}
          variants={progressVariants}
          initial="empty"
          animate={showPulse ? "pulse" : "filled"}
          custom={value || 0}
          transition={motionConfig.transition}
        >
          {showPulse && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{
                x: ["-100%", "100%"]
              }}
              transition={{
                repeat: Infinity,
                duration: 1.5,
                ease: "linear"
              }}
            />
          )}
        </motion.div>
      ) : (
        <ProgressPrimitive.Indicator
          className={cn(
            "h-full w-full flex-1 transition-all",
            getColorClasses()
          )}
          style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        />
      )}
    </ProgressPrimitive.Root>
  );
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
