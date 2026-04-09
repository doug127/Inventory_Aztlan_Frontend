import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';

export const FloatingNotification = ({
  type,
  message,
  isVisible,
  onClose,
  duration = 4000
}) => {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-black text-white border-l-4 border-green-500';
      case 'error':
        return 'bg-black text-white border-l-4 border-red-500';
      case 'warning':
        return 'bg-black text-white border-l-4 border-yellow-500';
      default:
        return 'bg-black text-white border-l-4 border-gray-500';
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -20, x: '-50%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 
            px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm
            flex items-center gap-3 min-w-75
            ${getStyles()}`}
        >
          <span className="text-sm font-medium flex-1">{message}</span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

FloatingNotification.propTypes = {
  type: PropTypes.oneOf(['success', 'error', 'info', 'warning']).isRequired,
  message: PropTypes.string.isRequired,
  isVisible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  duration: PropTypes.number
};