import { z } from "zod";

// ============================================
//   ESQUEMAS DE VALIDACIÓN — PRODUCTOS
// ============================================

// ── Campos reutilizables ─────────────────────────────────────────────────────

/** Nombre del producto: requerido, entre 2 y 150 caracteres. */
const nameField = z
    .string({ required_error: "El campo 'name' es obligatorio." })
    .trim()
    .min(2,   "El nombre debe tener al menos 2 caracteres.")
    .max(150, "El nombre no puede superar 150 caracteres.");

/** Descripción del producto: opcional, máximo 1000 caracteres. */
const descriptionField = z
    .string()
    .trim()
    .max(1000, "La descripcion no puede superar 1000 caracteres.")
    .optional();

/** ID de categoría: entero positivo requerido. */
const categoryIdField = z
    .number({ required_error: "El campo 'category_id' es obligatorio." })
    .int("El 'category_id' debe ser un numero entero.")
    .positive("El 'category_id' debe ser un numero positivo.");

/** Stock del producto: entero no negativo. */
const quantityField = z
    .number()
    .int("La 'quantity' debe ser un numero entero.")
    .min(0, "La 'quantity' no puede ser negativa.");

// ── Esquemas de endpoints ────────────────────────────────────────────────────

/**
 * POST /products
 * Crea un nuevo producto. La cantidad es opcional y por defecto 0.
 */
export const createProductSchema = z.object({
    name:        nameField,
    description: descriptionField,
    category_id: categoryIdField,
    quantity:    quantityField.optional().default(0),
});

/**
 * PUT /products/:id
 * Reemplaza TODOS los datos del producto. Todos los campos son obligatorios.
 * quantity no tiene valor por defecto — debe enviarse explícitamente.
 */
export const updateProductSchema = z.object({
    name:        nameField,
    description: descriptionField,
    category_id: categoryIdField,
    quantity:    quantityField, // Obligatorio en PUT (sin .optional())
});

/**
 * PATCH /products/:id
 * Actualiza campos de forma parcial. Se debe enviar al menos un campo.
 */
export const patchProductSchema = z
    .object({
        name:        nameField.optional(),
        description: descriptionField,
        category_id: categoryIdField.optional(),
        quantity:    quantityField.optional(),
    })
    .refine(
        (data) => Object.values(data).some((v) => v !== undefined),
        { message: "Se debe enviar al menos un campo para actualizar (name, description, category_id, quantity)." }
    );
