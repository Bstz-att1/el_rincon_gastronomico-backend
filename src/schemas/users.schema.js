import { z } from "zod";

// ============================================
//   ESQUEMAS DE VALIDACION — USUARIOS
// ============================================

// ── Campos reutilizables ─────────────────────────────────────────────────────

/** Número de documento de identidad: solo dígitos, entre 5 y 50 caracteres. */
const documentField = z
    .string({ required_error: "El campo 'document' es obligatorio." })
    .trim()
    .min(5,  "El documento debe tener al menos 5 caracteres.")
    .max(50, "El documento no puede superar 50 caracteres.")
    .regex(/^\d+$/, "El documento solo puede contener digitos numericos.");

/** Nombre completo del usuario: entre 2 y 100 caracteres. */
const nameField = z
    .string({ required_error: "El campo 'name' es obligatorio." })
    .trim()
    .min(2,   "El nombre debe tener al menos 2 caracteres.")
    .max(100, "El nombre no puede superar 100 caracteres.");

/** Nombre de usuario único: alfanumérico con guiones bajos, entre 3 y 50 caracteres. */
const usernameField = z
    .string({ required_error: "El campo 'username' es obligatorio." })
    .trim()
    .min(3,  "El username debe tener al menos 3 caracteres.")
    .max(50, "El username no puede superar 50 caracteres.")
    .regex(
        /^[a-zA-Z0-9_]+$/,
        "El username solo puede contener letras, numeros y guiones bajos."
    );

/**
 * Contraseña del usuario.
 *
 * Reglas:
 *  - Mínimo 8 caracteres, máximo 72 (límite real de bcrypt — bytes adicionales se ignoran).
 *  - Debe contener al menos: una mayúscula, una minúscula, un número y un carácter especial.
 *
 * Se usa superRefine para acumular TODOS los errores a la vez en lugar de
 * detener la validación al primero (mejor UX para el cliente).
 */
const passwordField = z
    .string({ required_error: "El campo 'password' es obligatorio." })
    .min(8,  "La contrasena debe tener al menos 8 caracteres.")
    .max(72, "La contrasena no puede superar 72 caracteres (limite de bcrypt).")
    .superRefine((val, ctx) => {
        if (!/[A-Z]/.test(val)) {
            ctx.addIssue({
                code:    z.ZodIssueCode.custom,
                message: "La contrasena debe contener al menos una letra mayuscula.",
            });
        }
        if (!/[a-z]/.test(val)) {
            ctx.addIssue({
                code:    z.ZodIssueCode.custom,
                message: "La contrasena debe contener al menos una letra minuscula.",
            });
        }
        if (!/[0-9]/.test(val)) {
            ctx.addIssue({
                code:    z.ZodIssueCode.custom,
                message: "La contrasena debe contener al menos un numero.",
            });
        }
        if (!/[^A-Za-z0-9]/.test(val)) {
            ctx.addIssue({
                code:    z.ZodIssueCode.custom,
                message: "La contrasena debe contener al menos un caracter especial.",
            });
        }
    });

/** Array de nombres de roles a asignar (ej: ['admin', 'supervisor']). */
const rolesField = z
    .array(
        z.string().trim().min(1, "El nombre del rol no puede estar vacio."),
        { required_error: "El campo 'roles' es obligatorio." }
    )
    .min(1, "Se debe asignar al menos un rol al usuario.");

// ── Esquemas de endpoints ────────────────────────────────────────────────────

/**
 * POST /users
 * Crear un nuevo usuario. Requiere: document, name, username, password, roles[].
 */
export const createUserSchema = z.object({
    document: documentField,
    name:     nameField,
    username: usernameField,
    password: passwordField,
    roles:    rolesField,
});

/**
 * PUT /users/:id
 * Reemplaza los datos editables del usuario (name y roles).
 * No permite cambiar document ni username (campos de identidad inmutables).
 */
export const updateUserSchema = z.object({
    name:  nameField,
    roles: rolesField,
});

/**
 * PATCH /users/:id
 * Actualiza campos de forma parcial. Al menos uno de los campos debe estar presente.
 */
export const patchUserSchema = z
    .object({
        name:  nameField.optional(),
        roles: rolesField.optional(),
    })
    .refine(
        (data) => Object.values(data).some((v) => v !== undefined),
        { message: "Se debe enviar al menos un campo para actualizar (name, roles)." }
    );
