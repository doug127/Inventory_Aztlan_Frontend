import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Loader2, Paperclip, Plus, RotateCcw, Trash2, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EASE_OUT } from '@/features/auth/components/AuthUI'
import { Card, inputClass, isoDay, labelClass } from './movementForm'
import {
  MAX_RECEIPT_DOCUMENTS,
  RECEIPT_DOCUMENT_LABELS,
  RECEIPT_DOCUMENT_TYPES,
  RECEIPT_FILE_MAX_BYTES,
  RECEIPT_FILE_TYPES,
  movementsService,
  useUploadDocumentFile,
} from './movementsApi'

// Documentos de recepción de una entrada (factura, vale, recibo de compra…): sus datos viajan con la
// entrada y el archivo escaneado se sube después, documento por documento. Las validaciones de aquí
// son una ayuda: el backend las repite todas.

const CURRENCIES = ['USD', 'VES', 'EUR', 'COP']
const NUMBER_TYPING = /^[A-Z0-9][A-Z0-9-]{0,39}$/
const AMOUNT_TYPING = /^\d{0,12}([.,]\d{0,2})?$/
const TAX_ID_TYPING = /^[A-Z0-9][A-Z0-9.-]{0,19}$/
const ACCEPT = RECEIPT_FILE_TYPES.join(',')

const upperTyped = (pattern) => (previous, next) => {
  const value = next.toUpperCase().replace(/\s+/g, '')
  return value === '' || pattern.test(value) ? value : previous
}
const typedNumber = upperTyped(NUMBER_TYPING)
const typedTaxId = upperTyped(TAX_ID_TYPING)
const typedAmount = (previous, next) => (AMOUNT_TYPING.test(next) ? next : previous)

const prefixOf = (type) => RECEIPT_DOCUMENT_TYPES.find((t) => t.id === type)?.prefix ?? type
/** FAC-0012345: como lo muestra el backend (label) y como forma la referencia de la entrada. */
export const documentLabel = (doc) => `${prefixOf(doc.documentType)}-${doc.documentNumber.replace(/-+$/, '')}`

export const formatBytes = (bytes) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`

const amountFormat = new Intl.NumberFormat('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export const formatAmount = (amount, currency) => (amount === null || amount === undefined ? null : `${amountFormat.format(Number(amount))}${currency ? ` ${currency}` : ''}`)

/** Motivo por el que el navegador no debe enviar el archivo, o null si está bien. */
export const fileProblem = (file) => {
  if (!file) return null
  if (!RECEIPT_FILE_TYPES.includes(file.type)) return 'Debe ser un PDF o una foto JPG, PNG o WEBP'
  if (file.size === 0) return 'El archivo está vacío'
  if (file.size > RECEIPT_FILE_MAX_BYTES) return `Pesa ${formatBytes(file.size)}: el máximo es 10 MB`
  return null
}

let docSeq = 0
/** Un documento nuevo hereda el proveedor del anterior (la factura y la guía suelen ser del mismo). */
export const emptyDocument = (previous) => ({
  key: ++docSeq,
  documentType: previous ? 'GUIA_DESPACHO' : 'FACTURA',
  documentNumber: '',
  supplierName: previous?.supplierName ?? '',
  supplierTaxId: previous?.supplierTaxId ?? '',
  issueDate: '',
  totalAmount: '',
  currency: 'USD',
  file: null,
})

/** Errores por documento, con claves `${key}.${campo}`. */
export const validateDocuments = (documents) => {
  const errors = {}
  const seen = new Map()
  const today = isoDay(new Date())
  documents.forEach((doc, i) => {
    const number = doc.documentNumber.replace(/-+$/, '')
    if (!number) errors[`${doc.key}.documentNumber`] = 'Indica el número'
    else {
      const id = `${doc.documentType}|${number}`
      if (seen.has(id)) errors[`${doc.key}.documentNumber`] = `Es el mismo documento ${seen.get(id) + 1}`
      else seen.set(id, i)
    }
    if (doc.issueDate && doc.issueDate > today) errors[`${doc.key}.issueDate`] = 'No puede ser futura'
    if (doc.totalAmount && !/^\d{1,12}([.,]\d{1,2})?$/.test(doc.totalAmount)) errors[`${doc.key}.totalAmount`] = 'Hasta 2 decimales'
    const problem = fileProblem(doc.file)
    if (problem) errors[`${doc.key}.file`] = problem
  })
  return errors
}

/** Lo que se envía en `documents` al registrar la entrada (el archivo se sube después). */
export const documentsBody = (documents) =>
  documents.map((doc) => ({
    documentType: doc.documentType,
    documentNumber: doc.documentNumber.replace(/-+$/, ''),
    supplierName: doc.supplierName.trim() || null,
    supplierTaxId: doc.supplierTaxId.replace(/[-.]+$/, '') || null,
    issueDate: doc.issueDate || null,
    totalAmount: doc.totalAmount ? doc.totalAmount.replace(',', '.').replace(/\.$/, '') : null,
    currency: doc.totalAmount ? doc.currency : null,
  }))

function FilePicker({ file, onChange, invalid, id }) {
  const input = useRef(null)
  return (
    // relative: el input sr-only (absolute) queda dentro del bloque y no alarga la página (doble scroll).
    <div className='relative flex min-w-0 items-center gap-2'>
      <input ref={input} id={id} type='file' accept={ACCEPT} className='sr-only' onChange={(e) => onChange(e.target.files?.[0] ?? null)} />
      {file ? (
        <>
          <span
            className={cn('flex h-10 min-w-0 flex-1 items-center gap-2 rounded-md border bg-sand-50/60 px-3 text-sm', invalid ? 'border-red-500' : 'border-line')}
          >
            <Paperclip className='size-4 shrink-0 text-ink-500' aria-hidden />
            <span className='truncate'>{file.name}</span>
            <span className='shrink-0 text-xs text-ink-500'>{formatBytes(file.size)}</span>
          </span>
          <button
            type='button'
            onClick={() => {
              onChange(null)
              if (input.current) input.current.value = ''
            }}
            className='h-10 shrink-0 rounded-md px-2 text-xs text-ink-500 hover:bg-red-50 hover:text-red-700'
          >
            Quitar
          </button>
        </>
      ) : (
        <button
          type='button'
          onClick={() => input.current?.click()}
          className='inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-dashed border-line bg-white px-3 text-sm text-ink-900 hover:border-forest-700 hover:text-forest-800'
        >
          <Upload className='size-4' aria-hidden />
          Adjuntar PDF o foto
        </button>
      )}
    </div>
  )
}

/** Paso 1 de la entrada: los documentos que respaldan la recepción. */
export function DocumentsEditor({ documents, setDocuments, errors, reason }) {
  const update = (key, patch) => setDocuments((ds) => ds.map((d) => (d.key === key ? { ...d, ...patch } : d)))
  const remove = (key) => setDocuments((ds) => ds.filter((d) => d.key !== key))
  const add = () => setDocuments((ds) => [...ds, emptyDocument(ds.at(-1))])
  return (
    <Card className='space-y-4'>
      <div>
        <h2 className='text-sm font-semibold'>Documentos de recepción</h2>
        <p className='mt-0.5 text-xs text-ink-500'>
          {reason === 'COMPRA'
            ? 'Factura, vale, recibo de compra, nota de entrega o guía que llegó con la mercancía. Recomendado; puedes adjuntar el escaneo o una foto.'
            : 'Opcional: el documento que respalda el ingreso.'}
        </p>
      </div>

      {documents.length > 0 && (
        <ol className='space-y-3'>
          {documents.map((doc, index) => {
            const e = (field) => errors[`${doc.key}.${field}`]
            const id = (field) => `doc-${doc.key}-${field}`
            return (
              <motion.li
                key={doc.key}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: EASE_OUT }}
                className='rounded-lg border border-line/80 p-3 sm:p-4'
              >
                <div className='mb-3 flex items-center justify-between'>
                  <span className='text-xs font-semibold uppercase tracking-wide text-ink-500'>Documento {index + 1}</span>
                  <button
                    type='button'
                    onClick={() => remove(doc.key)}
                    aria-label={`Quitar el documento ${index + 1}`}
                    className='inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs text-ink-500 hover:bg-red-50 hover:text-red-700'
                  >
                    <Trash2 className='size-3.5' aria-hidden />
                    <span className='hidden sm:inline'>Quitar</span>
                  </button>
                </div>
                <div className='grid gap-3 sm:grid-cols-2'>
                  <div>
                    <label htmlFor={id('number')} className={labelClass}>
                      Tipo y número<span className='text-red-600'> *</span>
                    </label>
                    <div className='flex gap-2'>
                      <select
                        value={doc.documentType}
                        onChange={(ev) => update(doc.key, { documentType: ev.target.value })}
                        aria-label={`Tipo del documento ${index + 1}`}
                        className='h-11 w-36 shrink-0 rounded-md border border-line bg-white px-2 text-sm outline-none focus:border-forest-700'
                      >
                        {RECEIPT_DOCUMENT_TYPES.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                      <input
                        id={id('number')}
                        value={doc.documentNumber}
                        onChange={(ev) => update(doc.key, { documentNumber: typedNumber(doc.documentNumber, ev.target.value) })}
                        placeholder='0012345'
                        maxLength={40}
                        autoComplete='off'
                        aria-invalid={Boolean(e('documentNumber'))}
                        className={cn(inputClass, 'min-w-0 font-mono uppercase')}
                      />
                    </div>
                    {e('documentNumber') ? (
                      <p className='mt-1 text-xs text-red-600'>{e('documentNumber')}</p>
                    ) : (
                      doc.documentNumber && <p className='mt-1 font-mono text-xs text-ink-500'>{documentLabel(doc)}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor={id('date')} className={labelClass}>
                      Fecha de emisión
                    </label>
                    <input
                      id={id('date')}
                      type='date'
                      value={doc.issueDate}
                      max={isoDay(new Date())}
                      onChange={(ev) => update(doc.key, { issueDate: ev.target.value })}
                      aria-invalid={Boolean(e('issueDate'))}
                      className={inputClass}
                    />
                    {e('issueDate') && <p className='mt-1 text-xs text-red-600'>{e('issueDate')}</p>}
                  </div>
                  <div>
                    <label htmlFor={id('supplier')} className={labelClass}>
                      Proveedor
                    </label>
                    <input
                      id={id('supplier')}
                      value={doc.supplierName}
                      onChange={(ev) => update(doc.key, { supplierName: ev.target.value })}
                      maxLength={150}
                      placeholder='Razón social'
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor={id('tax')} className={labelClass}>
                      RIF o NIT
                    </label>
                    <input
                      id={id('tax')}
                      value={doc.supplierTaxId}
                      onChange={(ev) => update(doc.key, { supplierTaxId: typedTaxId(doc.supplierTaxId, ev.target.value) })}
                      maxLength={20}
                      placeholder='J-12345678-9'
                      autoComplete='off'
                      className={cn(inputClass, 'font-mono uppercase')}
                    />
                  </div>
                  <div>
                    <label htmlFor={id('amount')} className={labelClass}>
                      Monto total
                    </label>
                    <div className='flex gap-2'>
                      <input
                        id={id('amount')}
                        inputMode='decimal'
                        value={doc.totalAmount}
                        onChange={(ev) => update(doc.key, { totalAmount: typedAmount(doc.totalAmount, ev.target.value.trim()) })}
                        placeholder='0,00'
                        aria-invalid={Boolean(e('totalAmount'))}
                        className={cn(inputClass, 'min-w-0 text-right tabular-nums')}
                      />
                      <select
                        value={doc.currency}
                        onChange={(ev) => update(doc.key, { currency: ev.target.value })}
                        aria-label={`Moneda del documento ${index + 1}`}
                        className='h-11 w-24 shrink-0 rounded-md border border-line bg-white px-2 text-sm outline-none focus:border-forest-700'
                      >
                        {CURRENCIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    {e('totalAmount') && <p className='mt-1 text-xs text-red-600'>{e('totalAmount')}</p>}
                  </div>
                  <div>
                    <label htmlFor={id('file')} className={labelClass}>
                      Escaneo o foto
                    </label>
                    <FilePicker id={id('file')} file={doc.file} onChange={(file) => update(doc.key, { file })} invalid={Boolean(e('file'))} />
                    {e('file') ? (
                      <p className='mt-1 text-xs text-red-600'>{e('file')}</p>
                    ) : (
                      <p className='mt-1 text-xs text-ink-500'>PDF, JPG, PNG o WEBP, hasta 10 MB</p>
                    )}
                  </div>
                </div>
              </motion.li>
            )
          })}
        </ol>
      )}

      {documents.length < MAX_RECEIPT_DOCUMENTS && (
        <button
          type='button'
          onClick={add}
          className='inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-line bg-white text-sm font-medium text-ink-900 hover:border-forest-700 hover:text-forest-800'
        >
          <Plus className='size-4' aria-hidden />
          {documents.length ? 'Agregar otro documento' : 'Agregar factura, vale o recibo'}
        </button>
      )}
    </Card>
  )
}

/** Abre el archivo en otra pestaña (se descarga con el token y se muestra como blob). */
export function OpenFileButton({ movementId, document }) {
  const [state, setState] = useState('idle')
  const open = async () => {
    // La pestaña se abre antes del await: los navegadores bloquean window.open fuera del clic.
    const tab = window.open('', '_blank')
    setState('loading')
    try {
      const blob = await movementsService.getDocumentFile({ movementId, documentId: document.id })
      const url = URL.createObjectURL(blob)
      if (tab) tab.location.href = url
      else window.location.assign(url)
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
      setState('idle')
    } catch {
      tab?.close()
      setState('error')
    }
  }
  return (
    <button
      type='button'
      onClick={open}
      disabled={state === 'loading'}
      title={`${document.file.name} · ${formatBytes(document.file.sizeBytes)}`}
      className='inline-flex h-8 items-center gap-1.5 rounded-md border border-line bg-white px-2.5 text-xs font-medium hover:border-ink-500/40 disabled:opacity-60'
    >
      {state === 'loading' ? <Loader2 className='size-3.5 animate-spin' aria-hidden /> : <FileText className='size-3.5' aria-hidden />}
      {state === 'error' ? 'No se pudo abrir' : 'Ver archivo'}
    </button>
  )
}

/** Adjunta el archivo a un documento ya registrado (detalle de la entrada o reintento). */
export function AttachFileButton({ movementId, document, file: initialFile, onUploaded, label = 'Adjuntar archivo' }) {
  const input = useRef(null)
  const upload = useUploadDocumentFile()
  const [error, setError] = useState(null)
  const send = (file) => {
    const problem = fileProblem(file)
    if (problem) return setError(problem)
    setError(null)
    upload.mutate(
      { movementId, documentId: document.id, file },
      { onSuccess: (doc) => onUploaded?.(doc), onError: (err) => setError(err.message ?? 'No se pudo subir') }
    )
  }
  return (
    <span className='relative inline-flex flex-col items-end gap-1'>
      <input ref={input} type='file' accept={ACCEPT} className='sr-only' onChange={(e) => e.target.files?.[0] && send(e.target.files[0])} />
      <button
        type='button'
        onClick={() => (initialFile ? send(initialFile) : input.current?.click())}
        disabled={upload.isPending}
        className='inline-flex h-8 items-center gap-1.5 rounded-md border border-dashed border-line bg-white px-2.5 text-xs font-medium hover:border-forest-700 hover:text-forest-800 disabled:opacity-60'
      >
        {upload.isPending ? (
          <Loader2 className='size-3.5 animate-spin' aria-hidden />
        ) : initialFile ? (
          <RotateCcw className='size-3.5' aria-hidden />
        ) : (
          <Upload className='size-3.5' aria-hidden />
        )}
        {upload.isPending ? 'Subiendo…' : label}
      </button>
      {error && <span className='max-w-56 text-right text-xs text-red-600'>{error}</span>}
    </span>
  )
}

/** Lista de documentos de un movimiento ya registrado. */
export function DocumentsList({ movementId, documents, canAttach, renderStatus }) {
  return (
    <ul className='divide-y divide-line/60'>
      {documents.map((doc) => (
        <li key={doc.id} className='flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6'>
          <div className='min-w-0'>
            <p className='text-sm'>
              <span className='font-medium'>{RECEIPT_DOCUMENT_LABELS[doc.documentType] ?? doc.documentType}</span>{' '}
              <span className='font-mono text-ink-900'>{doc.label}</span>
            </p>
            <p className='truncate text-xs text-ink-500'>
              {[
                doc.supplierName,
                doc.supplierTaxId,
                doc.issueDate && new Date(`${doc.issueDate}T12:00:00`).toLocaleDateString('es', { dateStyle: 'medium' }),
                formatAmount(doc.totalAmount, doc.currency),
              ]
                .filter(Boolean)
                .join(' · ') || 'Sin más datos'}
            </p>
          </div>
          <div className='shrink-0'>
            {renderStatus?.(doc) ??
              (doc.file ? (
                <OpenFileButton movementId={movementId} document={doc} />
              ) : canAttach ? (
                <AttachFileButton movementId={movementId} document={doc} />
              ) : (
                <span className='text-xs text-ink-500'>Sin archivo</span>
              ))}
          </div>
        </li>
      ))}
    </ul>
  )
}
