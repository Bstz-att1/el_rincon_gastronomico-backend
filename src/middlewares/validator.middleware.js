import { ZodError } from "zod";
import { buildError } from "../utils/response.handler.js";

// ============================================
//   MIDDLEWARE DE VALIDACION CON ZOD
// ============================================

/**
 * Valida el body del request contra un esquema Zod.
 *
 * Si la validacion falla, construye una respuesta 400 con todos los errores
 * formateados de forma legible para el cliente.
 *
 * Si la validacion pasa, reemplaza req.body con los datos parseados por Zod
 * (con coerciones, defaults y transformaciones aplicadas).
 *
 * @param {import("zod").ZodSchema} schema - Esquema Zod a usar para la validacion.
 * @returns {import("express").RequestHandler}
 *
 * @example
 * import { createProductSchema } from "../schemas/products.schema.js";
 * router.post("/", authMiddleware, validate(createProductSchema), createProduct);
 */
export const validate = (schema) => (req, res, next) => {
    try {
        // parseamos y sobreescribimos req.body con los datos transformados por Zod
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
        next(err);
    }
};