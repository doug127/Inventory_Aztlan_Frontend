import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Printer } from 'lucide-react'
import logoImage from '@/assets/image/logo.jpeg'
import { useAuthStore } from '@/stores/authStore'

// Marco común de las hojas imprimibles (existencias, kardex y los reportes del Sprint 7): barra con
// [Volver] e [Imprimir] que no se imprime, encabezado con logotipo, empresa, título y filtros, y pie
// con la fecha y quién imprimió. Siempre en modo claro (van fuera del AppLayout) y con colores fijos
// de la paleta, porque es papel. "Guardar como PDF" del diálogo de impresión sirve como exportación.

export const COMPANY = 'Agrícola Aztlan, C.A.'

/** Estilos de tabla de las hojas: bordes Salvia, cabecera Menta. */
export const printTable = {
  table: 'w-full border-collapse text-[11px]',
  headRow: 'bg-[#DDEAD9] text-left text-[9.5px] uppercase tracking-wider',
  th: 'border border-[#A8B8AC] px-1.5 py-1 font-semibold',
  td: 'border border-[#A8B8AC] px-1.5 py-1 align-top',
}

/**
 * props: backTo (enlace de [Volver]), title, subtitle, filters ([{ label, value }]), orientation
 * ('portrait' | 'landscape'), ready (los datos ya están: habilita imprimir y ?auto), autoPrint,
 * children (el cuerpo de la hoja).
 */
export function PrintSheet({ backTo, backLabel = 'Volver', title, subtitle, filters = [], orientation = 'portrait', ready = true, autoPrint = false, children }) {
  const printedBy = useAuthStore((s) => s.user?.fullName)

  useEffect(() => {
    if (!ready || !autoPrint) return undefined
    const timer = setTimeout(() => window.print(), 300)
    return () => clearTimeout(timer)
  }, [ready, autoPrint])

  const width = orientation === 'landscape' ? 'max-w-[11in]' : 'max-w-[8.5in]'
  return (
    <div className='min-h-screen bg-[#E8EEE5] py-6 font-plex text-[#17261F] print:bg-white print:py-0'>
      <style>{`@page { size: letter ${orientation}; margin: 10mm; } @media print { html, body { background: #fff !important; } * { -webkit-print-color-adjust: exact; print-color-adjust: exact; } thead { display: table-header-group; } tr { break-inside: avoid; } }`}</style>

      <div className={`mx-auto mb-4 flex ${width} items-center justify-between px-4 print:hidden`}>
        <Link to={backTo} className='inline-flex items-center gap-1.5 text-sm text-[#58695E] hover:text-[#17261F]'>
          <ArrowLeft className='size-4' aria-hidden />
          {backLabel}
        </Link>
        <button
          type='button'
          onClick={() => window.print()}
          disabled={!ready}
          className='inline-flex h-10 items-center gap-2 rounded-md bg-[#285C45] px-4 text-sm font-semibold text-white hover:bg-[#214D3A] disabled:opacity-50'
        >
          <Printer className='size-4' aria-hidden />
          {ready ? 'Imprimir' : 'Preparando…'}
        </button>
      </div>

      <article className={`mx-auto ${width} bg-white px-8 py-7 shadow-sm print:max-w-none print:p-0 print:shadow-none`}>
        <header className='flex items-start justify-between gap-6 border-b-2 border-[#285C45] pb-3'>
          <div className='flex items-center gap-3'>
            <img src={logoImage} alt='' className='h-12 w-auto object-contain' />
            <div>
              <p className='text-[15px] font-semibold'>{COMPANY}</p>
              <p className='text-[11px] text-[#58695E]'>Inventario de combustibles, lubricantes, insumos y repuestos</p>
            </div>
          </div>
          <div className='text-right'>
            <p className='text-lg font-semibold leading-tight'>{title}</p>
            {subtitle && <p className='text-[12px] text-[#58695E]'>{subtitle}</p>}
          </div>
        </header>

        {filters.length > 0 && (
          <dl className='mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[11px]'>
            {filters.map((f) => (
              <div key={f.label} className='flex gap-1.5'>
                <dt className='font-semibold text-[#58695E]'>{f.label}:</dt>
                <dd>{f.value}</dd>
              </div>
            ))}
          </dl>
        )}

        <div className='mt-4'>{children}</div>

        <footer className='mt-8 flex justify-between border-t border-[#D5DED2] pt-2 text-[9.5px] text-[#58695E]'>
          <span>
            Impreso el {new Date().toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' })}
            {printedBy && <> por {printedBy}</>}
          </span>
          <span>Inventario Aztlan</span>
        </footer>
      </article>
    </div>
  )
}
