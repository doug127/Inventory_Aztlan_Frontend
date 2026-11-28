import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowUp, ChevronRight, Fuel, Printer } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDateTime } from '@/lib/format'
import { Pager } from '@/components/common/Pager'
import { SearchPicker } from '@/components/common/SearchPicker'
import { TABLE_PAGE_SIZE } from '@/lib/pagination'
import { EASE_OUT } from '@/features/auth/components/AuthUI'
import { useProduct } from '@/features/products/productsApi'
import { useCategoryOptions } from '@/features/product-categories/productCategoriesApi'
import { useAssetCategoryTree } from '@/features/asset-categories/assetCategoriesApi'
import { categoryPathLabel, useAsset, useAssets } from '@/features/assets/assetsApi'
import { ProductPicker, useDebounced } from '@/features/movements/movementForm'
import { PERIOD_PRESETS, consumptionQuery, periodLabel, qty, readConsumptionFilters, useConsumptionReport } from './reportsApi'

// Reporte de consumo (HU-501, user_flow.md §14): consumo neto (consumido − corregido con REV-,
// business_rules.md §5) por activo y producto, o por categoría de activo y producto. Por categoría,
// se comparan las hijas de la categoría elegida (sin ella, las raíces); una fila que no es hoja baja
// un nivel. Cantidades de productos distintos nunca se suman: los totales van por producto.
// Los filtros viven en la URL, que también usa la hoja imprimible.

const fieldClass = 'h-11 w-full rounded-md border border-line bg-white px-2 text-sm outline-none focus:border-forest-700'
const labelClass = 'mb-1.5 block text-xs font-medium text-ink-500'

const indent = (nodes, depth = 0) =>
  nodes.flatMap((n) => [{ id: n.id, label: `${'  '.repeat(depth)}${depth ? '└ ' : ''}${n.name}`, parentId: n.parent?.id ?? null, node: n }, ...indent(n.children ?? [], depth + 1)])

function AssetFilter({ value, onChange, categoryId }) {
  const [search, setSearch] = useState('')
  const debounced = useDebounced(search)
  const { data, isFetching } = useAssets({ search: debounced || undefined, limit: 12, sort: 'code', categoryId: categoryId || undefined })
  const options = (data?.data ?? []).map((a) => ({ id: a.id, label: `${a.code} · ${a.name}`, hint: categoryPathLabel(a.category.path), asset: a }))
  return (
    <SearchPicker
      ariaLabel='Activo'
      value={value ? { id: value.id, label: `${value.code} · ${value.name}` } : null}
      onChange={(option) => onChange(option?.asset ?? null)}
      onSearch={setSearch}
      options={options}
      loading={isFetching}
      placeholder='Todos los activos'
      emptyText='Ningún activo coincide'
    />
  )
}

const Net = ({ value, unit, className }) => (
  <span className={cn('whitespace-nowrap font-semibold tabular-nums', Number(value) < 0 && 'text-aviso', className)}>
    {qty(value)} <span className='font-normal text-ink-500'>{unit}</span>
  </span>
)

export function ConsumptionReportPage() {
  const [params, setParams] = useSearchParams()
  const filters = readConsumptionFilters(params)
  const { groupBy, from, to, productId, productCategoryId, assetId, assetCategoryId } = filters
  const page = Math.max(1, Number(params.get('page')) || 1)

  const update = (changes) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const [key, value] of Object.entries(changes)) {
          if (value === '' || value === undefined || value === null) next.delete(key)
          else next.set(key, String(value))
        }
        if (!('page' in changes)) next.delete('page')
        return next
      },
      { replace: true }
    )

  const { data: product } = useProduct(productId)
  const { data: asset } = useAsset(groupBy === 'asset' ? assetId : undefined)
  const { data: productTree = [] } = useCategoryOptions()
  const { data: assetTree = [] } = useAssetCategoryTree()
  const productCategories = useMemo(() => indent(productTree), [productTree])
  const assetCategories = useMemo(() => indent(assetTree), [assetTree])
  const currentAssetCategory = assetCategories.find((c) => c.id === assetCategoryId)

  const { data, isLoading, isError, error, isPlaceholderData } = useConsumptionReport({ ...consumptionQuery(filters), page, limit: TABLE_PAGE_SIZE })
  const rows = data?.data ?? []
  const summary = data?.meta?.summary
  // La forma de la tabla sale de los datos en pantalla, no del botón recién pulsado (keepPreviousData).
  const shownByCategory = (data?.meta?.filters?.groupBy ?? groupBy) === 'assetCategory'
  const activePreset = PERIOD_PRESETS.find((p) => {
    const range = p.range(new Date())
    return (range.from ?? undefined) === from && (range.to ?? undefined) === to
  })?.key

  const printQuery = new URLSearchParams([...params].filter(([k]) => k !== 'page')).toString()
  const groupNoun = shownByCategory ? (summary?.groups === 1 ? 'categoría' : 'categorías') : summary?.groups === 1 ? 'activo' : 'activos'

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: EASE_OUT }} className='mx-auto max-w-6xl font-plex text-ink-900'>
      <Link to='/reports' className='inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900'>
        <ArrowLeft className='size-4' aria-hidden />
        Reportes
      </Link>
      <div className='mt-2 flex flex-wrap items-start justify-between gap-3'>
        <div>
          <h1 className='text-[1.75rem] font-semibold tracking-tight'>Consumo {groupBy === 'asset' ? 'por activo' : 'por categoría de activo'}</h1>
          <p className='mt-0.5 text-sm text-ink-500'>Consumo neto: lo retirado por consumo menos lo corregido. {periodLabel({ from, to })}.</p>
        </div>
        <Link
          to={`/reports/consumption/print?${printQuery}`}
          className='inline-flex h-10 shrink-0 items-center gap-2 rounded-md border border-line bg-white px-4 text-sm font-semibold hover:border-ink-500/40'
        >
          <Printer className='size-4' aria-hidden />
          Imprimir
        </Link>
      </div>

      <section className='mt-5 rounded-xl border border-line/80 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:p-5'>
        <div className='flex flex-wrap items-center gap-3'>
          <div className='flex gap-1 rounded-lg bg-sand-50 p-1 ring-1 ring-line' role='radiogroup' aria-label='Agrupar'>
            {[
              { id: 'asset', label: 'Por activo' },
              { id: 'assetCategory', label: 'Por categoría de activo' },
            ].map((v) => (
              <button
                key={v.id}
                type='button'
                role='radio'
                aria-checked={groupBy === v.id}
                onClick={() => update({ groupBy: v.id === 'asset' ? '' : v.id })}
                className={cn('h-8 rounded-md px-3 text-xs font-medium transition-colors', groupBy === v.id ? 'bg-white text-ink-900 shadow-sm ring-1 ring-line' : 'text-ink-500 hover:text-ink-900')}
              >
                {v.label}
              </button>
            ))}
          </div>
          <div className='flex flex-wrap gap-1 sm:ml-auto' role='group' aria-label='Período rápido'>
            {PERIOD_PRESETS.map((p) => (
              <button
                key={p.key}
                type='button'
                aria-pressed={activePreset === p.key}
                onClick={() => update(p.range(new Date()))}
                className={cn(
                  'h-8 rounded-md border px-2.5 text-xs font-medium transition-colors',
                  activePreset === p.key ? 'border-forest-700 bg-forest-50 text-forest-800' : 'border-line bg-white text-ink-500 hover:text-ink-900'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className='mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
          <div className='sm:col-span-2 lg:col-span-1'>
            <span className={labelClass}>Período</span>
            <div className='flex items-center gap-2'>
              <input type='date' value={from ?? ''} max={to || undefined} onChange={(e) => update({ from: e.target.value })} aria-label='Desde' className={cn(fieldClass, 'min-w-0 flex-1')} />
              <span className='text-xs text-ink-500'>a</span>
              <input type='date' value={to ?? ''} min={from || undefined} onChange={(e) => update({ to: e.target.value })} aria-label='Hasta' className={cn(fieldClass, 'min-w-0 flex-1')} />
            </div>
          </div>
          <label>
            <span className={labelClass}>Categoría de activo</span>
            <select value={assetCategoryId ?? ''} onChange={(e) => update({ assetCategory: e.target.value, asset: '' })} className={fieldClass}>
              <option value=''>Todas</option>
              {assetCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          {groupBy === 'asset' ? (
            <div>
              <span className={labelClass}>Activo</span>
              <AssetFilter value={assetId ? (asset ?? null) : null} onChange={(a) => update({ asset: a?.id })} categoryId={assetCategoryId} />
            </div>
          ) : (
            <div className='hidden lg:block' />
          )}
          <label>
            <span className={labelClass}>Categoría de producto</span>
            <select value={productCategoryId ?? ''} onChange={(e) => update({ productCategory: e.target.value })} className={fieldClass}>
              <option value=''>Todas</option>
              {productCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <div className='sm:col-span-2'>
            <span className={labelClass}>Producto</span>
            <ProductPicker value={productId ? (product ?? null) : null} onChange={(p) => update({ product: p?.id })} />
          </div>
        </div>
      </section>

      {/* Totales por producto de todo el alcance: no dependen de la página. */}
      <section className='mt-5 rounded-xl border border-line/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]' aria-label='Totales por producto'>
        <div className='flex flex-wrap items-baseline justify-between gap-2 border-b border-line/60 px-4 py-3 sm:px-5'>
          <h2 className='text-sm font-semibold'>Totales por producto</h2>
          {summary && (
            <p className='text-xs text-ink-500'>
              {summary.groups} {groupNoun} · {summary.lines} {summary.lines === 1 ? 'línea' : 'líneas'}
            </p>
          )}
        </div>
        {summary?.products.length ? (
          <ul className='grid gap-px bg-line/50 sm:grid-cols-2 lg:grid-cols-3'>
            {summary.products.map((p) => (
              <li key={p.product.id} className='flex items-center justify-between gap-3 bg-white px-4 py-3 sm:px-5'>
                <span className='min-w-0'>
                  <span className='block truncate text-sm font-medium'>{p.product.name}</span>
                  <span className='block text-xs text-ink-500'>
                    <span className='font-mono'>{p.product.code}</span>
                    {Number(p.corrected) > 0 && <> · corregido {qty(p.corrected)}</>}
                  </span>
                </span>
                <Net value={p.net} unit={p.product.unitCode} className='text-base' />
              </li>
            ))}
          </ul>
        ) : (
          !isLoading && <p className='px-5 py-4 text-sm text-ink-500'>Sin consumos con estos filtros.</p>
        )}
      </section>

      <section className='mt-5 rounded-xl border border-line/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]'>
        {shownByCategory && currentAssetCategory && (
          <div className='flex flex-wrap items-center gap-2 border-b border-line/60 px-4 py-2.5 text-sm sm:px-5'>
            <span className='text-ink-500'>Dentro de</span>
            <span className='font-medium'>{currentAssetCategory.node.name}</span>
            <button
              type='button'
              onClick={() => update({ assetCategory: currentAssetCategory.parentId ?? '' })}
              className='ml-auto inline-flex h-8 items-center gap-1.5 rounded-md border border-line bg-white px-2.5 text-xs font-medium hover:border-ink-500/40'
            >
              <ArrowUp className='size-3.5' aria-hidden />
              Subir un nivel
            </button>
          </div>
        )}

        <table className={cn('hidden w-full text-sm transition-opacity md:table', isPlaceholderData && 'opacity-60')}>
          <thead className='border-b border-line/60 bg-sand-50/60 text-left text-xs font-medium uppercase tracking-wide text-ink-500'>
            <tr>
              <th className='px-5 py-2.5 font-medium'>{shownByCategory ? 'Categoría' : 'Activo'}</th>
              <th className='px-3 py-2.5 font-medium'>Producto</th>
              {shownByCategory && <th className='px-3 py-2.5 text-right font-medium'>Activos</th>}
              <th className='px-3 py-2.5 text-right font-medium'>Consumido</th>
              <th className='px-3 py-2.5 text-right font-medium'>Corregido</th>
              <th className='px-3 py-2.5 text-right font-medium'>Neto</th>
              {!shownByCategory && <th className='px-5 py-2.5 font-medium'>Último consumo</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const unit = r.product.unitCode
              return (
                <tr key={`${(r.asset ?? r.assetCategory).id}|${r.product.id}`} className='border-t border-line/50 align-top first:border-t-0'>
                  <td className='px-5 py-2.5'>
                    {r.asset ? (
                      <Link to={`/assets/${r.asset.id}`} className='group'>
                        <span className='font-mono text-xs font-semibold group-hover:underline'>{r.asset.code}</span>
                        <span className='block text-ink-900'>{r.asset.name}</span>
                        <span className='block text-xs text-ink-500'>
                          {r.asset.category.name}
                          {!r.asset.isActive && ' · Inactivo'}
                        </span>
                      </Link>
                    ) : r.assetCategory && !r.assetCategory.isLeaf ? (
                      <button type='button' onClick={() => update({ assetCategory: r.assetCategory.id })} className='group inline-flex items-center gap-1 text-left font-medium'>
                        <span className='group-hover:underline'>{r.assetCategory.name}</span>
                        <ChevronRight className='size-4 text-ink-500' aria-label='Ver sus subcategorías' />
                      </button>
                    ) : (
                      <span className='font-medium'>{r.assetCategory?.name}</span>
                    )}
                  </td>
                  <td className='px-3 py-2.5'>
                    {r.product.name}
                    <span className='block font-mono text-xs text-ink-500'>{r.product.code}</span>
                  </td>
                  {shownByCategory && <td className='px-3 py-2.5 text-right tabular-nums'>{r.assets}</td>}
                  <td className='whitespace-nowrap px-3 py-2.5 text-right tabular-nums'>{qty(r.consumed)}</td>
                  <td className='whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-ink-500'>{Number(r.corrected) ? `−${qty(r.corrected)}` : '—'}</td>
                  <td className='px-3 py-2.5 text-right'>
                    <Net value={r.net} unit={unit} />
                  </td>
                  {!shownByCategory && <td className='whitespace-nowrap px-5 py-2.5 text-ink-500'>{r.lastConsumedAt ? formatDateTime(r.lastConsumedAt) : '—'}</td>}
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Móvil: tarjetas */}
        <ul className={cn('divide-y divide-line/60 md:hidden', isPlaceholderData && 'opacity-60')}>
          {rows.map((r) => (
            <li key={`${(r.asset ?? r.assetCategory).id}|${r.product.id}`} className='flex items-start gap-3 px-4 py-3'>
              <div className='min-w-0 flex-1'>
                {r.asset ? (
                  <Link to={`/assets/${r.asset.id}`} className='text-sm font-medium hover:underline'>
                    <span className='font-mono'>{r.asset.code}</span> · {r.asset.name}
                  </Link>
                ) : r.assetCategory && !r.assetCategory.isLeaf ? (
                  <button type='button' onClick={() => update({ assetCategory: r.assetCategory.id })} className='inline-flex items-center gap-1 text-left text-sm font-medium'>
                    {r.assetCategory.name}
                    <ChevronRight className='size-4 text-ink-500' aria-label='Ver sus subcategorías' />
                  </button>
                ) : (
                  <p className='text-sm font-medium'>{r.assetCategory?.name}</p>
                )}
                <p className='truncate text-xs text-ink-500'>
                  {r.product.code} · {r.product.name}
                  {shownByCategory && <> · {r.assets} {r.assets === 1 ? 'activo' : 'activos'}</>}
                </p>
              </div>
              <div className='shrink-0 text-right'>
                <Net value={r.net} unit={r.product.unitCode} className='text-sm' />
                {Number(r.corrected) > 0 && <p className='text-xs tabular-nums text-ink-500'>corregido {qty(r.corrected)}</p>}
              </div>
            </li>
          ))}
        </ul>

        {isLoading && <div className='m-4 h-24 animate-pulse rounded-lg bg-sand-50' />}
        {!isLoading && !isError && rows.length === 0 && (
          <div className='flex flex-col items-center px-6 py-12 text-center'>
            <span className='grid size-11 place-items-center rounded-full bg-sand-50 text-ink-500'>
              <Fuel className='size-5' aria-hidden />
            </span>
            <p className='mt-3 text-sm font-medium'>Sin consumos con estos filtros</p>
            <p className='mt-1 max-w-md text-sm text-ink-500'>Prueba con otro período o quita algún filtro.</p>
          </div>
        )}
        {isError && <p className='px-6 py-12 text-center text-sm text-red-600'>{error?.message ?? 'No se pudo generar el reporte'}</p>}
        <div className='border-t border-line/60 px-4 py-2 empty:hidden sm:px-5'>
          <Pager pagination={data?.meta?.pagination} onPage={(p) => update({ page: p })} label='Páginas del reporte' />
        </div>
      </section>
    </motion.div>
  )
}
