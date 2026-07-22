import { z } from 'zod';

export const productSchema = z.object({
    name: z.string().min(3).max(50),
    code: z.string().min(3).max(20)
        .refine((val) => !val.includes(' '), {
            message: 'El código del producto no puede contener espacios'
        }),
    product_category_id: z.number().positive(),
    unit_id: z.number().positive(),
    content_quantity: z.number({ invalid_type_error: 'Debe ser un número' }).positive(),
    min_stock: z.number({ invalid_type_error: 'Debe ser un número' }).nonnegative(),
    max_stock: z.number({ invalid_type_error: 'Debe ser un número' }).nonnegative(),
});