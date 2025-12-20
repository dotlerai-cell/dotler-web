import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

const Card = ({ children, className = '', hover = false }: CardProps) => {
  return (
    <motion.div
      whileHover={hover ? { scale: 1.02 } : {}}
      className={`bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl p-6 ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default Card;
