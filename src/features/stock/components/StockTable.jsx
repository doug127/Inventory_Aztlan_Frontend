import React, { useState, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const StockIndicator = memo(({ quantity, maxQuantity = 2000 }) => {
  const percentage = Math.min((quantity / maxQuantity) * 100, 100);
  
  const getQuantityColor = (quantity) => {
    if (quantity <= 100) return 'text-orange-600';
    if (quantity <= 500) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getBarColor = (quantity) => {
    if (quantity <= 100) return 'bg-orange-500';
    if (quantity <= 500) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`text-sm font-medium ${getQuantityColor(quantity)}`}>
        {quantity}
      </span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          key={`stock-${quantity}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className={`h-full rounded-full ${getBarColor(quantity)}`}
        />
      </div>
    </div>
  );
});

StockIndicator.displayName = 'StockIndicator';

const SortIcon = memo(({ column, sortConfig }) => {
  if (sortConfig.key !== column) {
    return (
      <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    );
  }
  
  return sortConfig.direction === 'asc' ? (
    <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  ) : (
    <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
});

SortIcon.displayName = 'SortIcon';

const TableRow = memo(({ item, index, isHovered, onHover, onLeave }) => {
  return (
    <motion.tr
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2, delay: index * 0.02 }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={`border-b border-gray-50 transition-colors duration-150 ${
        isHovered ? 'bg-gray-50/80' : 'hover:bg-gray-50/50'
      }`}
    >
      <td className="px-6 py-3">
        <StockIndicator quantity={item.quantity} />
      </td>
      <td className="px-6 py-3">
        <span className="text-sm font-medium text-gray-900">{item.product.name}</span>
      </td>
      <td className="px-6 py-3">
        <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
          {item.product.code}
        </span>
      </td>
      <td className="px-6 py-3">
        <span className="text-sm text-gray-600 uppercase">{item.product.unit.code}</span>
      </td>
      <td className="px-6 py-3">
        <span className="text-sm text-gray-600">{item.product.category_product.name}</span>
      </td>
    </motion.tr>
  );
});

TableRow.displayName = 'TableRow';

const Pagination = memo(({ currentPage, totalPages, onPageChange, itemsPerPage, onItemsPerPageChange }) => {
  const itemsPerPageOptions = [10, 15, 25, 50];
  
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50/30">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Mostrar</span>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="text-xs border border-gray-200 rounded px-2 py-1 bg-white focus:outline-none focus:border-gray-400"
          >
            {itemsPerPageOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <span className="text-xs text-gray-500">por página</span>
        </div>
      </div>
      
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`p-1.5 rounded-lg transition-all duration-200 ${
            currentPage === 1
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        {getPageNumbers().map((page, idx) => (
          page === '...' ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">...</span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`w-7 h-7 text-xs font-medium rounded-lg transition-all duration-200 ${
                currentPage === page
                  ? 'bg-black text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {page}
            </button>
          )
        ))}
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`p-1.5 rounded-lg transition-all duration-200 ${
            currentPage === totalPages
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      <div className="text-xs text-gray-500">
        Página {currentPage} de {totalPages}
      </div>
    </div>
  );
});

Pagination.displayName = 'Pagination';

export const StockTable = ({ data = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'quantity', direction: 'desc' });
  const [hoveredRow, setHoveredRow] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  // Filtrar datos
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    return data.filter(item => 
      item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product.category_product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  const sortedData = useMemo(() => {
    const sortableData = [...filteredData];
    sortableData.sort((a, b) => {
      let aValue, bValue;
      switch (sortConfig.key) {
        case 'quantity': aValue = a.quantity; bValue = b.quantity; break;
        case 'name': aValue = a.product.name; bValue = b.product.name; break;
        case 'code': aValue = a.product.code; bValue = b.product.code; break;
        case 'unit': aValue = a.product.unit.code; bValue = b.product.unit.code; break;
        case 'category': aValue = a.product.category_product.name; bValue = b.product.category_product.name; break;
        default: aValue = a.quantity; bValue = b.quantity;
      }
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sortableData;
  }, [filteredData, sortConfig]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const totalQuantity = useMemo(() => {
    return filteredData.reduce((sum, item) => sum + item.quantity, 0);
  }, [filteredData]);

  return (
    <div className="rounded-sm bg-white border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Inventario en Stock</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {filteredData.length} productos • {totalQuantity} unidades totales
            </p>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 px-3 py-1.5 pl-8 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 focus:bg-white transition-all duration-200 placeholder:text-gray-400"
            />
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              {['quantity', 'name', 'code', 'unit', 'category'].map((key) => (
                <th key={key} className="px-6 py-3 text-left cursor-pointer hover:bg-gray-50 transition-colors duration-200" onClick={() => handleSort(key)}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {key === 'quantity' ? 'Cantidad' : key === 'name' ? 'Producto' : key === 'code' ? 'Código' : key === 'unit' ? 'Unidad' : 'Categoría'}
                    </span>
                    <SortIcon column={key} sortConfig={sortConfig} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="wait">
              {paginatedData.length === 0 ? (
                <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p className="text-sm">No se encontraron productos</p>
                  </td>
                </motion.tr>
              ) : (
                paginatedData.map((item, index) => (
                  <TableRow
                    key={item.product.id}
                    item={item}
                    index={index}
                    isHovered={hoveredRow === item.product.id}
                    onHover={() => setHoveredRow(item.product.id)}
                    onLeave={() => setHoveredRow(null)}
                  />
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {sortedData.length > 0 && (
        <>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={setItemsPerPage}
          />
          
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-6 py-2 border-t border-gray-100 bg-gray-50/30">
            <div className="flex items-center justify-end gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500"></span><span>Alto (&gt;500)</span></div>
              <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-yellow-500"></span><span>Medio (101-500)</span></div>
              <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-orange-500"></span><span>Bajo (≤100)</span></div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
};