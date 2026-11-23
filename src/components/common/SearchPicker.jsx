import { useEffect, useId, useRef, useState } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Buscador con lista desplegable para elegir un registro del servidor (productos, activos). La
 * búsqueda la hace quien lo usa: `onSearch(texto)` cambia la consulta y `options` trae el resultado.
 *  - value: la opción elegida ({ id, label, hint }) o null.
 *  - renderOption(option): contenido de cada fila (por defecto label y hint).
 * Teclado: ↑ ↓ para moverse, Enter para elegir, Esc para cerrar.
 */
export function SearchPicker({
  value,
  onChange,
  onSearch,
  options = [],
  loading = false,
  placeholder = 'Buscar',
  emptyText = 'Sin resultados',
  invalid = false,
  disabled = false,
  renderOption,
  ariaLabel,
}) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [active, setActive] = useState(0)
  const rootRef = useRef(null)
  const inputRef = useRef(null)
  const listId = useId()

  useEffect(() => {
    if (!open) return undefined
    const close = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [open])

  // Nuevos resultados: vuelve a la primera fila. Se compara por ids porque `options` cambia de identidad en cada render.
  const optionIds = options.map((o) => o.id).join(',')
  useEffect(() => setActive(0), [optionIds])

  const start = () => {
    if (disabled) return
    setOpen(true)
    setText('')
    onSearch?.('')
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  const choose = (option) => {
    onChange(option)
    setOpen(false)
  }

  const onKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((i) => Math.min(i + 1, options.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      if (options[active]) choose(options[active])
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  const box = cn(
    'flex h-11 w-full items-center gap-2 rounded-md border bg-white px-3 text-left text-[15px] outline-none transition',
    invalid ? 'border-red-500' : 'border-line',
    open ? 'border-forest-700 ring-4 ring-forest-700/10' : 'focus-visible:border-forest-700 focus-visible:ring-4 focus-visible:ring-forest-700/10',
    disabled && 'cursor-not-allowed bg-sand-50 text-ink-500'
  )

  return (
    <div ref={rootRef} className='relative'>
      {open ? (
        <div className={box}>
          <Search className='size-4 shrink-0 text-ink-500' aria-hidden />
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              onSearch?.(e.target.value)
            }}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            aria-label={ariaLabel}
            role='combobox'
            aria-expanded='true'
            aria-controls={listId}
            aria-activedescendant={options[active] ? `${listId}-${options[active].id}` : undefined}
            className='min-w-0 flex-1 bg-transparent outline-none placeholder:text-ink-500'
          />
        </div>
      ) : (
        <button type='button' onClick={start} disabled={disabled} aria-label={ariaLabel} aria-invalid={invalid || undefined} className={box}>
          <span className={cn('min-w-0 flex-1 truncate', !value && 'text-ink-500')}>
            {value ? (
              <>
                {value.label}
                {value.hint && <span className='ml-1.5 text-sm text-ink-500'>{value.hint}</span>}
              </>
            ) : (
              placeholder
            )}
          </span>
          {value && !disabled ? (
            <span
              role='button'
              tabIndex={-1}
              aria-label='Quitar selección'
              onClick={(e) => {
                e.stopPropagation()
                onChange(null)
              }}
              className='grid size-6 place-items-center rounded text-ink-500 hover:bg-sand-50 hover:text-ink-900'
            >
              <X className='size-3.5' />
            </span>
          ) : (
            <ChevronDown className='size-4 shrink-0 text-ink-500' aria-hidden />
          )}
        </button>
      )}

      {open && (
        <ul
          id={listId}
          role='listbox'
          className='absolute inset-x-0 top-full z-30 mt-1 max-h-72 overflow-y-auto rounded-lg border border-line/80 bg-white p-1 shadow-lg'
        >
          {loading && options.length === 0 && <li className='px-3 py-2.5 text-sm text-ink-500'>Buscando…</li>}
          {!loading && options.length === 0 && <li className='px-3 py-2.5 text-sm text-ink-500'>{emptyText}</li>}
          {options.map((option, index) => (
            <li
              key={option.id}
              id={`${listId}-${option.id}`}
              role='option'
              aria-selected={index === active}
              onPointerEnter={() => setActive(index)}
              onPointerDown={(e) => {
                e.preventDefault()
                choose(option)
              }}
              className={cn('cursor-pointer rounded-md px-3 py-2 text-sm', index === active && 'bg-sand-50')}
            >
              {renderOption ? (
                renderOption(option)
              ) : (
                <>
                  <span className='block truncate font-medium'>{option.label}</span>
                  {option.hint && <span className='block truncate text-xs text-ink-500'>{option.hint}</span>}
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
