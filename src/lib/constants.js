// Jerarquía de roles del backend (roles.hierarchy): menor número = mayor rango.
// Se usa con hasHierarchy(min) / <PermissionGate minHierarchy={...}>.
export const HIERARCHY = {
  SUPERADMIN: 0,
  ADMIN: 1,
  ALMACENISTA: 2,
  USUARIO: 3,
  USER: 3, // alias anterior: cualquier usuario autenticado
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

export const TABLE = {
  ROW_HEIGHT: 40,
  HEADER_HEIGHT: 44,
  MIN_ROWS: 5,
}