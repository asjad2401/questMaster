import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Animation variants for common use cases
export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.4 }
  }
};

export const slideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.4,
      ease: "easeOut" 
    }
  }
};

export const slideDown = {
  hidden: { opacity: 0, y: -20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.4,
      ease: "easeOut" 
    }
  }
};

export const slideInLeft = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { 
      duration: 0.4,
      ease: "easeOut" 
    }
  }
};

export const slideInRight = {
  hidden: { opacity: 0, x: 20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { 
      duration: 0.4,
      ease: "easeOut" 
    }
  }
};

export const scale = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { 
      duration: 0.3,
      ease: "easeOut" 
    }
  }
};

// Staggered children animation
export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Reusable animation components
interface AnimationProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export const FadeIn = ({ children, className = "", delay = 0 }: AnimationProps) => (
  <motion.div
    className={className}
    initial="hidden"
    animate="visible"
    variants={fadeIn}
    transition={{ delay }}
  >
    {children}
  </motion.div>
);

export const SlideUp = ({ children, className = "", delay = 0 }: AnimationProps) => (
  <motion.div
    className={className}
    initial="hidden"
    animate="visible"
    variants={slideUp}
    transition={{ delay }}
  >
    {children}
  </motion.div>
);

export const SlideDown = ({ children, className = "", delay = 0 }: AnimationProps) => (
  <motion.div
    className={className}
    initial="hidden"
    animate="visible"
    variants={slideDown}
    transition={{ delay }}
  >
    {children}
  </motion.div>
);

export const SlideInLeft = ({ children, className = "", delay = 0 }: AnimationProps) => (
  <motion.div
    className={className}
    initial="hidden"
    animate="visible"
    variants={slideInLeft}
    transition={{ delay }}
  >
    {children}
  </motion.div>
);

export const SlideInRight = ({ children, className = "", delay = 0 }: AnimationProps) => (
  <motion.div
    className={className}
    initial="hidden"
    animate="visible"
    variants={slideInRight}
    transition={{ delay }}
  >
    {children}
  </motion.div>
);

export const ScaleIn = ({ children, className = "", delay = 0 }: AnimationProps) => (
  <motion.div
    className={className}
    initial="hidden"
    animate="visible"
    variants={scale}
    transition={{ delay }}
  >
    {children}
  </motion.div>
);

export const StaggerContainer = ({ children, className = "" }: AnimationProps) => (
  <motion.div
    className={className}
    initial="hidden"
    animate="visible"
    variants={staggerContainer}
  >
    {children}
  </motion.div>
);

// For individual items inside a stagger container
export const StaggerItem = ({ children, className = "" }: AnimationProps) => (
  <motion.div
    className={className}
    variants={fadeIn}
  >
    {children}
  </motion.div>
);

// Page transition wrapper
export const PageTransition = ({ children, className = "" }: AnimationProps) => (
  <motion.div
    className={className}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.div>
);

// Animated Button that works with shadcn Button components
interface AnimatedButtonProps extends React.ComponentProps<typeof Button> {
  whileHover?: any;
  whileTap?: any;
  initial?: any;
  animate?: any;
}

export const AnimatedButton = ({ 
  className, 
  children, 
  whileHover = { scale: 1.05 },
  whileTap = { scale: 0.95 },
  initial,
  animate,
  ...props 
}: AnimatedButtonProps) => {
  return (
    <motion.div
      whileHover={whileHover}
      whileTap={whileTap}
      initial={initial}
      animate={animate}
    >
      <Button className={cn(className)} {...props}>
        {children}
      </Button>
    </motion.div>
  );
};

// Hover and tap animations
export const MotionButton = motion.button;
export const MotionDiv = motion.div;
export const MotionLink = motion.a; 