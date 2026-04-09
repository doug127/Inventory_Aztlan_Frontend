import { useState, useCallback } from 'react';

const initialFormData = {
  name: '',
  code: '',
  content_quantity: 1,
  min_stock: 100,
  max_stock: 30000,
  unit_id: 2,
  product_category_id: 4
};

export const useProductForm = () => {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = useCallback((name, value) => {
    switch (name) {
      case 'name':
        return value.trim() === '' ? 'El nombre es requerido' : 
               value.length < 3 ? 'Mínimo 3 caracteres' : '';
      case 'code':
        return value.trim() === '' ? 'El código es requerido' : 
               !/^[A-Z0-9-]+$/.test(value) ? 'Solo mayúsculas, números y guiones' : '';
      case 'content_quantity':
        return value <= 0 ? 'Debe ser mayor a 0' : '';
      case 'min_stock':
        return value < 0 ? 'No puede ser negativo' : 
               value >= formData.max_stock ? 'Debe ser menor al stock máximo' : '';
      case 'max_stock':
        return value <= formData.min_stock ? 'Debe ser mayor al stock mínimo' : '';
      case 'unit_id':
        return !value ? 'Seleccione una unidad' : '';
      case 'product_category_id':
        return !value ? 'Seleccione una categoría' : '';
      default:
        return '';
    }
  }, [formData.max_stock, formData.min_stock]);

  const handleChange = useCallback((name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  }, [touched, validateField]);

  const handleBlur = useCallback((name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, formData[name]);
    setErrors(prev => ({ ...prev, [name]: error }));
  }, [formData, validateField]);

  const validateAll = useCallback(() => {
    const newErrors = {};
    let isValid = true;

    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    setTouched(Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
    
    return isValid;
  }, [formData, validateField]);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setErrors({});
    setTouched({});
  }, []);

  return {
    formData,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    resetForm
  };
};