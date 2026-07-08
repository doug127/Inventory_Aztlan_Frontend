import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Package } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { columns } from '../utils/columns.jsx'

const getVisiblePages = (currentPage, totalPages) => {
  if (!totalPages) return []

  const pages = new Set([1, totalPages, currentPage])

  if (currentPage > 1) pages.add(currentPage - 1)
  if (currentPage < totalPages) pages.add(currentPage + 1)

  return [...pages].sort((a, b) => a - b)
}

export const ProductsTable = ({
  products = [],
  loading,

  page,
  setPage,
  limit,
  filters,
  setFilters,

   units = [],
    categories = [],
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [hoveredRow, setHoveredRow] = useState(null)

  const ROW_HEIGHT = 40;
  const HEADER_HEIGHT = 44;
  const MIN_ROWS = 5;

const tableMinHeight = HEADER_HEIGHT + ROW_HEIGHT * MIN_ROWS;

  const rows = products?.data ?? []
  const meta = products?.meta ?? {}
  const currentPage = meta.page ?? page ?? 1
  const totalPages = meta.totalPages ?? 1
  const total = meta.total ?? rows.length
  const from = total === 0 ? 0 : ((currentPage - 1) * limit) + 1
  const to = Math.min(currentPage * limit, total)
  const visiblePages = getVisiblePages(currentPage, totalPages)

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    if (!normalizedSearch) return rows

    return rows.filter((product) => {
      const category = product.category_product?.name ?? ''
      const unit = product.unit?.name ?? product.unit?.code ?? ''

      return (
        product.name?.toLowerCase().includes(normalizedSearch) ||
        product.code?.toLowerCase().includes(normalizedSearch) ||
        category.toLowerCase().includes(normalizedSearch) ||
        unit.toLowerCase().includes(normalizedSearch)
      )
    })
  }, [rows, searchTerm])

  return (
    <div className='flex rounded-3xl border-gray-100 shadow-sm'>
    <Card className='h-full overflow-hidden'>
      <CardContent className='flex h-full flex-col min-h-0 p-0'>
        <div className='basis-[15%] shrink-0 px-6 py-4 border-b border-gray-100'>
          <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
            <div className='flex items-center gap-3'>
              <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600'>
                <Package className='h-5 w-5' />
              </div>

              <div>
                <h3 className='text-lg font-medium text-gray-900'>
                  Lista de Productos
                </h3>
                <p className='text-sm text-gray-500 mt-0.5'>
                  {filteredProducts.length} productos en esta pagina
                </p>
              </div>
            </div>

            <div className='relative w-full md:w-64'>
              <input
                type='text'
                placeholder='Buscar producto...'
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className='w-full px-3 py-1.5 pl-8 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 focus:bg-white transition-all duration-200 placeholder:text-gray-400'
              />
              <svg
                className='absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                />
              </svg>
            </div>
          </div>
        </div>

        <div 
          className='basis-[70%] flex-1 min-h-0 overflow-auto ' 
          style={{
          minHeight: `${tableMinHeight}px`,
        }}>
          <table className='min-w-full table-fixed'>
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`${column.width} px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider`}
                  >
                    {column.title}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                  <motion.tr
                    key='loading'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <td colSpan={columns.length} className='px-6 py-12 text-center text-gray-400'>
                      <Package className='w-12 h-12 mx-auto mb-4 opacity-50' />
                      <p className='text-sm'>Cargando productos...</p>
                    </td>
                  </motion.tr>
                ) : filteredProducts.length === 0 ? (
                  <motion.tr
                    key='empty'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <td colSpan={columns.length} className='px-6 py-12 text-center text-gray-400'>
                      <svg
                        className='w-12 h-12 mx-auto mb-3 opacity-50'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={1.5}
                          d='M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4'
                        />
                      </svg>
                      <p className='text-sm'>No se encontraron productos</p>
                    </td>
                  </motion.tr>
                ) : (
                  filteredProducts.map((product, index) => (
                    <motion.tr
                      key={product.id ?? product.code}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.5, delay: index * 0.05 }}
                      onMouseEnter={() => setHoveredRow(product.id ?? product.code)}
                      onMouseLeave={() => setHoveredRow(null)}
                      className={`border-b border-gray-50 transition-colors duration-150 ${
                        hoveredRow === (product.id ?? product.code)
                          ? 'bg-gray-50/80'
                          : 'hover:bg-gray-50/50'
                      }`}
                    >
                      {columns.map((column) => (
                        <td key={column.key} className="h-10 px-6 py-2">
                          {column.render(product)}
                        </td>
                      ))}
                    </motion.tr>
                  ))
                )}
            </tbody>
          </table>
        </div>

        <nav
          className='basis-[15%] shrink-0 flex items-center flex-column flex-wrap md:flex-row justify-between px-6 py-4 border-t border-gray-100'
          aria-label='Table navigation'
        >
          <span className='text-sm font-normal text-gray-500 mb-4 md:mb-0 block w-full md:inline md:w-auto'>
            Showing{' '}
            <span className='font-semibold text-gray-900'>
              {from}-{to}
            </span>
            {' '}of{' '}
            <span className='font-semibold text-gray-900'>
              {total}
            </span>
          </span>

          <ul className='flex -space-x-px text-sm'>
            <li>
              <button
                type='button'
                disabled={!meta.hasPreviousPage}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                className='flex cursor-pointer items-center justify-center text-gray-600 bg-white box-border border border-gray-200 hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50 font-medium rounded-l-lg text-sm px-3 h-9 focus:outline-none transition-colors duration-200'
              >
                Previous
              </button>
            </li>

            {visiblePages.map((item, index) => {
              const previous = visiblePages[index - 1]
              const showGap = previous && item - previous > 1

              return (
                <li key={item} className='flex'>
                  {showGap && (
                    <span className='flex items-center justify-center text-gray-600 bg-white box-border border border-gray-200 font-medium text-sm w-9 h-9'>
                      ...
                    </span>
                  )}
                  <button
                    type='button'
                    aria-current={item === currentPage ? 'page' : undefined}
                    onClick={() => setPage(item)}
                    className={`flex cursor-pointer items-center justify-center box-border border border-gray-200 font-medium text-sm w-9 h-9 focus:outline-none transition-colors duration-200 ${
                      item === currentPage
                        ? 'bg-black text-white shadow-sm'
                        : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    {item}
                  </button>
                </li>
              )
            })}

            <li>
              <button
                type='button'
                disabled={!meta.hasNextPage}
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                className='flex cursor-pointer items-center justify-center text-gray-600 bg-white box-border border border-gray-200 hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50 font-medium rounded-r-lg text-sm px-3 h-9 focus:outline-none transition-colors duration-200'
              >
                Next
              </button>
            </li>
          </ul>
        </nav>
      </CardContent>
    </Card>
    </div>
  )
}
