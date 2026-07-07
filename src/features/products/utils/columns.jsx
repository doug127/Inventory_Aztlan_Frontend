export const columns = [
  {
    key: "name",
    title: "Producto",
    width: "w-[28%]",
    render: (product) => (
      <span
        className="block truncate text-sm font-medium text-gray-900"
        title={product.name}
      >
        {product.name}
      </span>
    ),
  },
  {
    key: "code",
    title: "Código",
    width: "w-[14%]",
    render: (product) => (
      <span
        className="block truncate text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded"
        title={product.code}
      >
        {product.code}
      </span>
    ),
  },
  {
    key: "category",
    title: "Categoría",
    width: "w-[18%]",
    render: (product) => (
      <span
        className="block truncate text-sm text-gray-600"
        title={product.category_product?.name ?? "-"}
      >
        {product.category_product?.name ?? "-"}
      </span>
    ),
  },
  {
    key: "unit",
    title: "Unidad",
    width: "w-[12%]",
    render: (product) => (
      <span
        className="block truncate text-sm text-gray-600 uppercase"
        title={product.unit?.code ?? "-"}
      >
        {product.unit?.code ?? "-"}
      </span>
    ),
  },
  {
    key: "content",
    title: "Contenido",
    width: "w-[12%]",
    render: (product) => (
      <span className="block truncate text-sm text-gray-600">
        {product.content_quantity}
      </span>
    ),
  },
  {
    key: "stock",
    title: "Stock",
    width: "w-[16%]",
    render: (product) => (
      <div className="flex min-w-0 items-center gap-2">
        <span className="text-sm font-medium text-gray-700">
          {product.min_stock}
        </span>
        <span className="text-xs text-gray-400">-</span>
        <span className="text-xs text-gray-400">
          {product.max_stock ?? "-"}
        </span>
      </div>
    ),
  },
];