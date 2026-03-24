# Modulos de Desarrollo
## Fase 1 Auth
- [ ] Fase 1.1 Setup
- [ ] Fase 1.2 Routing
- [ ] Fase 1.3 HTTP client + interceptors
- [ ] Fase 1.4 Auth (Login + Permisos)
## Fase 2 Core Data
- [ ] Fase 2.1: Products
- [ ] Fase 2.2: Categories
- [ ] Fase 2.3: Units
## Fase 3 Warehouses + Stock
- [ ] Fase 3.1: Warehouses CRUD
- [ ] Fase 3.2: Stock
## Fase 4 Movements
- [ ] Fase 4.1: Movements List
- [ ] Fase 4.2: Details
- [ ] Fase 4.3: Creation (Forms)
## Fase 5 Assets
- [ ] Fase 5.1: Assets CRUD 
- [ ] Fase 5.2: Integration with movements
## Fase 6 Permissions and roles
- [ ] UI condicional
- [ ] guards
## Fase 7 Optimization
- [ ] caching
- [ ] pagination
- [ ] performance

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
│   └── Categorías
│
├── Stock
│   └── Vista por almacén
│
├── Movimientos 🔥
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
Seleccionar tipo
   ↓
Seleccionar almacén(es)
   ↓
Agregar productos
   ↓
Agregar destino (assets)
   ↓
Revisar
   ↓
Confirmar

# Paleta de Colores
