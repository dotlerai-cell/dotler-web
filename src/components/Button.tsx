import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary';
  onClick?: (e?: any) => void;
  className?: string;
  disabled?: boolean;
}

const Button = ({ children, variant = 'primary', onClick, className = '', disabled = false }: ButtonProps) => {
  const baseStyles = 'px-6 py-3 rounded-lg font-medium transition-colors';
  const variants = {
    primary: 'bg-primary hover:bg-red-600 text-white shadow-[0_0_15px_rgba(236,19,19,0.4)] hover:shadow-[0_0_25px_rgba(236,19,19,0.6)]',
    secondary: 'bg-transparent border border-[#333333] hover:bg-[#333333] text-white',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={(e) => { if (!disabled && onClick) onClick(e); }}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {children}
    </motion.button>
  );
};

export default Button;
