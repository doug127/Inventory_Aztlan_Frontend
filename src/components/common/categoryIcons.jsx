import {
  Axe, BatteryCharging, Beef, Bike, Bird, Boxes, Briefcase, Building2, Bus, Cable, CarFront, Carrot, Citrus, CloudRain,
  Cog, Construction, Container, Cylinder, Drill, Droplet, Droplets, Factory, Fence, FireExtinguisher, Fish, FlaskConical,
  Flower2, FolderTree, Forklift, Fuel, Gauge, Grape, Hammer, Handshake, HardHat, House, LandPlot, Landmark, Layers, Leaf,
  Lightbulb, MapPin, Mountain, Package, PaintBucket, PawPrint, Pickaxe, Pill, Plug, Recycle, Scissors, Shapes, ShieldCheck,
  Ship, Shirt, Shovel, SprayCan, Sprout, Store, Sun, Tag, Tent, Thermometer, Tractor, Trees, Truck, User, Users, Warehouse,
  Waves, Wheat, Wrench, Zap, Bug,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Catálogo de iconos para las categorías raíz (HU-301). Las claves son los nombres de lucide y deben
// coincidir con backend/src/shared/constants/icons.js: el backend rechaza cualquier otra.
// `words` ayuda a buscar en español ("aceite" encuentra la gota).
export const ICON_GROUPS = [
  {
    label: 'Vehículos y maquinaria',
    icons: [
      ['tractor', Tractor, 'Tractor', 'maquinaria agrícola'],
      ['truck', Truck, 'Camión', 'transporte volteo carga'],
      ['car-front', CarFront, 'Camioneta', 'vehículo carro auto'],
      ['bus', Bus, 'Autobús', 'transporte personal'],
      ['forklift', Forklift, 'Montacargas', 'cargador'],
      ['construction', Construction, 'Línea amarilla', 'retroexcavadora obra maquinaria pesada'],
      ['bike', Bike, 'Bicicleta', 'moto'],
      ['ship', Ship, 'Embarcación', 'bote'],
    ],
  },
  {
    label: 'Personas',
    icons: [
      ['users', Users, 'Personal', 'grupo trabajadores cuadrilla'],
      ['user', User, 'Persona', 'trabajador'],
      ['hard-hat', HardHat, 'Casco', 'seguridad protección epp'],
      ['handshake', Handshake, 'Externo', 'contratista proveedor'],
      ['briefcase', Briefcase, 'Administración', 'oficina'],
    ],
  },
  {
    label: 'Campo y cultivos',
    icons: [
      ['wheat', Wheat, 'Cultivo', 'campo cosecha cereal'],
      ['sprout', Sprout, 'Brote', 'siembra insumos agrícolas'],
      ['leaf', Leaf, 'Hoja', 'foliar planta'],
      ['trees', Trees, 'Árboles', 'bosque frutales'],
      ['land-plot', LandPlot, 'Lote', 'parcela tablón terreno'],
      ['fence', Fence, 'Cerca', 'potrero corral'],
      ['map-pin', MapPin, 'Ubicación', 'sitio'],
      ['mountain', Mountain, 'Montaña', 'terreno'],
      ['sun', Sun, 'Sol', 'clima'],
      ['cloud-rain', CloudRain, 'Lluvia', 'riego clima'],
      ['grape', Grape, 'Uva', 'fruta'],
      ['citrus', Citrus, 'Cítrico', 'naranja limón fruta'],
      ['carrot', Carrot, 'Hortaliza', 'zanahoria vegetal'],
      ['flower-2', Flower2, 'Flor', 'ornamental'],
      ['paw-print', PawPrint, 'Animales', 'ganado mascota'],
      ['beef', Beef, 'Ganado', 'bovino vaca res'],
      ['bird', Bird, 'Aves', 'avícola pollo gallina'],
      ['fish', Fish, 'Peces', 'piscicultura'],
    ],
  },
  {
    label: 'Taller e instalaciones',
    icons: [
      ['wrench', Wrench, 'Llave', 'taller herramienta mecánica'],
      ['hammer', Hammer, 'Martillo', 'herramienta'],
      ['drill', Drill, 'Taladro', 'herramienta eléctrica'],
      ['cog', Cog, 'Engranaje', 'repuesto pieza mecánica'],
      ['shovel', Shovel, 'Pala', 'herramienta'],
      ['pickaxe', Pickaxe, 'Pico', 'herramienta'],
      ['axe', Axe, 'Hacha', 'herramienta'],
      ['scissors', Scissors, 'Tijera', 'poda'],
      ['warehouse', Warehouse, 'Galpón', 'almacén taller depósito'],
      ['factory', Factory, 'Planta', 'fábrica procesadora'],
      ['building-2', Building2, 'Edificio', 'oficina sede'],
      ['house', House, 'Casa', 'vivienda'],
      ['store', Store, 'Tienda', 'comercio venta'],
      ['tent', Tent, 'Campamento', 'carpa'],
      ['landmark', Landmark, 'Institución', 'banco gobierno'],
    ],
  },
  {
    label: 'Insumos y materiales',
    icons: [
      ['fuel', Fuel, 'Combustible', 'diésel gasoil gasolina'],
      ['droplet', Droplet, 'Gota', 'aceite lubricante líquido'],
      ['droplets', Droplets, 'Agua', 'riego líquidos'],
      ['flask-conical', FlaskConical, 'Químico', 'laboratorio agroquímico'],
      ['spray-can', SprayCan, 'Aerosol', 'fumigación pintura'],
      ['bug', Bug, 'Plaga', 'insecticida'],
      ['package', Package, 'Paquete', 'caja producto'],
      ['boxes', Boxes, 'Cajas', 'inventario mercancía'],
      ['container', Container, 'Contenedor', 'depósito'],
      ['cylinder', Cylinder, 'Tambor', 'tanque cilindro'],
      ['paint-bucket', PaintBucket, 'Pintura', 'balde'],
      ['recycle', Recycle, 'Reciclaje', 'desecho'],
      ['shirt', Shirt, 'Uniforme', 'ropa'],
      ['shield-check', ShieldCheck, 'Protección', 'seguridad epp'],
      ['fire-extinguisher', FireExtinguisher, 'Extintor', 'seguridad incendio'],
      ['pill', Pill, 'Medicamento', 'veterinario salud'],
    ],
  },
  {
    label: 'Energía y medición',
    icons: [
      ['zap', Zap, 'Electricidad', 'energía'],
      ['plug', Plug, 'Enchufe', 'eléctrico'],
      ['cable', Cable, 'Cable', 'eléctrico'],
      ['battery-charging', BatteryCharging, 'Batería', 'acumulador'],
      ['lightbulb', Lightbulb, 'Iluminación', 'bombillo'],
      ['gauge', Gauge, 'Medidor', 'manómetro'],
      ['thermometer', Thermometer, 'Temperatura', 'termómetro'],
      ['waves', Waves, 'Agua', 'río laguna'],
    ],
  },
  {
    label: 'Genéricos',
    icons: [
      ['tag', Tag, 'Etiqueta', 'general'],
      ['layers', Layers, 'Capas', 'general'],
      ['shapes', Shapes, 'Formas', 'otros varios'],
    ],
  },
].map((group) => ({ ...group, icons: group.icons.map(([key, Icon, label, words]) => ({ key, Icon, label, words })) }))

const BY_KEY = new Map(ICON_GROUPS.flatMap((g) => g.icons).map((icon) => [icon.key, icon]))

export const getCategoryIcon = (key) => BY_KEY.get(key) ?? null

/**
 * Icono de una categoría. Si no tiene (o la clave no está en el catálogo), se usa `fallback`.
 * Uso: <CategoryIcon name={node.displayIcon} className='size-4' />
 */
export function CategoryIcon({ name, fallback: Fallback = FolderTree, className, ...props }) {
  const Icon = BY_KEY.get(name)?.Icon ?? Fallback
  return <Icon className={cn('shrink-0', className)} aria-hidden {...props} />
}
