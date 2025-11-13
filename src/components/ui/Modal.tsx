'use client';

import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}) => {
  // Escキーでモーダルを閉じる
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* オーバーレイ */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* モーダルコンテンツ */}
      <div className={`relative bg-white rounded-lg shadow-xl w-full ${sizeStyles[size]} max-h-[90vh] overflow-y-auto`}>
        {/* ヘッダー */}
        {title && (
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-[#1A1A1A]">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            >
              ×
            </button>
          </div>
        )}

        {/* コンテンツ */}
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

interface ModalFooterProps {
  children: React.ReactNode;
}

export const ModalFooter: React.FC<ModalFooterProps> = ({ children }) => {
  return (
    <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-gray-200">
      {children}
    </div>
  );
};
