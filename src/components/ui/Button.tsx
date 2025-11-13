import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  fullWidth?: boolean;
  loading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-[#1DB954] text-white hover:bg-[#1aa34a] active:bg-[#178f40]',
  secondary: 'bg-[#2C2C2C] text-white hover:bg-[#3a3a3a] active:bg-[#202020]',
  outline: 'bg-transparent border-2 border-[#1DB954] text-[#1DB954] hover:bg-[#1DB954] hover:text-white',
  danger: 'bg-[#E63946] text-white hover:bg-[#d32f3c] active:bg-[#b71c1c]',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  fullWidth = false,
  loading = false,
  disabled,
  className = '',
  ...props
}) => {
  const baseStyles = 'font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  const widthStyles = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyles} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center">
          <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
};
