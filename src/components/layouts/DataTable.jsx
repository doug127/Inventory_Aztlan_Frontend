import { useMemo, useState } from 'react'
import { useAuthStore } from '@/stores/authStore.js'
import { HIERARCHY } from '@/lib/constants.js'
import { Package } from 'lucide-react'
import { NavigationButtons } from '@/components/common/NavigationButtons'
import { Table } from '@/components/common/Table'
import { Action } from '@/components/common/Action'
import { Search } from '@/components/common/Search'
import { TABLE } from '@/lib/constants.js'

export const DataTable = ({
  title = 'Titulo',
  data = [],
  loading,
  page,
  setPage,
  limit,
  columns = [],
  searchFields = [],
  filters,
  setFilters,
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

  const tableMinHeight = TABLE.HEADER_HEIGHT + TABLE.ROW_HEIGHT * (TABLE.MIN_ROWS /0.9);

  const rows = data?.data ?? []
  const meta = data?.meta ?? {}
  const currentPage = meta.page ?? page ?? 1
  const totalPages = meta.totalPages ?? 1
  const total = meta.total ?? rows.length
  const from = total === 0 ? 0 : ((currentPage - 1) * limit) + 1
  const to = Math.min(currentPage * limit, total)
  const visiblePages = getVisiblePages(currentPage, totalPages)

  const userHierarchy = useAuthStore((s) => s.user?.hierarchy_level ?? 0)
  const canManageData = userHierarchy >= HIERARCHY.ADMIN;

  const getValue = (obj, path) => {
    return path.split('.').reduce((acc, key) => acc?.[key], obj)
  }

  const filteredData = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    if (!normalizedSearch) return rows

    return rows.filter((row) => 
      searchFields.some((field) => {
        const value = getValue(row, field);

        if (value == null) return false;

        return String(value)
          .toLowerCase()
          .includes(normalizedSearch);
      })
    )
  }, [rows, searchTerm, searchFields]);

  return (
    <div className='flex rounded-3xl border-gray-100 shadow-sm'>
      <div className='group/card flex h-full flex-col gap-6 overflow-hidden rounded-2xl bg-card py-6 text-sm text-card-foreground ring-1 ring-foreground/10 has-[>img:first-child]:pt-0 data-[size=sm]:gap-4 data-[size=sm]:py-4 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl'>
        <div className='flex h-full min-h-0 flex-col p-0 px-6 group-data-[size=sm]/card:px-4'>
          <div className='basis-[15%] shrink-0 px-6 py-4 border-b border-gray-100'>
            <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
              <div className='flex items-center gap-3'>
                <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600'>
                  <Package className='h-5 w-5' />
                </div>

                <div>
                  <p className='text-sm text-gray-500 mt-0.5'>
                    {filteredData.length} {title.toLowerCase()} en la pagina
                  </p>
                </div>
              </div>
              
              <div className='relative w-full md:w-64'>
                <Search value={searchTerm} onChange={setSearchTerm}/>
              </div>

            </div>
          </div>

          <Table
            columns={columns}
            loading={loading}
            hoveredRow={hoveredRow}
            setHoveredRow={setHoveredRow}
            tableMinHeight={tableMinHeight}
            data={filteredData}
            getValue={getValue}
            actions={
              canManageData
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
        </div>
      </div>
    </div>
  )
}
