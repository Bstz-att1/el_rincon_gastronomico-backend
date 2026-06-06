import { z } from "zod";

// ============================================
//   ESQUEMAS DE VALIDACION -- USUARIOS
// ============================================

const documentField = z
    .string({ required_error: "El campo 'document' es obligatorio." })
    .trim()
    .min(5,  'El documento debe tener al menos 5 caracteres.')
    .max(50, 'El documento no puede superar 50 caracteres.')
    .regex(/^\d+$/, 'El documento solo puede contener digitos numericos.');

const nameField = z
    .string({ required_error: "El campo 'name' es obligatorio." })
    .trim()
    .min(2,   'El nombre debe tener al menos 2 caracteres.')
    .max(100, 'El nombre no puede superar 100 caracteres.');

const usernameField = z
    .string({ required_error: "El campo 'username' es obligatorio." })
    .trim()
    .min(3,  'El username debe tener al menos 3 caracteres.')
    .max(50, 'El username no puede superar 50 caracteres.')
    .regex(/^[a-zA-Z0-9_]+$/, 'El username solo puede contener letras, numeros y guiones bajos.');

const passwordField = z
    .string({ required_error: "El campo 'password' es obligatorio." })
    .min(8,   'La contrasena debe tener al menos 8 caracteres.')
    .max(100, 'La contrasena no puede superar 100 caracteres.')
    .regex(/[A-Z]/,       'La contrasena debe contener al menos una letra mayuscula.')
    .regex(/[a-z]/,       'La contrasena debe contener al menos una letra minuscula.')
    .regex(/[0-9]/,       'La contrasena debe contener al menos un numero.')
    .regex(/[^A-Za-z0-9]/, 'La contrasena debe contener al menos un caracter especial.');

// Array de nombres de roles (ej: ['admin', 'supervisor'])
const rolesField = z
    .array(z.string().trim().min(1), { required_error: "El campo 'roles' es obligatorio." })
    .min(1, 'Se debe asignar al menos un rol al usuario.');

/**
 * POST /users -- Crear usuario.
 * Requiere: document, name, username, password, roles[].
 */
export const createUserSchema = z.object({
    document: documentField,
    name:     nameField,
    username: usernameField,
    password: passwordField,
    roles:    rolesField,
});

/**
 * PUT /users/:id -- Reemplazar datos editables del usuario.
 * No permite cambiar document ni username (campos de identidad).
 */
export const updateUserSchema = z.object({
    name:  nameField,
    roles: rolesField,
});

/**
 * PATCH /users/:id -- Actualizar campos de forma parcial.
 * Al menos uno de los campos debe estar presente.
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
