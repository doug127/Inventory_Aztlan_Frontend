import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';

export const FormTextarea = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  touched,
  required = false,
  placeholder = '',
  rows = 2,
  disabled = false
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="relative">
      <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      
      <textarea
        name={name}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        onBlur={() => {
          setIsFocused(false);
          onBlur(name);
        }}
        onFocus={() => setIsFocused(true)}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className={`
          w-full px-3 py-2 text-sm
          bg-white border rounded-lg
          transition-all duration-200
          focus:outline-none
          resize-none
          disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
          placeholder:text-gray-300
          ${error && touched
            ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-200'
            : 'border-gray-200 focus:border-gray-400 focus:ring-1 focus:ring-gray-200'
          }
          ${isFocused ? 'border-gray-400' : ''}
        `}
      />

      <AnimatePresence>
        {touched && error && (
          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute -bottom-5 left-0 text-xs text-red-500"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

FormTextarea.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onBlur: PropTypes.func.isRequired,
  error: PropTypes.string,
  touched: PropTypes.bool,
  required: PropTypes.bool,
  placeholder: PropTypes.string,
  rows: PropTypes.number,
  disabled: PropTypes.bool
};