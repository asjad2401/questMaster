import React from "react";
import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import { SlideUp, SlideInLeft, StaggerContainer, StaggerItem } from "./animations";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export function Layout({ children, title, description }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Navbar />
      <main className="exam-container py-8 pt-20">
        {title && (
          <SlideInLeft className="mb-8">
            <motion.h1 
              className="text-3xl font-bold text-exam-primary mb-2 dark:text-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {title}
            </motion.h1>
            {description && (
              <motion.p 
                className="text-gray-600 dark:text-gray-300"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {description}
              </motion.p>
            )}
          </SlideInLeft>
        )}
        
        <StaggerContainer>
          {React.Children.map(children, (child, index) => {
            if (React.isValidElement(child)) {
              return (
                <StaggerItem key={index}>
                  {child}
                </StaggerItem>
              );
            }
            return child;
          })}
        </StaggerContainer>
      </main>
    </div>
  );
}

export default Layout; 