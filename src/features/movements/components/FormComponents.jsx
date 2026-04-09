import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useFormValidation } from '../hooks/useFormValidation';
import { FormSelect } from './FormSelect';
import { FormInput } from './FormInput';
import { FormTextarea } from './FormTextarea';
import { FloatingNotification } from '../ui/FloatingNotification';

export default function FormComponents() {
  const {
    formData,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    resetForm
  } = useFormValidation();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState({
    isVisible: false,
    type: 'info',
    message: ''
  });

  const tipoMovimientoOptions = [
    { value: 'Salida', label: 'Salida' },
    { value: 'Entrada', label: 'Entrada' },
    { value: 'Transferencia', label: 'Transferencia' }
  ];

  const razonOptions = [
    { value: 'Consumo', label: 'Consumo' },
    { value: 'Venta', label: 'Venta' },
    { value: 'Devolución', label: 'Devolución' },
    { value: 'Ajuste', label: 'Ajuste' }
  ];

  const almacenOptions = [
    { value: 'Principal', label: 'Principal' },
    { value: 'Secundario', label: 'Secundario' },
    { value: 'Temporal', label: 'Temporal' }
  ];

  const productoOptions = [
    { value: 'Gasolina', label: 'Gasolina' },
    { value: 'Diesel', label: 'Diesel' },
    { value: 'Aceite', label: 'Aceite' },
    { value: 'Refrigerante', label: 'Refrigerante' }
  ];

  const activoOptions = [
    { value: 'Personal de campo', label: 'Personal de campo' },
    { value: 'Vehículo', label: 'Vehículo' },
    { value: 'Maquinaria', label: 'Maquinaria' },
    { value: 'Generador', label: 'Generador' }
  ];

  const destinoOptions = [
    { value: 'Campo', label: 'Campo' },
    { value: 'Oficina', label: 'Oficina' },
    { value: 'Taller', label: 'Taller' },
    { value: 'Bodega', label: 'Bodega' }
  ];

  const showNotification = (type, message) => {
    setNotification({
      isVisible: true,
      type,
      message
    });
  };

  const handleSubmit = async () => {
    const isValid = validateAll();
    
    if (!isValid) {
      showNotification('error', 'Complete todos los campos requeridos');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Datos registrados:', formData);
      showNotification('success', 'Movimiento registrado exitosamente');
      resetForm();
    } catch (error) {
      showNotification('error', 'Error al registrar el movimiento');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center p-x">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full"
        >
          <div className=" overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-medium text-gray-900">
                Nuevo movimiento de inventario
              </h3>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <FormSelect
                  label="Tipo"
                  name="tipoMovimiento"
                  value={formData.tipoMovimiento}
                  options={tipoMovimientoOptions}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.tipoMovimiento}
                  touched={touched.tipoMovimiento}
                  required
                />

                <FormSelect
                  label="Razón"
                  name="razon"
                  value={formData.razon}
                  options={razonOptions}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.razon}
                  touched={touched.razon}
                  required
                />

                <FormSelect
                  label="Almacén"
                  name="almacenSalida"
                  value={formData.almacenSalida}
                  options={almacenOptions}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.almacenSalida}
                  touched={touched.almacenSalida}
                  required
                />

                <FormSelect
                  label="Producto"
                  name="producto"
                  value={formData.producto}
                  options={productoOptions}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.producto}
                  touched={touched.producto}
                  required
                />

                <FormSelect
                  label="Activo"
                  name="activo"
                  value={formData.activo}
                  options={activoOptions}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.activo}
                  touched={touched.activo}
                  required
                />

                <FormSelect
                  label="Destino"
                  name="destino"
                  value={formData.destino}
                  options={destinoOptions}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.destino}
                  touched={touched.destino}
                  required
                />

                <div className="col-span-2">
                  <FormInput
                    label="Referencia"
                    name="referencia"
                    value={formData.referencia}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.referencia}
                    touched={touched.referencia}
                    placeholder="Salida para abastecimiento"
                    required
                  />
                </div>

                <FormInput
                  label="Cantidad"
                  name="cantidad"
                  type="number"
                  value={formData.cantidad}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.cantidad}
                  touched={touched.cantidad}
                  min={1}
                  max={1000}
                  required
                />

                <div className="col-span-2">
                  <FormTextarea
                    label="Nota"
                    name="nota"
                    value={formData.nota}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.nota}
                    touched={touched.nota}
                    placeholder="Consumo Semanal"
                    rows={2}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={resetForm}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200"
                >
                  Limpiar
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  disabled={isSubmitting}
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
                      Procesando
                    </span>
                  ) : (
                    'Registrar'
                  )}
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <FloatingNotification
        type={notification.type}
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={() => setNotification(prev => ({ ...prev, isVisible: false }))}
        duration={4000}
      />
    </>
  );
}