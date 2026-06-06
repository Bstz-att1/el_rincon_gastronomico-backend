import { z } from "zod";

// ============================================
//   ESQUEMAS DE VALIDACIÓN — AUDITORÍA
// ============================================
//
// Los registros de auditoría son INMUTABLES por diseño:
// solo existe el schema de creación (POST). No hay PUT/PATCH.
//
// Nota: En un sistema de producción maduro, los registros de
// auditoría se generan internamente (sin pasar por la API pública).
// Este endpoint existe para casos de integración o registros manuales
// realizados por usuarios con permiso audit.read.
// ============================================

/**
 * POST /audit
 * Crea un nuevo registro de auditoría.
 *
 * Campos:
 *   - user_id        : ID del usuario que realizó la acción (entero positivo).
 *   - action         : Código de la acción realizada (ej: "CREATE", "UPDATE", "DELETE").
 *   - affected_table : Nombre de la tabla afectada (ej: "products", "users").
 *   - record_id      : ID del registro afectado dentro de la tabla.
 *   - details        : Información adicional en formato JSON string (opcional).
 */
export const createAuditLogSchema = z.object({
    user_id: z
        .number({ required_error: "El campo 'user_id' es obligatorio." })
        .int("El 'user_id' debe ser un numero entero.")
        .positive("El 'user_id' debe ser un numero positivo."),

    action: z
        .string({ required_error: "El campo 'action' es obligatorio." })
        .trim()
        .min(1, "El campo 'action' no puede estar vacio.")
        .max(50, "El campo 'action' no puede superar 50 caracteres.")
        .toUpperCase(), // Normalizar a mayúsculas (CREATE, UPDATE, DELETE, LOGIN, etc.)

    affected_table: z
        .string({ required_error: "El campo 'affected_table' es obligatorio." })
        .trim()
        .min(1, "El campo 'affected_table' no puede estar vacio.")
        .max(100, "El campo 'affected_table' no puede superar 100 caracteres.")
        .toLowerCase(), // Normalizar a minúsculas (users, products, categories, etc.)

    record_id: z
        .number({ required_error: "El campo 'record_id' es obligatorio." })
        .int("El 'record_id' debe ser un numero entero.")
        .positive("El 'record_id' debe ser un numero positivo."),

    details: z
        .string()
        .trim()
        .max(1000, "El campo 'details' no puede superar 1000 caracteres.")
        .optional(),
});
