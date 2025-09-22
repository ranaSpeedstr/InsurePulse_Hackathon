import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"
import { badgeVariants as animationBadgeVariants, animationUtils } from "@/lib/animations"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

const badgeVariants = cva(
  // Whitespace-nowrap: Badges should never wrap.
  "whitespace-nowrap inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" +
  " hover-elevate " ,
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-xs",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow-xs",

        outline: " border [border-color:var(--badge-outline)] shadow-xs",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  interactive?: boolean
  pulse?: boolean
  notification?: boolean
}

function Badge({ className, variant, interactive = false, pulse = false, notification = false, ...props }: BadgeProps) {
  const prefersReducedMotion = useReducedMotion();
  const motionConfig = animationUtils.getReducedMotionConfig(prefersReducedMotion);

  // If not interactive, render as regular div
  if (!interactive && !pulse && !notification) {
    return (
      <div className={cn(badgeVariants({ variant }), className)} {...props} />
    );
  }

  // Determine animation state
  const getAnimationState = () => {
    if (notification) return 'notification';
    if (pulse) return 'pulse';
    return 'idle';
  };

  return (
    <motion.div
      className={cn(
        badgeVariants({ variant }),
        {
          "cursor-pointer": interactive,
        },
        className
      )}
      variants={prefersReducedMotion ? undefined : animationBadgeVariants}
      initial="idle"
      animate={getAnimationState()}
      whileHover={interactive && !prefersReducedMotion ? "hover" : undefined}
      whileTap={interactive && !prefersReducedMotion ? "tap" : undefined}
      transition={motionConfig.transition}
      {...props}
    />
  );
}

export { Badge, badgeVariants }
