import { motion } from 'framer-motion'
import { FolderTree } from 'lucide-react'
import { Link } from 'react-router-dom'

/**
 * Lugar reservado para las categorías de productos en árbol (HU-203). Mientras tanto, la vista
 * anterior de categorías sigue en la página de Productos.
 */
export function ProductCategoriesPage() {
  return (
    <div className='mx-auto max-w-6xl font-plex text-ink-900'>
      <h1 className='text-[1.75rem] font-semibold tracking-tight'>Categorías de productos</h1>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className='mt-6 flex flex-col items-center rounded-xl border border-dashed border-line bg-white px-6 py-16 text-center'
      >
        <span className='grid size-12 place-items-center rounded-full bg-forest-50 text-forest-700'>
          <FolderTree className='size-6' aria-hidden />
        </span>
        <p className='mt-4 text-sm font-medium'>El árbol de categorías llega con HU-203</p>
        <p className='mt-1 max-w-sm text-sm text-ink-500'>
          Mientras tanto, las categorías se consultan en la página de Productos.
        </p>
        <Link to='/products' className='mt-4 text-sm font-semibold text-forest-700 hover:underline'>
          Ir a Productos
        </Link>
      </motion.div>
    </div>
  )
}
