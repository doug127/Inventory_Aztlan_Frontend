import { useId, useMemo, useState } from 'react'
import { Ban, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CategoryIcon, ICON_GROUPS, getCategoryIcon } from './categoryIcons'

const normalize = (text) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/**
 * Selector de icono del catálogo (HU-301), en línea para que funcione igual en el móvil.
 * value: clave del icono o null. onChange(clave | null).
 */
export function IconPicker({ label = 'Icono', value, onChange, error, hint }) {
  const labelId = useId()
  const [query, setQuery] = useState('')
  const selected = getCategoryIcon(value)

  const groups = useMemo(() => {
    const term = normalize(query.trim())
    if (!term) return ICON_GROUPS
    return ICON_GROUPS.map((g) => ({
      ...g,
      icons: g.icons.filter((i) => normalize(`${i.label} ${i.words} ${i.key}`).includes(term)),
    })).filter((g) => g.icons.length)
  }, [query])

  const tile =
    'grid size-10 place-items-center rounded-md border text-ink-900 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-forest-700/40'

  return (
    <div>
      <p id={labelId} className='mb-1.5 text-[13px] font-medium text-ink-900'>
        {label}
      </p>
      <div className={cn('rounded-md border bg-white', error ? 'border-red-500' : 'border-line')}>
        <div className='flex items-center gap-3 border-b border-line/70 px-3 py-2.5'>
          <span className='grid size-10 shrink-0 place-items-center rounded-md bg-forest-700 text-white'>
            <CategoryIcon name={value} className='size-5' />
          </span>
          <div className='min-w-0 flex-1'>
            <p className='truncate text-sm font-medium'>{selected ? selected.label : 'Sin icono'}</p>
            <p className='truncate text-xs text-ink-500'>{selected ? selected.key : 'Se mostrará el icono genérico'}</p>
          </div>
        </div>

        <div className='relative border-b border-line/70'>
          <Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-500' aria-hidden />
          <input
            type='search'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Buscar: tractor, aceite, lote…'
            aria-label='Buscar icono'
            className='h-10 w-full bg-transparent pl-9 pr-3 text-sm outline-none'
          />
        </div>

        <div role='radiogroup' aria-labelledby={labelId} className='max-h-60 space-y-3 overflow-y-auto overscroll-contain p-3'>
          {!query && (
            <button
              type='button'
              role='radio'
              aria-checked={!value}
              onClick={() => onChange(null)}
              className={cn(
                'flex h-9 items-center gap-2 rounded-md border px-3 text-sm transition-colors',
                !value ? 'border-forest-700 bg-forest-50 text-forest-800' : 'border-line hover:bg-sand-50'
              )}
            >
              <Ban className='size-4' aria-hidden />
              Sin icono
            </button>
          )}
          {groups.map((group) => (
            <div key={group.label}>
              <p className='mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-500'>{group.label}</p>
              <div className='grid grid-cols-[repeat(auto-fill,minmax(2.5rem,1fr))] gap-1.5'>
                {group.icons.map(({ key, Icon, label: name }) => (
                  <button
                    key={key}
                    type='button'
                    role='radio'
                    aria-checked={value === key}
                    aria-label={name}
                    title={name}
                    onClick={() => onChange(key)}
                    className={cn(tile, value === key ? 'border-forest-700 bg-forest-700 text-white' : 'border-transparent hover:border-line hover:bg-sand-50')}
                  >
                    <Icon className='size-[18px]' aria-hidden />
                  </button>
                ))}
              </div>
            </div>
          ))}
          {!groups.length && <p className='py-4 text-center text-sm text-ink-500'>No hay iconos para “{query}”</p>}
        </div>
      </div>
      {error ? <p className='mt-1.5 text-xs text-red-600'>{error}</p> : hint && <p className='mt-1.5 text-xs text-ink-500'>{hint}</p>}
    </div>
  )
}
