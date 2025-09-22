import * as React from "react"
import { motion, HTMLMotionProps } from "framer-motion"

import { cn } from "@/lib/utils"
import { cardVariants, animationUtils } from "@/lib/animations"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean
  pressable?: boolean
  role?: string
  "aria-pressed"?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, interactive = false, pressable = false, ...props }, ref) => {
    const prefersReducedMotion = useReducedMotion();
    const motionConfig = animationUtils.getReducedMotionConfig(prefersReducedMotion);

    // If not interactive, render as regular div
    if (!interactive && !pressable) {
      return (
        <div
          ref={ref}
          className={cn(
            "shadcn-card rounded-xl border bg-card border-card-border text-card-foreground shadow-sm",
            className
          )}
          {...props}
        />
      );
    }

    // Determine accessibility props
    const accessibilityProps = {
      tabIndex: (interactive || pressable) ? 0 : undefined,
      role: props.role || ((interactive || pressable) ? "button" : undefined),
      "aria-pressed": props["aria-pressed"],
    };

    // Render with motion for interactive cards
    return (
      <motion.div
        ref={ref}
        className={cn(
          "shadcn-card rounded-xl border bg-card border-card-border text-card-foreground shadow-sm",
          {
            "cursor-pointer": interactive || pressable,
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2": interactive || pressable,
          },
          className
        )}
        variants={prefersReducedMotion ? undefined : cardVariants}
        initial="idle"
        animate="idle"
        whileHover={interactive && !prefersReducedMotion ? "hover" : undefined}
        whileTap={pressable && !prefersReducedMotion ? "tap" : undefined}
        whileFocus={(interactive || pressable) && !prefersReducedMotion ? "focus" : undefined}
        transition={motionConfig.transition}
        {...accessibilityProps}
        {...props}
      />
    );
  }
);
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
}
