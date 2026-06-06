import { z } from "zod";

// ============================================
//   ESQUEMAS DE VALIDACION -- CATEGORIAS
// ============================================

const nameField = z
    .string({ required_error: "El campo 'name' es obligatorio." })
    .trim()
    .min(2,   'El nombre debe tener al menos 2 caracteres.')
    .max(100, 'El nombre no puede superar 100 caracteres.');

const descriptionField = z
    .string()
    .trim()
    .max(500, 'La descripcion no puede superar 500 caracteres.')
    .optional();

/**
 * POST /categories -- Crear una nueva categoria.
 */
export const createCategorySchema = z.object({
    name:        nameField,
    description: descriptionField,
});

/**
 * PUT /categories/:id -- Reemplazar datos de la categoria.
 * En PUT, description es obligatoria para hacer el reemplazo completo.
 */
export const updateCategorySchema = z.object({
    name: nameField,
    description: z
        .string({ required_error: "El campo 'description' es obligatorio en PUT." })
        .trim()
        .max(500, 'La descripcion no puede superar 500 caracteres.'),
});

/**
 * PATCH /categories/:id -- Actualizar campos de forma parcial.
 */
export const patchCategorySchema = z
    .object({
        name:        nameField.optional(),
        description: descriptionField,
    })
    .refine(
        (data) => Object.values(data).some((v) => v !== undefined),
        { message: "Se debe enviar al menos un campo para actualizar (name, description)." }
    );
