import { PermissionGate } from '@/features/auth/PermissionGate'
import { HIERARCHY } from '@/lib/constants'
import { motion } from 'framer-motion'
import { Plus, Ruler } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { DataTable } from '@/components/layouts/DataTable'
import { unitColumns } from '../utils/unitColumns'

export const GridUnit = ({
    onCreate,
    units,
    page = 1,
    setPage,
    limit=5,
    loading,
    onEdit,
}) => {
    
    return (
        <div className='rounded-2xl border bg-card'>

          {/* HEADER */}

          <div className='flex items-center justify-between border-b p-4'>
            <div className='flex items-center gap-2'>
              <Ruler className='h-5 w-5 text-primary' />
              <div>
                <h2 className='font-semibold'>
                  Unidades
                </h2>

                <p className='text-sm text-muted-foreground'>
                  Unidades base para productos
                </p>
              </div>
            </div>

            <PermissionGate minHierarchy={HIERARCHY.ADMIN}>
              <Button
                onClick={onCreate}
                variant='primary'
              >
                <Plus className='h-4 w-4 mr-2' />
                Nueva unidad
              </Button>
            </PermissionGate>
          </div>

          <div className='p-4 space-y-2 max-h-[650px] overflow-auto'>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className='w-full'
            >
              <DataTable  
                title='Unidades'
                data={units}
                columns={unitColumns}
                page={page}
                setPage={setPage}
                limit={limit}
                searchFields={["name"]}
                loading={loading}
                onEdit={onEdit}
              />              
            </motion.div>
          </div>
        </div>
    )
}