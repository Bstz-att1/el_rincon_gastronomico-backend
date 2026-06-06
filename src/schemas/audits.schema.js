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
// realizados por usuarios con permiso audit.create.
// ============================================

// ── Acciones de auditoría permitidas ────────────────────────────────────────
// Lista cerrada de códigos válidos. Ampliar aquí si se requieren nuevas acciones.
const VALID_ACTIONS = [
    "CREATE",
    "UPDATE",
    "DELETE",
    "LOGIN",
    "LOGOUT",
    "READ",
    "RESTORE",
    "ASSIGN",
    "REVOKE",
];

// ── Campos reutilizables ─────────────────────────────────────────────────────

/** ID del usuario que realizó la acción: entero positivo requerido. */
const userIdField = z
    .number({ required_error: "El campo 'user_id' es obligatorio." })
    .int("El 'user_id' debe ser un numero entero.")
    .positive("El 'user_id' debe ser un numero positivo.");

/**
 * Código de la acción auditada.
 * Se normaliza a mayúsculas automáticamente; solo acepta los valores de VALID_ACTIONS.
 */
const actionField = z
    .string({ required_error: "El campo 'action' es obligatorio." })
    .trim()
    .toUpperCase()
    .refine(
        (v) => VALID_ACTIONS.includes(v),
        (v) => ({
            message: `La accion "${v}" no es valida. Valores permitidos: ${VALID_ACTIONS.join(", ")}.`,
        })
    );

/**
 * Nombre de la tabla afectada (snake_case).
 * Se normaliza a minúsculas y solo acepta letras, números y guiones bajos.
 */
const affectedTableField = z
    .string({ required_error: "El campo 'affected_table' es obligatorio." })
    .trim()
    .toLowerCase()
    .min(1,   "El campo 'affected_table' no puede estar vacio.")
    .max(100, "El campo 'affected_table' no puede superar 100 caracteres.")
    .regex(
        /^[a-z][a-z0-9_]*$/,
        "El campo 'affected_table' debe estar en snake_case (ej: audit_logs, user_roles)."
    );

/** ID del registro afectado dentro de la tabla: entero positivo requerido. */
const recordIdField = z
    .number({ required_error: "El campo 'record_id' es obligatorio." })
    .int("El 'record_id' debe ser un numero entero.")
    .positive("El 'record_id' debe ser un numero positivo.");

/** Contexto adicional en texto libre (opcional, máximo 1000 caracteres). */
const detailsField = z
    .string()
    .trim()
    .max(1000, "El campo 'details' no puede superar 1000 caracteres.")
    .optional();

// ── Esquemas de endpoints ────────────────────────────────────────────────────

/**
 * POST /audit
 * Crea un nuevo registro de auditoría manualmente.
 *
 * Campos:
 *   - user_id        : ID del usuario que realizó la acción.
 *   - action         : Código de acción — debe pertenecer a VALID_ACTIONS.
 *   - affected_table : Tabla afectada en snake_case (users, products, etc.).
 *   - record_id      : ID del registro afectado.
 *   - details        : Contexto adicional en texto libre (opcional).
 */
export const createAuditLogSchema = z.object({
    user_id:        userIdField,
    action:         actionField,
    affected_table: affectedTableField,
    record_id:      recordIdField,
    details:        detailsField,
});
