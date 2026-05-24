import { z } from "zod";

export const categorySchema = z.object({
    name: z.string()
        .min(1, "El campo nombre no puede estar vacío")
        .max(100, "El campo nombre no puede superar los 100 caracteres"),
    description: z.string()
        .max(255, "El campo descripción no puede superar los 255 caracteres")
        .optional(),
    parent_id: z.number()
        .nullable()
        .default(null),
});