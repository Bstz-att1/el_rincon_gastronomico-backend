import { z } from "zod";

// ============================================
//   ESQUEMAS DE VALIDACION -- ROLES
// ============================================

const nameField = z
    .string({ required_error: "El campo 'name' es obligatorio." })
    .trim()
    .min(2,  'El nombre del rol debe tener al menos 2 caracteres.')
    .max(50, 'El nombre del rol no puede superar 50 caracteres.')
    .regex(/^[a-zA-Z0-9_]+$/, 'El nombre solo puede contener letras, numeros y guiones bajos.');

const descriptionField = z
    .string()
    .trim()
    .max(255, 'La descripcion no puede superar 255 caracteres.')
    .optional();

// Array de codigos de permisos (ej: ['products.read', 'categories.create'])
const permissionsField = z
    .array(
        z.string({ required_error: 'Cada permiso debe ser un string.' }).trim().min(1),
        { required_error: "El campo 'permissions' es obligatorio." }
    )
    .min(1, 'Se debe asignar al menos un permiso al rol.');

/**
 * POST /roles -- Crear un nuevo rol.
 */
export const createRoleSchema = z.object({
    name:        nameField,
    description: descriptionField,
    permissions: permissionsField,
});

/**
 * PUT /roles/:id -- Reemplazar datos del rol.
 */
export const updateRoleSchema = z.object({
    name:        nameField,
    description: descriptionField,
    permissions: permissionsField,
});

/**
 * PATCH /roles/:id -- Actualizar campos del rol de forma parcial.
 */
export const patchRoleSchema = z
    .object({
        name:        nameField.optional(),
        description: descriptionField,
        permissions: permissionsField.optional(),
    })
    .refine(
        (data) => Object.values(data).some((v) => v !== undefined),
        { message: "Se debe enviar al menos un campo (name, description, permissions)." }
    );
