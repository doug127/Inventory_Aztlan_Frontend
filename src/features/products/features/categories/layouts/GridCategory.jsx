import { CategoryTree } from '../components/CategoryTree'
import { PermissionGate } from '@/features/auth/PermissionGate'
import { HIERARCHY } from '@/lib/constants'
import { Plus, FolderTree } from 'lucide-react'
import { Button } from '@/components/common/Button'

export const GridCategory = ({
    setCategoryOpen,
    categoriesTree,
}) => {

    return (
        <div className='rounded-2xl border bg-card'>
          {/* HEADER */}
          <div className='flex items-center justify-between border-b p-4'>
            <div className='flex items-center gap-2'>
              <FolderTree className='h-5 w-5 text-primary' />
             <div>
                <h2 className='font-semibold'>
                  Categorías
                </h2>

                <p className='text-sm text-muted-foreground'>
                  Jerarquía de categorías
                </p>
              </div>
            </div>

            <PermissionGate minHierarchy={HIERARCHY.ADMIN}>
              <Button
                onClick={() => setCategoryOpen(true)}
                variant='primary'
              >
                <Plus className='h-4 w-4 mr-2' />
                Nueva categoría
              </Button>
            </PermissionGate>
          </div>

          {/* TREE */}
          <div className='p-4 max-h-[650px] overflow-auto'>
            <CategoryTree
              categories={categoriesTree}
            />
          </div>
        </div>
    )
}