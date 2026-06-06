import { ZodError } from "zod";
import { buildError } from "../utils/index.js";

// ============================================
//   MIDDLEWARE DE VALIDACIÓN CON ZOD
// ============================================

/**
 * Valida el body del request contra un esquema Zod.
 *
 * Si la validación falla, construye una respuesta 400 con todos los errores
 * formateados de forma legible para el cliente (uno por campo inválido).
 *
 * Si la validación pasa, reemplaza req.body con los datos parseados por Zod
 * (coerciones, valores por defecto y transformaciones ya aplicadas).
 *
 * @param {import("zod").ZodSchema} schema - Esquema Zod a usar para la validación.
 * @returns {import("express").RequestHandler}
 *
 * @example
 * import { createProductSchema } from "../schemas/products.schema.js";
 * router.post("/", authMiddleware, checkPermission("products.create"), validate(createProductSchema), createProduct);
 */
export const validate = (schema) => (req, _res, next) => {
    try {
        // Parsear y sobreescribir req.body con los datos transformados por Zod.
        // Esto garantiza que el controlador recibe datos limpios y tipados.
        req.body = schema.parse(req.body);
        next();
    } catch (err) {
        if (err instanceof ZodError) {
            const errors = err.errors.map((e) => {
                const field = e.path.length > 0 ? e.path.join(".") : "body";
                return `[${field}]: ${e.message}`;
            });
            return next(buildError("Error de validacion", 400, errors));
        }
        // Error inesperado (no de Zod) — propagar al globalErrorHandler
        next(err);
    }
};
