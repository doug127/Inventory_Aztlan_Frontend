export const HIERARCHY = {
  1: 3, // superadmin
  2: 2, // admin
  3: 1, 
}

export const MOVEMENT_TYPES = {
  IN: 'IN', OUT: 'OUT', TRANSFER: 'TRANSFER', ADJUST: 'ADJUST',
}

export const MOVEMENT_REASONS = {
  CONSUMO: 'CONSUMO', PRESTAMO: 'PRESTAMO', DESECHO: 'DESECHO',
  COMPRA: 'COMPRA', VENTA: 'VENTA', TRASLADO: 'TRASLADO',
  AJUSTE: 'AJUSTE', OTRO: 'OTRO',
}

export const ASSET_TYPES = ['VEHICULO', 'PERSONAL', 'CAMPO', 'COSECHA', 'TALLER', 'EXTERNO', 'OTRO']

export const REASONS_BY_TYPE = {
  IN:       ['COMPRA', 'OTRO'],
  OUT:      ['CONSUMO', 'PRESTAMO', 'DESECHO', 'VENTA', 'OTRO'],
  TRANSFER: ['TRASLADO'],
  ADJUST:   ['AJUSTE'],
}