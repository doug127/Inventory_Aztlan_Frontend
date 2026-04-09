import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProductForm } from './ProductForm';
import { ProductList } from './ProductList';
import { useProductForm } from '../hooks/useProductForm';
import { mockProducts } from '../data/productData';
import { FloatingNotification } from '../ui/FloatingNotification';

const Products = () => {
  const [activeTab, setActiveTab] = useState('form'); // 'form' o 'list'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState(mockProducts);
  const [notification, setNotification] = useState({
    isVisible: false,
    type: 'success',
    message: ''
  });

  const {
    formData,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    resetForm
  } = useProductForm();

  const showNotification = (type, message) => {
    setNotification({ isVisible: true, type, message });
  };

  const handleSubmit = async () => {
    const isValid = validateAll();
    
    if (!isValid) {
      showNotification('error', 'Complete todos los campos correctamente');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newProduct = {
        id: products.length + 1,
        ...formData,
        unit: { id: formData.unit_id, name: 'Litros', code: 'l' },
        category: { id: formData.product_category_id, name: 'Combustibles' }
      };
      
      setProducts(prev => [...prev, newProduct]);
      showNotification('success', 'Producto registrado exitosamente');
      resetForm();
    } catch (error) {
      showNotification('error', 'Error al registrar el producto');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full"
      >

        <div className="flex gap-1 mb-6">
          <button
            onClick={() => setActiveTab('form')}
            className={`px-6 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeTab === 'form'
                ? 'bg-black text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Agregar Producto
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`px-6 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeTab === 'list'
                ? 'bg-black text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Lista de Productos
          </button>
        </div>

        {/* Contenido */}
        <AnimatePresence mode="wait">
          {activeTab === 'form' ? (
            <ProductForm
              key="form"
              formData={formData}
              errors={errors}
              touched={touched}
              onChange={handleChange}
              onBlur={handleBlur}
              onSubmit={handleSubmit}
              onReset={resetForm}
              isSubmitting={isSubmitting}
            />
          ) : (
            <ProductList
              key="list"
              products={products}
            />
          )}
        </AnimatePresence>
      </motion.div>

      <FloatingNotification
        type={notification.type}
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={() => setNotification(prev => ({ ...prev, isVisible: false }))}
      />
    </div>
  );
};

export default Products;