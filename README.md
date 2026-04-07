# Frontend Roadmap — Sistema de Inventario

## Fase 1 · Foundation (Infraestructura Base)
> Todo lo que existe antes de la primera pantalla real.
- [x] 1.1 Setup del proyecto
      - Framework, linter, formatter, variables de entorno (.env)
      - Estructura de carpetas (feature-based, no layer-based)
      - Alias de rutas (@/components, @/features, etc.)
- [x] 1.2 Design System base
      - UI library (shadcn, Ant Design, PrimeVue, etc.)
      - Tokens: colores, tipografía, espaciado
      - Componentes globales: Button, Input, Table, Modal, Badge, Spinner
- [x] 1.3 HTTP Client
      - Instancia base (axios) con baseURL desde .env
      - Interceptor de REQUEST → inyecta token
      - Interceptor de RESPONSE → manejo global de errores (401, 403, 500)
      - Wrapper tipado para respuestas paginadas
- [x] 1.4 Estado Global (Store)
      - Setup ( Zustand )
      - Slice de auth (user, token, permisos)
- [x] 1.5 Routing
      - Definición de rutas (lazy loading desde el inicio)
      - Layout principal (sidebar, topbar, outlet)
      - Layout de auth (solo login)

## Fase 2 · Auth + Seguridad
> El sistema de permisos es infraestructura, no feature opcional.
- [x] 2.1 Login
      - Formulario, validación, manejo de errores de credenciales
      - Persistencia de token (localStorage / cookie httpOnly)
- [x] 2.2 Sesión (/auth/me)
      - Carga de usuario y permisos al iniciar la app
      - Rehidratación del store en refresh de página
- [x] 2.3 Guards de rutas
      - isAuthenticated guard
      - hasPermission(privilege) guard
      - Redirecciones: no autenticado → /login, sin permiso → /403
- [x] 2.4 UI Condicional por permisos
      - Hook/Composable usePermission(privilege)
      - Componente <CanRender privilege="..." /> 
      - Aplicado desde aquí en adelante en todos los módulos
- [x] 2.5 Logout

## Fase 3 · Maestros (Core Data)
> En orden de dependencia: Units → Categories → Products → Warehouses
- [ ] 3.1 Unidades (Units)
      - CRUD completo
      - Selector de unidad base + factor de conversión
- [ ] 3.2 Categorías de Productos
      - CRUD con soporte de jerarquía (parent_id)
      - Componente de árbol o selector en cascada
- [ ] 3.3 Productos
      - CRUD completo
      - Selector de categoría (árbol) + unidad + stock min/max
      - Badge de activo/inactivo
- [ ] 3.4 Almacenes (Warehouses)
      - CRUD completo
      - Código (4 chars) + nombre
      - Tabla con stock actual como columna derivada (de Fase 4)

## Fase 4 · Stock
> Lectura derivada de movimientos, no edición directa.
- [ ] 4.1 Vista de Stock por Almacén
      - Tabla: producto, unidad, cantidad, última actualización
      - Filtros: almacén, categoría, nombre de producto
      - Paginación server-side (desde aquí en todos los listados)
- [ ] 4.2 Alertas de Stock
      - Indicadores visuales: bajo mínimo (rojo), sobre máximo (amarillo)
      - Panel/dashboard de productos en alerta

## Fase 5 · Activos (Assets)
> Debe ir ANTES de movimientos porque los formularios OUT los necesitan.
- [ ] 5.1 Assets CRUD
      - Tabla con filtro por tipo (ENUM: VEHICULO, PERSONAL, etc.)
      - Badge de activo/inactivo
      - Código único (4 chars)

## Fase 6 · Movimientos
> El módulo más complejo. Formularios adaptados por tipo de movimiento.
- [ ] 6.1 Listado de Movimientos
      - Tabla con: tipo, razón, referencia, fecha, usuario, almacén
      - Filtros: rango de fechas, tipo, razón, almacén, usuario
      - Paginación server-side + exportación (preparar hook)
- [ ] 6.2 Detalle de Movimiento
      - Header: metadatos del movimiento
      - Líneas: tabla de productos + cantidad + nota
      - Destinos: lista de activos asociados
- [ ] 6.3 Formulario de ENTRADA (IN)
      - Razones disponibles: COMPRA, OTRO
      - warehouse_to_id requerido / warehouse_from_id oculto
      - Lista dinámica de líneas (producto + cantidad)
- [ ] 6.4 Formulario de SALIDA (OUT)
      - Razones: CONSUMO, PRÉSTAMO, DESECHO, VENTA, OTRO
      - warehouse_from_id requerido / warehouse_to_id oculto
      - Lista dinámica de líneas
      - Selector múltiple de activos (movement_targets)
      - Validación: quantity <= stock disponible
- [ ] 6.5 Formulario de TRANSFERENCIA (TRANSFER)
      - Razón: TRASLADO
      - warehouse_from_id y warehouse_to_id ambos requeridos y distintos
      - Lista dinámica de líneas
      - Validación: stock suficiente en origen
- [ ] 6.6 Formulario de AJUSTE (ADJUST)
      - Razón: AJUSTE
      - warehouse_from_id requerido
      - Lista dinámica de líneas (cantidad puede ser correctiva)

## Fase 7 · Reportes
> Corresponde al módulo 9 pendiente en tu backend.
- [ ] 7.1 Reporte de Stock actual (por almacén / por producto)
- [ ] 7.2 Historial de movimientos con filtros avanzados
- [ ] 7.3 Kardex por producto (entradas/salidas/saldo)
- [ ] 7.4 Productos bajo mínimo / sobre máximo
- [ ] 7.5 Exportación a Excel/PDF

## Fase 8 · Calidad y Entrega
> No es una fase de "arreglos", es de pulido profesional.
- [ ] 8.1 Caché de maestros (units, categories, warehouses) con invalidación
- [ ] 8.2 Optimistic updates en operaciones frecuentes
- [ ] 8.3 Skeleton loaders en todas las tablas
- [ ] 8.4 Manejo de estados vacíos (empty states)
- [ ] 8.5 Responsive / Mobile (si aplica)
- [ ] 8.6 Testing de flujos críticos (movimientos)

# Flujo de Alto Nivel

Login
  ↓
Dashboard
  ↓
┌───────────────┬───────────────┬───────────────┐
│ Productos     │ Stock         │ Movimientos   │
│               │               │               │
└───────────────┴───────────────┴───────────────┘

# Mapa de navegación

Dashboard
│
├── Productos
│   ├── Listado
│   ├── Crear / Editar
│   ├── Categorías
│   └── Unidades
│
├── Stock
│   └── Vista por almacén
│
├── Movimientos 
│   ├── Listado
│   ├── Crear movimiento
│   └── Detalle
│
├── Almacenes
│
├── Assets
│
└── Usuarios (admin)

# Crear Movimiento
Seleccionar tipo (IN / OUT / TRANSFER / ADJUST)
   ↓
Seleccionar almacén(es)
   │
   ├── IN       → solo warehouse_to
   ├── OUT      → solo warehouse_from
   ├── TRANSFER → warehouse_from + warehouse_to (distintos)
   └── ADJUST   → solo warehouse_from
   ↓
Agregar líneas de productos
   ↓
Agregar destinos / assets     ← solo aplica en OUT
   ↓
Confirmar

# Paleta de Colores
