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
  createWithdrawal: ({ body, idempotencyKey }) => api.post('/movements/withdrawals', body, { headers: { 'Idempotency-Key': idempotencyKey } }),
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
