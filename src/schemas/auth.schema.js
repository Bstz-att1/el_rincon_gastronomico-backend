import { z } from "zod";

// ============================================
//   ESQUEMAS DE VALIDACION — AUTENTICACION
// ============================================

/**
 * POST /auth/login
 * Valida las credenciales de inicio de sesión.
 *
 * Mejoras aplicadas:
 *  - username: max 50 chars (alineado con la columna en DB).
 *  - password: max 128 chars para evitar ataques de payload enorme;
 *    bcrypt trunca internamente a 72 bytes, pero aceptamos hasta 128
 *    para no exponer ese detalle de implementación al cliente.
 */
export const loginSchema = z.object({
    username: z
        .string({ required_error: "El campo 'username' es obligatorio." })
        .trim()
        .min(1,  "El campo 'username' no puede estar vacio.")
        .max(50, "El campo 'username' no puede superar 50 caracteres."),

    password: z
        .string({ required_error: "El campo 'password' es obligatorio." })
        .min(1,   "El campo 'password' no puede estar vacio.")
        .max(128, "El campo 'password' no puede superar 128 caracteres."),
});
