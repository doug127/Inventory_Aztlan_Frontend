import { CategoryTreePage } from '@/components/category-tree/CategoryTreePage'
import { CategoryTreeFormPanel } from '@/components/category-tree/CategoryTreeFormPanel'
import {
  useActivateCategory,
  useCategoryTree,
  useCreateCategory,
  useDeactivateCategory,
  useMoveCategory,
  useUpdateCategory,
} from './productCategoriesApi'

// Reglas de business_rules.md §6.2 y naming_conventions.md §6.1: el código (4 letras) es el prefijo
// de los productos, así que no cambia si la categoría ya tiene productos.
const FORM = {
  useCreate: useCreateCategory,
  useUpdate: useUpdateCategory,
  namePlaceholder: 'Fertilizantes',
  code: {
    pattern: /^[A-Z]{4}$/,
    message: 'Exactamente 4 letras (ej. LUBR, FERT)',
    maxLength: 4,
    placeholder: 'FERT',
    sanitize: (value) => value.toUpperCase().replace(/[^A-Z]/g, ''),
    hint: (code) => `Es el prefijo de los códigos de producto: ${code || 'FERT'} → ${code || 'FERT'}-0001.`,
    className: '[&_input]:font-mono [&_input]:uppercase [&_input]:tracking-[0.15em]',
  },
  description: { placeholder: 'Qué productos agrupa' },
  codeLock: ({ code, usage }) =>
    usage.totalProducts > 0
      ? `Tiene ${usage.totalProducts} ${usage.totalProducts === 1 ? 'producto' : 'productos'} (${code}-0001…): el código ya no se puede cambiar. El nombre, la descripción, el icono y la categoría padre sí.`
      : null,
}

function ProductCategoryFormPanel(props) {
  return <CategoryTreeFormPanel form={FORM} {...props} />
}

const CONFIG = {
  title: 'Categorías de productos',
  treeLabel: 'Árbol de categorías de productos',
  dragHint: 'Arrastra una categoría sobre otra para moverla con todas sus subcategorías y productos.',
  deactivateDescription:
    'No podrá asignarse a productos nuevos ni recibir subcategorías. Los productos que ya tiene y su historial no cambian.',
  items: {
    one: 'producto',
    many: 'productos',
    activeOne: 'producto activo',
    activeMany: 'productos activos',
    none: 'Sin productos',
    own: (n) => n.usage.totalProducts,
    inSubtree: (n) => n.productsInSubtree,
    active: (n) => n.usage.activeProducts,
  },
  hooks: { useTree: useCategoryTree, useMove: useMoveCategory, useDeactivate: useDeactivateCategory, useActivate: useActivateCategory },
  FormPanel: ProductCategoryFormPanel,
}

/** Categorías de productos en árbol (HU-203, user_flow.md §11), con icono en las raíces (HU-301). */
export function ProductCategoriesPage() {
  return <CategoryTreePage config={CONFIG} />
}
