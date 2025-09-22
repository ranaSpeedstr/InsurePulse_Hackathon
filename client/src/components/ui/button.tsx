import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { motion, HTMLMotionProps } from "framer-motion"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants as animationButtonVariants, ANIMATION_CONFIG, animationUtils } from "@/lib/animations"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0" +
  " hover-elevate active-elevate-2",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border border-primary-border",
        destructive:
          "bg-destructive text-destructive-foreground border border-destructive-border",
        outline:
          // Shows the background color of whatever card / sidebar / accent background it is inside of.
          // Inherits the current text color.
          " border [border-color:var(--button-outline)]  shadow-xs active:shadow-none ",
        secondary: "border bg-secondary text-secondary-foreground border border-secondary-border ",
        // Add a transparent border so that when someone toggles a border on later, it doesn't shift layout/size.
        ghost: "border border-transparent",
      },
      // Heights are set as "min" heights, because sometimes Ai will place large amount of content
      // inside buttons. With a min-height they will look appropriate with small amounts of content,
      // but will expand to fit large amounts of content.
      size: {
        default: "min-h-9 px-4 py-2",
        sm: "min-h-8 rounded-md px-3 text-xs",
        lg: "min-h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  loadingText?: string
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, loadingText, disabled, children, ...props }, ref) => {
    const prefersReducedMotion = useReducedMotion();
    const motionConfig = animationUtils.getReducedMotionConfig(prefersReducedMotion);
    
    // Determine if button is disabled (either explicitly or due to loading)
    const isDisabled = disabled || loading;
    
    // If asChild is true, use Slot (for composition), otherwise use motion.button
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        />
      );
    }

    return (
      <motion.button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={isDisabled}
        variants={prefersReducedMotion ? undefined : animationButtonVariants}
        initial="idle"
        animate={loading ? "loading" : isDisabled ? "disabled" : "idle"}
        whileHover={!isDisabled && !prefersReducedMotion ? "hover" : undefined}
        whileTap={!isDisabled && !prefersReducedMotion ? "tap" : undefined}
        whileFocus={!isDisabled && !prefersReducedMotion ? "focus" : undefined}
        transition={motionConfig.transition}
        data-testid={props["data-testid"]}
        {...props}
      >
        {loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={motionConfig.transition}
            className="mr-2"
          >
            <Loader2 
              className="w-4 h-4 animate-spin" 
              style={{
                animation: prefersReducedMotion ? 'none' : 'spin 1s linear infinite'
              }}
            />
          </motion.div>
        )}
        
        <motion.span
          animate={{
            opacity: loading ? 0.7 : 1,
          }}
          transition={motionConfig.transition}
        >
          {loading && loadingText ? loadingText : children}
        </motion.span>
      </motion.button>
    );
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
