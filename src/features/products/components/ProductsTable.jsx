import { useMemo, useState } from 'react'
import { useAuthStore } from '@/stores/authStore.js'
import { HIERARCHY } from '@/lib/constants.js'
import { Package } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { NavigationButtons } from '@/components/common/NavigationButtons'
import { Table } from '@/components/common/Table'
import { columns } from '../utils/columns.jsx'
import { Action } from '@/components/common/Action'
import { Search } from '@/components/common/Search'

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
  onEdit
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [hoveredRow, setHoveredRow] = useState(null)
  const getVisiblePages = (currentPage, totalPages) => {
  if (!totalPages) return []

    const pages = new Set([1, totalPages, currentPage])

    if (currentPage > 1) pages.add(currentPage - 1)
    if (currentPage < totalPages) pages.add(currentPage + 1)

    return [...pages].sort((a, b) => a - b)
  }

  const getValue = (obj, path) => {
    return path.split('.').reduce((acc, key) => acc?.[key], obj)
  }

  const ROW_HEIGHT = 40;
  const HEADER_HEIGHT = 44;
  const MIN_ROWS = 5;

  const tableMinHeight = HEADER_HEIGHT + ROW_HEIGHT * (MIN_ROWS /0.9);

  const rows = products?.data ?? []
  const meta = products?.meta ?? {}
  const currentPage = meta.page ?? page ?? 1
  const totalPages = meta.totalPages ?? 1
  const total = meta.total ?? rows.length
  const from = total === 0 ? 0 : ((currentPage - 1) * limit) + 1
  const to = Math.min(currentPage * limit, total)
  const visiblePages = getVisiblePages(currentPage, totalPages)

  const userHierarchy = useAuthStore((s) => s.user?.hierarchy_level ?? 0)
  const canManageProducts = userHierarchy >= HIERARCHY.ADMIN;

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
              <Search value={searchTerm} />
            </div>

          </div>
        </div>

        <Table
          columns={columns}
          loading={loading}
          hoveredRow={hoveredRow}
          setHoveredRow={setHoveredRow}
          tableMinHeight={tableMinHeight}
          data={filteredProducts}
          getValue={getValue}
          actions={
            canManageProducts
              ? (product) => <Action data={product} onEdit={() => onEdit(product)} />
              : null
          }
        />
        
        <NavigationButtons
          currentPage={currentPage}
          totalPages={totalPages}
          setPage={setPage}
          from={from}
          to={to}
          total={total}
          visiblePages={visiblePages}
          meta={meta}
        />
        
      </CardContent>
    </Card>
    </div>
  )
}
