import { useState, useCallback } from 'react';

const initialFormData = {
  tipoMovimiento: 'Salida',
  razon: 'Consumo',
  referencia: '',
  almacenSalida: 'Principal',
  producto: 'Gasolina',
  cantidad: 30,
  nota: '',
  activo: 'Personal de campo',
  destino: 'Campo'
};

export const useFormValidation = () => {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = useCallback((name, value) => {
    switch (name) {
      case 'referencia':
        return value.trim() === '' ? 'La referencia es requerida' : '';
      case 'nota':
        return value.trim() === '' ? 'La nota es requerida' : '';
      case 'cantidad':
        if (value <= 0) return 'La cantidad debe ser mayor a 0';
        if (value > 1000) return 'La cantidad no puede exceder 1000';
        return '';
      case 'tipoMovimiento':
        return value === '' ? 'Seleccione el tipo de movimiento' : '';
      case 'razon':
        return value === '' ? 'Seleccione la razón' : '';
      case 'almacenSalida':
        return value === '' ? 'Seleccione el almacén' : '';
      case 'producto':
        return value === '' ? 'Seleccione el producto' : '';
      case 'activo':
        return value === '' ? 'Seleccione el activo' : '';
      case 'destino':
        return value === '' ? 'Seleccione el destino' : '';
      default:
        return '';
    }
  }, []);

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