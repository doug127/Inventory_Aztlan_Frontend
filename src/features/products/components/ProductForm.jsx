import React, { useState, memo } from 'react';
import { motion } from 'framer-motion';
import { unitOptions, categoryOptions } from '../data/productData';

const FormInput = memo(({ 
  label, 
  name, 
  type = 'text', 
  value, 
  placeholder, 
  min, 
  max, 
  step,
  error,
  touched,
  onChange,
  onBlur 
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="relative">
      <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
        {label}
        <span className="text-red-500 ml-0.5">*</span>
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={(e) => {
          const val = type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
          onChange(name, val);
        }}
        onBlur={() => {
          setIsFocused(false);
          onBlur(name);
        }}
        onFocus={() => setIsFocused(true)}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        className={`
          w-full px-3 py-2 text-sm
          bg-white border rounded-lg
          transition-colors duration-200
          focus:outline-none
          placeholder:text-gray-300
          ${error && touched
            ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-200'
            : 'border-gray-200 focus:border-gray-400 focus:ring-1 focus:ring-gray-200'
          }
          ${isFocused ? 'border-gray-400' : ''}
        `}
      />
      {touched && error && (
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -bottom-5 left-0 text-xs text-red-500"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
});

FormInput.displayName = 'FormInput';

const FormSelect = memo(({ 
  label, 
  name, 
  value, 
  options,
  error,
  touched,
  onChange,
  onBlur 
}) => {
  return (
    <div className="relative">
      <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
        {label}
        <span className="text-red-500 ml-0.5">*</span>
      </label>
      <div className="relative">
        <select
          name={name}
          value={value}
          onChange={(e) => onChange(name, parseInt(e.target.value))}
          onBlur={() => onBlur(name)}
          className={`
            w-full px-3 py-2 text-sm
            bg-white border rounded-lg
            transition-colors duration-200
            appearance-none
            focus:outline-none
            ${error && touched
              ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-200'
              : 'border-gray-200 focus:border-gray-400 focus:ring-1 focus:ring-gray-200'
            }
          `}
        >
          <option value="">Seleccionar...</option>
          {options.map(opt => (
            <option key={opt.id} value={opt.id}>{opt.name}</option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {touched && error && (
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -bottom-5 left-0 text-xs text-red-500"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
});

FormSelect.displayName = 'FormSelect';

export const ProductForm = ({ 
  formData, 
  errors, 
  touched, 
  onChange, 
  onBlur,
  onSubmit,
  onReset,
  isSubmitting 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className="overflow-hidden"
    >
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-lg font-medium text-gray-900">Nuevo Producto</h3>
        <p className="text-sm text-gray-500 mt-0.5">Complete los datos del producto</p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-2 gap-4 gap-y-6">
          <FormInput
            label="Nombre"
            name="name"
            value={formData.name}
            placeholder="Ej: Diesel"
            error={errors.name}
            touched={touched.name}
            onChange={onChange}
            onBlur={onBlur}
          />

          <FormInput
            label="Código"
            name="code"
            value={formData.code}
            placeholder="Ej: DIE-001"
            error={errors.code}
            touched={touched.code}
            onChange={onChange}
            onBlur={onBlur}
          />

          <FormSelect
            label="Categoría"
            name="product_category_id"
            value={formData.product_category_id}
            options={categoryOptions}
            error={errors.product_category_id}
            touched={touched.product_category_id}
            onChange={onChange}
            onBlur={onBlur}
          />

          <FormSelect
            label="Unidad"
            name="unit_id"
            value={formData.unit_id}
            options={unitOptions}
            error={errors.unit_id}
            touched={touched.unit_id}
            onChange={onChange}
            onBlur={onBlur}
          />

          <FormInput
            label="Contenido"
            name="content_quantity"
            type="number"
            value={formData.content_quantity}
            min={0.01}
            step={0.01}
            error={errors.content_quantity}
            touched={touched.content_quantity}
            onChange={onChange}
            onBlur={onBlur}
          />

          <div className="col-span-2 grid grid-cols-2 gap-4">
            <FormInput
              label="Stock Mínimo"
              name="min_stock"
              type="number"
              value={formData.min_stock}
              min={0}
              error={errors.min_stock}
              touched={touched.min_stock}
              onChange={onChange}
              onBlur={onBlur}
            />

            <FormInput
              label="Stock Máximo"
              name="max_stock"
              type="number"
              value={formData.max_stock}
              min={formData.min_stock + 1}
              error={errors.max_stock}
              touched={touched.max_stock}
              onChange={onChange}
              onBlur={onBlur}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onReset}
            type="button"
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200"
          >
            Limpiar
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onSubmit}
            disabled={isSubmitting}
            type="button"
            className={`
              px-5 py-2 rounded-lg text-sm font-medium
              transition-all duration-200
              ${isSubmitting
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-black text-white hover:bg-gray-800'
              }
            `}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Guardando
              </span>
            ) : (
              'Guardar Producto'
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};