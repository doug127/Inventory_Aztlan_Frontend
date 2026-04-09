import React from 'react';
import { motion } from 'framer-motion';
import { StockTable } from './StockTable';
import { stockData } from '../data/stockData';

export const Stock = () => {
  return (
    <div className="min-h-screen p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full"
      >
        <StockTable data={stockData} />
      </motion.div>
    </div>
  );
};