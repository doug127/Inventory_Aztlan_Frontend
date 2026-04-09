export const unitOptions = [
  { id: 1, name: 'Litros', code: 'l' },
  { id: 2, name: 'Kilogramos', code: 'kg' },
  { id: 3, name: 'Unidades', code: 'u' },
  { id: 4, name: 'Galones', code: 'gal' },
  { id: 5, name: 'Metros', code: 'm' }
];

export const categoryOptions = [
  { id: 1, name: 'Combustibles' },
  { id: 2, name: 'Lubricantes' },
  { id: 3, name: 'Refrigerantes' },
  { id: 4, name: 'Filtros' },
  { id: 5, name: 'Aditivos' },
  { id: 6, name: 'Baterías' }
];

export const mockProducts = [
  {
    id: 1,
    name: 'Diesel',
    code: 'DIE-001',
    content_quantity: 1,
    min_stock: 100,
    max_stock: 30000,
    unit_id: 2,
    product_category_id: 1,
    unit: { id: 2, name: 'Litros', code: 'l' },
    category: { id: 1, name: 'Combustibles' }
  },
  {
    id: 2,
    name: 'Gasolina 95',
    code: 'GAS-95',
    content_quantity: 1,
    min_stock: 200,
    max_stock: 25000,
    unit_id: 2,
    product_category_id: 1,
    unit: { id: 2, name: 'Litros', code: 'l' },
    category: { id: 1, name: 'Combustibles' }
  },
  {
    id: 3,
    name: 'Aceite SAE 15w40',
    code: 'LUB-15W40',
    content_quantity: 1,
    min_stock: 50,
    max_stock: 5000,
    unit_id: 2,
    product_category_id: 2,
    unit: { id: 2, name: 'Litros', code: 'l' },
    category: { id: 2, name: 'Lubricantes' }
  }
];