import { motion } from 'framer-motion'
import { Package } from 'lucide-react'

export const Table = ({ 
  columns, 
  loading, 
  hoveredRow, 
  setHoveredRow, 
  tableMinHeight, 
  data,
  getValue,
  actions,
}) => {
    
  const totalColumns = columns.length + (actions ? 1 : 0);
  const classAction = 'w-[8%] xl:min-w-0 px-6 text-center'
  return (
    <div 
      className='basis-[70%] flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-auto' 
      style={{
        minHeight: tableMinHeight,
        maxHeight: tableMinHeight,
      }}
    >
      <table className='w-full min-w-[1440px] min-[1440px]:min-w-full table-fixed '>
        <thead className="sticky top-0 z-10 ">
          <tr className="border-b border-gray-100">
            {columns.map((column, index) => {
              const isFirst = index === 0
              const isLast = !actions && index === columns.length - 1

              return (
                <th
                  key={column.key}
                  className={`${column.width} ${isFirst ? 'rounded-tl-md' : ''} 
                  ${isLast ? 'rounded-tr-md' : ''}
                   bg-blue-500 px-6 py-3 whitespace-nowrap text-left text-xs font-medium 
                   text-white uppercase tracking-wider`}
                >
                  {column.title}
                </th>
                
              )
            })}
            {actions && (
                <th
                className={`rounded-tr-md ${classAction} bg-blue-500 py-3 text-xs font-medium uppercase tracking-wider text-white`}
                >
                    Acciones
                </th>
            )}
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {loading ? (
              <motion.tr
                key='loading'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-10 border-b border-gray-50 transition-colors"
              >
                <td colSpan={totalColumns} className='px-6 py-12 text-center text-gray-400'>
                  <Package className='w-12 h-12 mx-auto mb-4 opacity-50' />
                  <p className='text-sm'>Cargando productos...</p>
                </td>
              </motion.tr>
            ) : data.length === 0 ? (
              <motion.tr
                key='empty'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <td colSpan={totalColumns} className='px-6 py-12 text-center text-gray-400'>
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
              data.map((elements, index) => (
                <motion.tr
                  key={elements.id ?? elements.code}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  onMouseEnter={() => setHoveredRow(elements.id ?? elements.code)}
                  onMouseLeave={() => setHoveredRow(null)}
                  className={`border-b border-gray-50 transition-colors duration-150 ${
                    hoveredRow === (elements.id ?? elements.code)
                      ? 'bg-gray-300'
                      : index % 2 === 0
                        ? 'bg-white'
                        : 'bg-gray-200'
                  }`}
                >
                  {columns.map((column) => {
                    const rawValue = column.render
                      ? column.render(elements)
                      : getValue(elements, column.field);
                    const value = rawValue ?? "-";

                    return (
                      <td key={column.key} className="h-10 px-6 align-middle overflow-hidden">
                        <span 
                          className={`block w-full truncate ${column.className}`}
                          title={String(value)}
                        >
                          {value}
                        </span>
                      </td>
                    );
                })}
                {actions && (
                  <td className={classAction}>
                        {actions(elements)}
                    </td>
                )}
                </motion.tr>
              ))
            )}
        </tbody>
      </table>
    </div>
  )
}
