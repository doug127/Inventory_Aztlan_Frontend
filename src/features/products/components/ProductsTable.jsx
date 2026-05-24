import {
  Package,
} from 'lucide-react'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import {
  Badge,
} from '@/components/ui/badge'

export const ProductsTable = ({
  products = [],
  loading,
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

            <TableHeader>

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

                <TableHead>
                  Estado
                </TableHead>

              </TableRow>

            </TableHeader>

            <TableBody>

              {
                loading
                  ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className='text-center h-24'
                      >
                        Cargando productos...
                      </TableCell>
                    </TableRow>
                  )
                  : products.length === 0
                    ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className='text-center h-24 text-muted-foreground'
                        >
                          No hay productos registrados
                        </TableCell>
                      </TableRow>
                    )
                    : (
                      products.map((product) => (

                        <TableRow key={product.code}>

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

                          <TableCell>

                            <Badge
                              variant={
                                product.is_active
                                  ? 'default'
                                  : 'secondary'
                              }
                            >
                              {
                                product.is_active
                                  ? 'Activo'
                                  : 'Inactivo'
                              }
                            </Badge>

                          </TableCell>

                        </TableRow>
                      ))
                    )
              }

            </TableBody>

          </Table>

        </div>

      </CardContent>

    </Card>
  )
}