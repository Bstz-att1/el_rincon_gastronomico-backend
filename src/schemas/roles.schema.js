import { z } from "zod";

// ============================================
//   ESQUEMAS DE VALIDACION — ROLES
// ============================================

// ── Campos reutilizables ─────────────────────────────────────────────────────

/** Nombre del rol: alfanumérico con guiones bajos, entre 2 y 50 caracteres. */
const nameField = z
    .string({ required_error: "El campo 'name' es obligatorio." })
    .trim()
    .min(2,  "El nombre del rol debe tener al menos 2 caracteres.")
    .max(50, "El nombre del rol no puede superar 50 caracteres.")
    .regex(
        /^[a-zA-Z0-9_]+$/,
        "El nombre del rol solo puede contener letras, numeros y guiones bajos."
    );

/** Descripción del rol: opcional, máximo 255 caracteres. */
const descriptionField = z
    .string()
    .trim()
    .max(255, "La descripcion no puede superar 255 caracteres.")
    .optional();

/**
 * Array de códigos de permisos.
 * Cada código debe seguir el formato 'recurso.accion' (ej: products.read, users.create).
 * Al menos un permiso es obligatorio.
 */
const permissionsField = z
    .array(
        z
            .string({ required_error: "Cada permiso debe ser un string." })
            .trim()
            .min(1, "El codigo de permiso no puede estar vacio.")
            .regex(
                /^[a-z_]+\.[a-z_]+$/,
                "Cada permiso debe seguir el formato 'recurso.accion' (ej: products.read, categories.create)."
            ),
        { required_error: "El campo 'permissions' es obligatorio." }
    )
    .min(1, "Se debe asignar al menos un permiso al rol.");

// ── Esquemas de endpoints ────────────────────────────────────────────────────

/**
 * POST /roles
 * Crea un nuevo rol con sus permisos asociados.
 */
export const createRoleSchema = z.object({
    name:        nameField,
    description: descriptionField,
    permissions: permissionsField,
});

/**
 * PUT /roles/:id
 * Reemplaza TODOS los datos del rol (nombre, descripción y permisos).
 */
export const updateRoleSchema = z.object({
    name:        nameField,
    description: descriptionField,
    permissions: permissionsField,
});

/**
 * PATCH /roles/:id
 * Actualiza campos del rol de forma parcial. Al menos un campo debe estar presente.
 */
export const patchRoleSchema = z
    .object({
        name:        nameField.optional(),
        description: descriptionField,
        permissions: permissionsField.optional(),
    })
    .refine(
        (data) => Object.values(data).some((v) => v !== undefined),
        { message: "Se debe enviar al menos un campo para actualizar (name, description, permissions)." }
    );
