import { Package } from 'lucide-react'
import {  Card,  CardContent,  CardHeader,  CardTitle,} from '@/components/ui/card'
import {  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from '@/components/ui/table'
import { Button } from '@/components/ui/button'

export const ProductsTable = ({
  products = [],
  loading,

  page,
  setPage,
  limit,
}) => {

  return (
    <Card className='rounded-3xl'>

      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Package className='h-5 w-5' />
          Productos
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className='rounded-2xl border overflow-hidden'>
          <Table>
            <TableHeader className='bg-chart-2/50'>
              <TableRow>
                <TableHead>
                  Código
                </TableHead>
                <TableHead>
                  Producto
                </TableHead>
                <TableHead>
                  Categoría
                </TableHead>
                <TableHead>
                  Unidad
                </TableHead>
                <TableHead>
                  Contenido
                </TableHead>
                <TableHead>
                  Stock Min
                </TableHead>
                <TableHead>
                  Stock Max
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>

              {
                loading
                  ? (
                    <TableRow>
                      <TableCell colSpan={8} className='text-center h-24'>
                        Cargando productos...
                      </TableCell>
                    </TableRow>
                  ) : products.length === 0
                    ? (
                      <TableRow>
                        <TableCell colSpan={8} >
                          No hay productos registrados
                        </TableCell>
                      </TableRow>
                    )
                    : (
                      products.data.map((product) => (

                        <TableRow key={product.code} className='even:!bg-chart-1/60'>

                          <TableCell className='font-medium'>
                            {product.code}
                          </TableCell>

                          <TableCell>
                            {product.name}
                          </TableCell>

                          <TableCell>
                            {product.category_product?.name}
                          </TableCell>

                          <TableCell>
                            {product.unit?.name}
                            {' '}
                            ({product.unit?.code})
                          </TableCell>

                          <TableCell>
                            {product.content_quantity}
                          </TableCell>

                          <TableCell>
                            {product.min_stock}
                          </TableCell>

                          <TableCell>
                            {product.max_stock}
                          </TableCell>
                        </TableRow>
                      ))
                    )
              }
            </TableBody>
          </Table>
          <div className='flex items-center justify-between mt-4'>

            {/* INFO */}

            <div className='text-sm text-muted-foreground'>

              Página{' '}

              <span className='font-medium'>
                {products?.meta?.page}
              </span>

              {' '}de{' '}

              <span className='font-medium'>
                {products?.meta?.totalPages}
              </span>

            </div>

            {/* BUTTONS */}

            <div className='flex items-center gap-2'>

              <Button
                variant='outline'
                size='sm'
                disabled={!products?.meta?.hasPreviousPage}
                onClick={() =>
                  setPage((prev) => prev - 1)
                }
              >
                Anterior
              </Button>

              <Button
                size='sm'
                disabled={!products?.meta?.hasNextPage}
                onClick={() =>
                  setPage((prev) => prev + 1)
                }
              >
                Siguiente
              </Button>

            </div>

          </div>
        </div>
      </CardContent>
    </Card>
  )
}