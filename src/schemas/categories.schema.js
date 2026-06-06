import { z } from "zod";

// ============================================
//   ESQUEMAS DE VALIDACION — CATEGORIAS
// ============================================

// ── Campos reutilizables ─────────────────────────────────────────────────────

/** Nombre de la categoría: requerido, entre 2 y 100 caracteres. */
const nameField = z
    .string({ required_error: "El campo 'name' es obligatorio." })
    .trim()
    .min(2,   "El nombre debe tener al menos 2 caracteres.")
    .max(100, "El nombre no puede superar 100 caracteres.");

/**
 * Descripción opcional de la categoría (máximo 500 caracteres).
 * Usado en POST y en el campo opcional de PATCH.
 */
const descriptionField = z
    .string()
    .trim()
    .max(500, "La descripcion no puede superar 500 caracteres.")
    .optional();

/**
 * Descripción para PUT: acepta string, null (para limpiar el campo) o undefined.
 * Esto permite que un PUT explícitamente borre la descripción enviando null.
 */
const descriptionPutField = z
    .string()
    .trim()
    .max(500, "La descripcion no puede superar 500 caracteres.")
    .nullable()
    .optional();

// ── Esquemas de endpoints ────────────────────────────────────────────────────

/**
 * POST /categories
 * Crea una nueva categoría. La descripción es opcional.
 */
export const createCategorySchema = z.object({
    name:        nameField,
    description: descriptionField,
});

/**
 * PUT /categories/:id
 * Reemplaza TODOS los datos de la categoría.
 * name es obligatorio; description puede enviarse como null para limpiarla.
 */
export const updateCategorySchema = z.object({
    name:        nameField,
    description: descriptionPutField,
});

/**
 * PATCH /categories/:id
 * Actualiza campos de forma parcial. Se debe enviar al menos un campo.
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
