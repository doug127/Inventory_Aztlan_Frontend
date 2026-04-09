import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';

export const FormSelect = ({
  label,
  name,
  value,
  options,
  onChange,
  onBlur,
  error,
  touched,
  required = false,
  disabled = false
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="relative">
      <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      
      <div className="relative">
        <select
          name={name}
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          onBlur={() => {
            setIsFocused(false);
            onBlur(name);
          }}
          onFocus={() => setIsFocused(true)}
          disabled={disabled}
          className={`
            w-full px-3 py-2 text-sm
            bg-white border rounded-lg
            transition-all duration-200
            appearance-none
            focus:outline-none
            disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
            ${error && touched
              ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-200'
              : 'border-gray-200 focus:border-gray-400 focus:ring-1 focus:ring-gray-200'
            }
            ${isFocused ? 'border-gray-400' : ''}
          `}
        >
          <option value="" className="text-gray-400">Seleccionar</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

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

FormSelect.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  options: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
  onBlur: PropTypes.func.isRequired,
  error: PropTypes.string,
  touched: PropTypes.bool,
  required: PropTypes.bool,
  disabled: PropTypes.bool
};