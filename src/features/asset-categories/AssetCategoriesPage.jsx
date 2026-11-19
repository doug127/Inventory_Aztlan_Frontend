import { CategoryTreePage } from '@/components/category-tree/CategoryTreePage'
import { CategoryTreeFormPanel } from '@/components/category-tree/CategoryTreeFormPanel'
import { plural } from '@/components/category-tree/treeUtils'
import {
  useActivateAssetCategory,
  useAssetCategoryTree,
  useCreateAssetCategory,
  useDeactivateAssetCategory,
  useMoveAssetCategory,
  useUpdateAssetCategory,
} from './assetCategoriesApi'

// business_rules.md §6.2 regla 4: los activos solo van en categorías hoja y una categoría con
// activos no admite subcategorías (el backend responde CATEGORY_HAS_ASSETS).
const childBlocker = (node) => (node.usage.totalAssets > 0 ? `Tiene ${plural(node.usage.totalAssets, 'activo', 'activos')}` : null)

const toCode = (value) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[\s-]+/g, '_')
    .replace(/[^A-Z0-9_]/g, '')

const FORM = {
  useCreate: useCreateAssetCategory,
  useUpdate: useUpdateAssetCategory,
  namePlaceholder: 'Línea amarilla',
  code: {
    // naming_conventions.md §7.1: MAYÚSCULAS con guion bajo (LINEA_AMARILLA, LOTE_3).
    pattern: /^[A-Z][A-Z0-9_]{1,19}$/,
    message: 'Mayúsculas, números o guion bajo; empieza con letra (ej. LOTE_3)',
    maxLength: 20,
    placeholder: 'LINEA_AMARILLA',
    sanitize: toCode,
    hint: () => 'Los activos se registran solo en las categorías sin subcategorías (la más específica: TRACTOR, no VEHICULOS).',
    className: '[&_input]:font-mono [&_input]:uppercase [&_input]:tracking-[0.08em]',
  },
  childBlocker,
}

function AssetCategoryFormPanel(props) {
  return <CategoryTreeFormPanel form={FORM} {...props} />
}

/** Las hojas son las que reciben activos: se marcan para que se vea dónde se registra cada uno. */
const leafBadge = (node) =>
  node.isLeaf && node.isActive ? (
    <span
      title='Aquí se registran los activos'
      className='hidden shrink-0 rounded-full bg-sand-50 px-2 py-0.5 text-[11px] font-medium text-ink-500 ring-1 ring-line sm:inline'
    >
      Recibe activos
    </span>
  ) : null

const CONFIG = {
  title: 'Categorías de activos',
  treeLabel: 'Árbol de categorías de activos',
  dragHint:
    'Arrastra una categoría sobre otra para moverla con sus subcategorías y activos. Las categorías que ya tienen activos no reciben subcategorías.',
  deactivateDescription: 'No podrá recibir activos nuevos ni subcategorías. Los activos que ya tiene y su historial de consumos no cambian.',
  items: {
    one: 'activo',
    many: 'activos',
    activeOne: 'activo activo',
    activeMany: 'activos activos',
    none: 'Sin activos',
    own: (n) => n.usage.totalAssets,
    inSubtree: (n) => n.assetsInSubtree,
    active: (n) => n.usage.activeAssets,
  },
  childBlocker,
  badge: leafBadge,
  hooks: {
    useTree: useAssetCategoryTree,
    useMove: useMoveAssetCategory,
    useDeactivate: useDeactivateAssetCategory,
    useActivate: useActivateAssetCategory,
  },
  FormPanel: AssetCategoryFormPanel,
}

/**
 * Categorías de activos en árbol (HU-301, business_rules.md §6.6): VEHICULOS › MAQUINARIA_AGRICOLA ›
 * TRACTOR, PERSONAL, CAMPO › LOTE_1… Cada raíz tiene su icono y sus subcategorías lo heredan.
 */
export function AssetCategoriesPage() {
  return <CategoryTreePage config={CONFIG} />
}
