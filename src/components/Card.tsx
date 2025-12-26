import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: (e?: any) => void;
}

const Card = ({ children, className = '', hover = false, onClick }: CardProps) => {
  return (
    <motion.div
      whileHover={hover ? { scale: 1.02 } : {}}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`bg-[#111111] border border-[#333333] rounded-xl p-6 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default Card;
