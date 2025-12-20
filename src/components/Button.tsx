import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
  className?: string;
}

const Button = ({ children, variant = 'primary', onClick, className = '' }: ButtonProps) => {
  const baseStyles = 'px-6 py-3 rounded-lg font-medium transition-colors';
  const variants = {
    primary: 'bg-primary hover:bg-red-600 text-white',
    secondary: 'bg-gray-200 dark:bg-dark-border hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-900 dark:text-white',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {children}
    </motion.button>
  );
};

export default Button;
