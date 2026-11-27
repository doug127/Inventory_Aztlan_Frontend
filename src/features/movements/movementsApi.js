import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

// Endpoints de /api/movements. HU-401: orden de retiro y detalle de un movimiento.
const unwrap = (envelope) => envelope?.data

export const movementsService = {
  /**
   * MovementDto: { id, documentNumber, movementType, reason, reference, movementDate, createdAt,
   * createdBy, fromWarehouse, toWarehouse, receivedBy, note, lines: [{ id, product, quantity, asset, note }],
   * totals: [{ product, quantity, lines }] }
   */
  get: (id) => api.get(`/movements/${id}`).then(unwrap),
  /**
   * Devuelve el sobre completo: { data: MovementDto, meta: { duplicated, warnings: { belowMinimum, consolidated } } }.
   * idempotencyKey: el mismo en cada reintento del mismo borrador (doble clic, red inestable).
   */
  /** Entrada (HU-402). Mismo sobre que la orden de retiro; meta.warnings: { aboveMaximum, consolidated }. */
  createEntry: ({ body, idempotencyKey }) => api.post('/movements/entries', body, { headers: { 'Idempotency-Key': idempotencyKey } }),
  /** Traslado (HU-403). Mismo sobre; meta.warnings: { consolidated }. */
  createTransfer: ({ body, idempotencyKey }) => api.post('/movements/transfers', body, { headers: { 'Idempotency-Key': idempotencyKey } }),
  createWithdrawal: ({ body, idempotencyKey }) => api.post('/movements/withdrawals', body, { headers: { 'Idempotency-Key': idempotencyKey } }),
  /**
   * Adjunta el archivo escaneado (PDF o foto) de un documento de recepción. El cuerpo es el archivo
   * crudo; el nombre original va en X-File-Name. Devuelve el documento con `file`.
   */
  uploadDocumentFile: ({ movementId, documentId, file }) =>
    api
      .put(`/movements/${movementId}/documents/${documentId}/file`, file, {
        headers: { 'Content-Type': file.type, 'X-File-Name': encodeURIComponent(file.name) },
      })
      .then(unwrap),
  /** El archivo como Blob (la descarga lleva el token, así que no sirve un <a href> directo). */
  getDocumentFile: ({ movementId, documentId }) => api.get(`/movements/${movementId}/documents/${documentId}/file`, { responseType: 'blob' }),
}

const KEY = ['movements']

export const useMovement = (id) =>
  useQuery({
    queryKey: [...KEY, 'detail', id],
    queryFn: () => movementsService.get(id),
    enabled: Boolean(id),
    retry: (count, error) => error?.status !== 404 && count < 2,
  })

/** Tras registrar un movimiento cambian existencias, productos y fichas de activos. */
const useMovementMutation = (mutationFn) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      qc.invalidateQueries({ queryKey: ['stock'] })
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['assets'] })
    },
  })
}

export const useCreateEntry = () => useMovementMutation(movementsService.createEntry)
export const useCreateTransfer = () => useMovementMutation(movementsService.createTransfer)

export const useCreateWithdrawal = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: movementsService.createWithdrawal,
    onSuccess: () => {
      // Cambian las existencias, los productos (stock) y la ficha de cada activo (consumos).
      qc.invalidateQueries({ queryKey: KEY })
      qc.invalidateQueries({ queryKey: ['stock'] })
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['assets'] })
    },
  })
}

export const useUploadDocumentFile = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: movementsService.uploadDocumentFile,
    onSuccess: (_doc, { movementId }) => qc.invalidateQueries({ queryKey: [...KEY, 'detail', movementId] }),
  })
}

/** Documentos de recepción de una entrada y su prefijo en la referencia (naming_conventions.md §8.2). */
export const RECEIPT_DOCUMENT_TYPES = [
  { id: 'FACTURA', prefix: 'FAC', label: 'Factura' },
  { id: 'VALE', prefix: 'VAL', label: 'Vale' },
  { id: 'RECIBO', prefix: 'REC', label: 'Recibo de compra' },
  { id: 'NOTA_ENTREGA', prefix: 'NE', label: 'Nota de entrega' },
  { id: 'GUIA_DESPACHO', prefix: 'GD', label: 'Guía de despacho' },
  { id: 'ORDEN_COMPRA', prefix: 'OC', label: 'Orden de compra' },
]
export const RECEIPT_DOCUMENT_LABELS = Object.fromEntries(RECEIPT_DOCUMENT_TYPES.map((t) => [t.id, t.label]))
export const RECEIPT_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
export const RECEIPT_FILE_MAX_BYTES = 10 * 1024 * 1024
export const MAX_RECEIPT_DOCUMENTS = 10

/** Etiquetas de los motivos (naming_conventions.md §8.3). */
export const REASON_LABELS = {
  CONSUMO: 'Consumo',
  PRESTAMO: 'Préstamo',
  DESECHO: 'Desecho',
  VENTA: 'Venta',
  OTRO: 'Otro',
  COMPRA: 'Compra',
  DEVOLUCION: 'Devolución',
  TRASLADO: 'Traslado',
  AJUSTE: 'Ajuste',
}

export const MOVEMENT_TYPE_LABELS = { IN: 'Entrada', OUT: 'Orden de retiro', TRANSFER: 'Traslado', ADJUST: 'Ajuste' }
