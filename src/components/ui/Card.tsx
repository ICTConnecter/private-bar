import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  hoverable = false,
}) => {
  const baseStyles = 'bg-white rounded-lg shadow-md p-4';
  const hoverStyles = hoverable || onClick ? 'hover:shadow-lg transition-shadow duration-200 cursor-pointer' : '';

  return (
    <div
      className={`${baseStyles} ${hoverStyles} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ title, subtitle, action }) => {
  return (
    <div className="flex justify-between items-start mb-3">
      <div>
        <h3 className="text-lg font-bold text-[#1A1A1A]">{title}</h3>
        {subtitle && <p className="text-sm text-[#6B6B6B] mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return <div className={`text-[#1A1A1A] ${className}`}>{children}</div>;
};

export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return <div className={`mt-4 pt-4 border-t border-gray-200 ${className}`}>{children}</div>;
};
