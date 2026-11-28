import { useEffect } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Printer } from 'lucide-react'
import logoImage from '@/assets/image/logo.jpeg'
import { useAuthStore } from '@/stores/authStore'
import { MOVEMENT_TYPE_LABELS, REASON_LABELS, useMovement } from './movementsApi'

// Hoja imprimible de un movimiento (HU-410, user_flow.md §5): número de documento, fecha, almacén,
// motivo, las líneas con su activo destino, el total por producto y espacio para las firmas de quien
// entrega (el almacenista que la registró) y de quien recibe (retirado por). Va fuera del AppLayout
// (sin menú ni barra superior) y siempre en modo claro: es papel. Tamaño carta.
// La orden de retiro es el caso principal; el resto de los tipos usa el mismo formato con sus firmas.
// ?auto=1 abre el diálogo de impresión al cargar (el botón [Imprimir orden] del resultado lo usa).

const COMPANY = 'Agrícola Aztlan, C.A.'

const numberFormat = new Intl.NumberFormat('es', { minimumFractionDigits: 0, maximumFractionDigits: 3 })
const qty = (value) => numberFormat.format(Number(value))
const dateTime = (value) => new Date(value).toLocaleString('es', { dateStyle: 'long', timeStyle: 'short' })

/** Título del documento según el tipo. */
const titleOf = (m) =>
  m.reference?.startsWith('REV-')
    ? `Corrección (${MOVEMENT_TYPE_LABELS[m.movementType].toLowerCase()})`
    : m.movementType === 'IN' && m.reason === 'DEVOLUCION'
      ? 'Devolución de préstamo'
      : { OUT: 'Orden de retiro', IN: 'Nota de entrada', TRANSFER: 'Orden de traslado', ADJUST: 'Acta de ajuste' }[m.movementType]

/** Las firmas: quién entrega, quién recibe y, en algunos tipos, quién autoriza o recibe en destino. */
const signaturesOf = (m) => {
  const registered = m.createdBy.fullName
  switch (m.movementType) {
    case 'OUT':
      return [
        { role: 'Entregado por (almacén)', name: registered },
        { role: m.reason === 'PRESTAMO' ? 'Recibido por (responsable de devolverlo)' : 'Retirado por', name: m.receivedBy },
        { role: 'Autorizado por', name: null },
      ]
    case 'IN':
      return [
        { role: m.reason === 'DEVOLUCION' ? 'Devuelto por' : 'Entregado por', name: m.receivedBy },
        { role: 'Recibido por (almacén)', name: registered },
      ]
    case 'TRANSFER':
      return [
        { role: `Despachado por (${m.fromWarehouse.code})`, name: registered },
        { role: 'Trasladado por', name: m.receivedBy },
        { role: `Recibido por (${m.toWarehouse.code})`, name: null },
      ]
    default:
      return [
        { role: 'Elaborado por', name: registered },
        { role: 'Revisado por', name: null },
      ]
  }
}

const Info = ({ label, children, mono }) => (
  <div>
    <dt className='text-[10px] font-semibold uppercase tracking-wider text-[#58695E]'>{label}</dt>
    <dd className={mono ? 'font-mono text-[13px]' : 'text-[13px]'}>{children}</dd>
  </div>
)

export function MovementPrintPage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const { data: m, isLoading, isError, error } = useMovement(Number(id))
  const printedBy = useAuthStore((s) => s.user?.fullName)

  // Imprimir al cargar si se pidió (?auto=1), cuando los datos ya están en pantalla.
  useEffect(() => {
    if (m && params.get('auto') === '1') {
      const timer = setTimeout(() => window.print(), 300)
      return () => clearTimeout(timer)
    }
  }, [m, params])

  if (isError) {
    return <p className='p-10 text-center text-sm text-red-600'>{error?.status === 404 ? 'Este movimiento no existe.' : (error?.message ?? 'No se pudo cargar')}</p>
  }
  if (isLoading || !m) return <div className='mx-auto mt-10 h-96 max-w-[8.5in] animate-pulse rounded bg-[#F4F7F2]' />

  const warehouse =
    m.fromWarehouse && m.toWarehouse ? `${m.fromWarehouse.code} ${m.fromWarehouse.name} → ${m.toWarehouse.code} ${m.toWarehouse.name}` : `${(m.fromWarehouse ?? m.toWarehouse).code} · ${(m.fromWarehouse ?? m.toWarehouse).name}`
  const hasAssets = m.lines.some((l) => l.asset)
  const hasNotes = m.lines.some((l) => l.note)
  const showTotals = m.totals.some((t) => t.lines > 1)

  return (
    <div className='min-h-screen bg-[#E8EEE5] py-6 font-plex text-[#17261F] print:bg-white print:py-0'>
      {/* Carta con márgenes de 12 mm; los colores de fondo de la tabla se imprimen. */}
      <style>{`@page { size: letter; margin: 12mm; } @media print { html, body { background: #fff !important; } * { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }`}</style>

      <div className='mx-auto mb-4 flex max-w-[8.5in] items-center justify-between px-4 print:hidden'>
        <Link to={`/movements/${m.id}`} className='inline-flex items-center gap-1.5 text-sm text-[#58695E] hover:text-[#17261F]'>
          <ArrowLeft className='size-4' aria-hidden />
          Volver al movimiento
        </Link>
        <button
          type='button'
          onClick={() => window.print()}
          className='inline-flex h-10 items-center gap-2 rounded-md bg-[#285C45] px-4 text-sm font-semibold text-white hover:bg-[#214D3A]'
        >
          <Printer className='size-4' aria-hidden />
          Imprimir
        </button>
      </div>

      <article className='mx-auto max-w-[8.5in] bg-white px-10 py-9 shadow-sm print:max-w-none print:p-0 print:shadow-none'>
        {/* Encabezado */}
        <header className='flex items-start justify-between gap-6 border-b-2 border-[#285C45] pb-4'>
          <div className='flex items-center gap-3'>
            <img src={logoImage} alt='' className='h-14 w-auto object-contain' />
            <div>
              <p className='text-base font-semibold'>{COMPANY}</p>
              <p className='text-xs text-[#58695E]'>Inventario de combustibles, lubricantes, insumos y repuestos</p>
            </div>
          </div>
          <div className='text-right'>
            <p className='text-xs font-semibold uppercase tracking-wider text-[#285C45]'>{titleOf(m)}</p>
            <p className='font-mono text-2xl font-semibold tracking-wide'>{m.documentNumber}</p>
            {m.reference && <p className='font-mono text-xs text-[#58695E]'>Ref. {m.reference}</p>}
          </div>
        </header>

        {/* Datos */}
        <dl className='mt-4 grid grid-cols-3 gap-x-6 gap-y-3'>
          <Info label='Fecha'>{dateTime(m.movementDate)}</Info>
          <Info label={m.fromWarehouse && m.toWarehouse ? 'Origen → destino' : 'Almacén'}>{warehouse}</Info>
          <Info label='Motivo'>
            {MOVEMENT_TYPE_LABELS[m.movementType]} · {REASON_LABELS[m.reason] ?? m.reason}
          </Info>
          {m.receivedBy && <Info label={m.movementType === 'OUT' ? 'Retirado por' : m.movementType === 'TRANSFER' ? 'Trasladado por' : 'Entregado por'}>{m.receivedBy}</Info>}
          {m.workOrder && (
            <Info label='Orden de trabajo' mono>
              {m.workOrder}
            </Info>
          )}
          <Info label='Registrado por'>{m.createdBy.fullName}</Info>
          {m.note && (
            <div className='col-span-3'>
              <Info label='Observación'>{m.note}</Info>
            </div>
          )}
        </dl>

        {/* Líneas */}
        <table className='mt-5 w-full border-collapse text-[12px]'>
          <thead>
            <tr className='bg-[#DDEAD9] text-left text-[10px] uppercase tracking-wider'>
              <th className='w-8 border border-[#A8B8AC] px-2 py-1.5 font-semibold'>#</th>
              <th className='border border-[#A8B8AC] px-2 py-1.5 font-semibold'>Código</th>
              <th className='border border-[#A8B8AC] px-2 py-1.5 font-semibold'>Producto</th>
              <th className='border border-[#A8B8AC] px-2 py-1.5 text-right font-semibold'>Cantidad</th>
              <th className='w-12 border border-[#A8B8AC] px-2 py-1.5 font-semibold'>Und.</th>
              {hasAssets && <th className='border border-[#A8B8AC] px-2 py-1.5 font-semibold'>Activo destino</th>}
              {hasNotes && <th className='border border-[#A8B8AC] px-2 py-1.5 font-semibold'>Observación</th>}
            </tr>
          </thead>
          <tbody>
            {m.lines.map((line, i) => (
              <tr key={line.id} className='break-inside-avoid align-top'>
                <td className='border border-[#A8B8AC] px-2 py-1.5 text-[#58695E]'>{i + 1}</td>
                <td className='border border-[#A8B8AC] px-2 py-1.5 font-mono'>{line.product.code}</td>
                <td className='border border-[#A8B8AC] px-2 py-1.5'>{line.product.name}</td>
                <td className='border border-[#A8B8AC] px-2 py-1.5 text-right font-semibold tabular-nums'>{qty(line.quantity)}</td>
                <td className='border border-[#A8B8AC] px-2 py-1.5'>{line.product.unitCode}</td>
                {hasAssets && (
                  <td className='border border-[#A8B8AC] px-2 py-1.5'>
                    {line.asset ? (
                      <>
                        <span className='font-mono font-semibold'>{line.asset.code}</span> {line.asset.name}
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                )}
                {hasNotes && <td className='border border-[#A8B8AC] px-2 py-1.5'>{line.note ?? ''}</td>}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total por producto, solo si algún producto está repartido en varias líneas. */}
        {showTotals && (
          <div className='mt-3 flex justify-end'>
            <table className='text-[12px]'>
              <tbody>
                {m.totals.map((t) => (
                  <tr key={t.product.id}>
                    <td className='pr-4 text-[#58695E]'>
                      Total {t.product.code} ({t.lines} {t.lines === 1 ? 'línea' : 'líneas'})
                    </td>
                    <td className='text-right font-semibold tabular-nums'>
                      {qty(t.quantity)} {t.product.unitCode}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Firmas */}
        <section className='mt-16 grid break-inside-avoid gap-8' style={{ gridTemplateColumns: `repeat(${signaturesOf(m).length}, minmax(0, 1fr))` }} aria-label='Firmas'>
          {signaturesOf(m).map((s) => (
            <div key={s.role} className='text-center text-[12px]'>
              <div className='h-12' />
              <div className='border-t border-[#17261F] pt-1.5'>
                <p className='font-semibold'>{s.name || ' '}</p>
                <p className='text-[11px] text-[#58695E]'>{s.role}</p>
                <p className='mt-2 text-[10px] text-[#58695E]'>C.I.: ____________________</p>
              </div>
            </div>
          ))}
        </section>

        <footer className='mt-10 flex justify-between border-t border-[#D5DED2] pt-2 text-[10px] text-[#58695E]'>
          <span>
            Impreso el {new Date().toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' })}
            {printedBy && <> por {printedBy}</>}
          </span>
          <span>Inventario Aztlan · documento sin enmiendas: un error se corrige con otro movimiento</span>
        </footer>
      </article>
    </div>
  )
}
