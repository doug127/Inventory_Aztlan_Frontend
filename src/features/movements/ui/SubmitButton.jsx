import React from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

export const SubmitButton = ({ 
  onClick, 
  loading = false, 
  disabled = false,
  text = 'Registrar Movimiento',
  loadingText = 'Procesando...'
}) => {
  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        w-full py-3 px-6 rounded-lg font-semibold text-white
        transition-all duration-200
        ${disabled || loading
          ? 'bg-gray-400 cursor-not-allowed'
          : 'bg-black hover:bg-gray-800'
        }
      `}
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>{loadingText}</span>
        </div>
      ) : (
        text
      )}
    </motion.button>
  );
};

SubmitButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  text: PropTypes.string,
  loadingText: PropTypes.string
};