import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { motion, AnimatePresence } from "framer-motion"

import { cn } from "@/lib/utils"
import { tabVariants, tabContentVariants, animationUtils } from "@/lib/animations"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => {
  const prefersReducedMotion = useReducedMotion();
  const motionConfig = animationUtils.getReducedMotionConfig(prefersReducedMotion);
  const [isActive, setIsActive] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  // Monitor the data-state attribute to detect active state
  React.useEffect(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const updateActiveState = () => {
      const isCurrentlyActive = trigger.getAttribute('data-state') === 'active';
      setIsActive(isCurrentlyActive);
    };

    // Initial check
    updateActiveState();

    // Observer for attribute changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-state') {
          updateActiveState();
        }
      });
    });

    observer.observe(trigger, {
      attributes: true,
      attributeFilter: ['data-state']
    });

    return () => observer.disconnect();
  }, []);

  return (
    <TabsPrimitive.Trigger
      ref={(node) => {
        triggerRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      }}
      className="relative"
      {...props}
    >
      <motion.div
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          className
        )}
        variants={prefersReducedMotion ? undefined : tabVariants}
        initial={isActive ? "active" : "inactive"}
        animate={isActive ? "active" : "inactive"}
        whileHover={!prefersReducedMotion && !isActive ? "hover" : undefined}
        transition={motionConfig.transition}
      >
        {props.children}
      </motion.div>
    </TabsPrimitive.Trigger>
  );
})
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => {
  const prefersReducedMotion = useReducedMotion();
  const motionConfig = animationUtils.getReducedMotionConfig(prefersReducedMotion);

  return (
    <TabsPrimitive.Content
      ref={ref}
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      {...props}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={props.value || "content"}
          variants={prefersReducedMotion ? undefined : tabContentVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={motionConfig.transition}
        >
          {props.children}
        </motion.div>
      </AnimatePresence>
    </TabsPrimitive.Content>
  );
})
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
