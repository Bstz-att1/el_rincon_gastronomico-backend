import { z } from "zod";

// ============================================
//   ESQUEMAS DE VALIDACION -- PRODUCTOS
// ============================================

const nameField = z
    .string({ required_error: "El campo 'name' es obligatorio." })
    .trim()
    .min(2,   'El nombre debe tener al menos 2 caracteres.')
    .max(150, 'El nombre no puede superar 150 caracteres.');

const descriptionField = z
    .string()
    .trim()
    .max(1000, 'La descripcion no puede superar 1000 caracteres.')
    .optional();

const categoryIdField = z
    .number({ required_error: "El campo 'category_id' es obligatorio." })
    .int("El 'category_id' debe ser un numero entero.")
    .positive("El 'category_id' debe ser un numero positivo.");

const quantityBaseField = z
    .number()
    .int("La 'quantity' debe ser un numero entero.")
    .min(0, "La 'quantity' no puede ser negativa.");

/**
 * POST /products -- Crear un nuevo producto.
 */
export const createProductSchema = z.object({
    name:        nameField,
    description: descriptionField,
    category_id: categoryIdField,
    quantity:    quantityBaseField.optional().default(0),
});

/**
 * PUT /products/:id -- Reemplazar datos del producto.
 * En PUT, quantity es obligatoria para el reemplazo completo.
 */
export const updateProductSchema = z.object({
    name:        nameField,
    description: descriptionField,
    category_id: categoryIdField,
    quantity:    quantityBaseField.refine(
        (v) => v !== undefined,
        { message: "El campo 'quantity' es obligatorio en PUT." }
    ),
});

/**
 * PATCH /products/:id -- Actualizar campos del producto de forma parcial.
 */
export const patchProductSchema = z
    .object({
        name:        nameField.optional(),
        description: descriptionField,
        category_id: categoryIdField.optional(),
        quantity:    quantityBaseField.optional(),
    })
    .refine(
        (data) => Object.values(data).some((v) => v !== undefined),
        { message: 'Se debe enviar al menos un campo para actualizar.' }
    );
