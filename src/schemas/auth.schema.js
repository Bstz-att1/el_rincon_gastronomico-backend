import { z } from "zod";

// ============================================
//   ESQUEMAS DE VALIDACION -- AUTENTICACION
// ============================================

/**
 * Esquema para el body del endpoint POST /auth/login.
 */
export const loginSchema = z.object({
    username: z
        .string({ required_error: "El campo 'username' es obligatorio." })
        .trim()
        .min(1, "El campo 'username' no puede estar vacio."),

    password: z
        .string({ required_error: "El campo 'password' es obligatorio." })
        .min(1, "El campo 'password' no puede estar vacio."),
});
