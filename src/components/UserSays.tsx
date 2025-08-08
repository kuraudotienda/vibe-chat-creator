import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface UserSaysProps {
  text: string;
  key?: string | number;
  onComplete?: () => void;
}

export const UserSays: React.FC<UserSaysProps> = ({ text, onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (text) {
      setIsVisible(true);
      // Auto-hide after 4 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onComplete?.(), 500); // Allow time for exit animation
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [text, onComplete]);

  if (!text) return null;

  return (
    <div className="absolute top-0 left-0 right-0 z-50 pointer-events-none">
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -30, opacity: 0 }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 200,
              duration: 0.6
            }}
            className="relative overflow-hidden"
          >
            {/* Cloud-like gradient background */}
            <div className="relative bg-gradient-to-b from-white/20 via-white/10 to-transparent dark:from-gray-900/30 dark:via-gray-800/20 dark:to-transparent backdrop-blur-md shadow-2xl border-b border-white/20 dark:border-gray-700/30">
              
              {/* Floating cloud effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-blue-100/30 via-transparent to-transparent dark:from-blue-900/20 animate-pulse" />
              
              {/* Subtle noise texture overlay */}
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.3),transparent_70%)] dark:bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.1),transparent_70%)]" />
              
              {/* Content container */}
              <div className="relative px-4 sm:px-6 py-3 sm:py-4 text-center">
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="inline-block max-w-full"
                >
                  {/* Label */}
                  <div className="text-[9px] sm:text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">
                    You said
                  </div>
                  
                  {/* User text */}
                  <div className="text-xs sm:text-sm font-medium text-gray-800 dark:text-white leading-tight sm:leading-snug max-w-[90vw] sm:max-w-xl mx-auto line-clamp-3 break-words">
                    "{text}"
                  </div>
                </motion.div>
              </div>
              
              {/* Bottom fade to create cloud-like dissolution */}
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-transparent via-white/5 to-transparent dark:via-gray-800/5 blur-sm" />
            </div>

            {/* Floating particles effect */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-white/40 dark:bg-gray-300/30 rounded-full"
                  style={{
                    left: `${20 + i * 15}%`,
                    top: `${60 + Math.sin(i) * 20}%`,
                  }}
                  animate={{
                    y: [-10, -20, -10],
                    opacity: [0.4, 0.8, 0.4],
                    scale: [0.8, 1.2, 0.8],
                  }}
                  transition={{
                    duration: 2 + i * 0.3,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserSays;