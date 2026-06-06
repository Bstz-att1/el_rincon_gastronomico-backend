import { AuditModel } from "../models/audits.model.js";
import { buildError, successResponse } from "../utils/response.handler.js";
import { catchAsync } from "../utils/catchAsync.js";

// ============================================
//   CONTROLADOR DE AUDITORÍA
// ============================================
//
// Los registros de auditoría son INMUTABLES por diseño:
//   - GET  /audit      → listar todos los registros
//   - GET  /audit/:id  → obtener un registro por ID
//   - POST /audit      → crear un registro manualmente
//
// No existen endpoints PUT, PATCH ni DELETE.
// La validación del body en POST la realiza validate(createAuditLogSchema) en la ruta.
// ============================================

/**
 * Convierte y valida un parámetro de ruta :id a entero positivo.
 * @param {string} id - Valor del parámetro de ruta.
 * @returns {number|null} Número entero positivo, o null si es inválido.
 */
const parseId = (id) => {
    const parsed = Number(id);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

// ── GET /audit ───────────────────────────────────────────────────────────────
/**
 * Devuelve todos los registros de auditoría, ordenados del más reciente al más antiguo.
 * Requiere permiso: audit.read
 */
export const getAllAuditLogs = catchAsync(async (_req, res) => {
    const logs = await AuditModel.findAll();
    return successResponse(res, 200, "Lista de registros de auditoria obtenida", logs);
});

// ── GET /audit/:id ───────────────────────────────────────────────────────────
/**
 * Devuelve un registro de auditoría específico por su ID.
 * Requiere permiso: audit.read
 */
export const getAuditLogById = catchAsync(async (req, res, next) => {
    const id = parseId(req.params.id);
    if (!id) {
        return next(buildError("ID invalido", 400, ["El parametro id debe ser un entero positivo."]));
    }

    const log = await AuditModel.findById(id);
    if (!log) {
        return next(buildError(
            "Registro no encontrado", 404,
            [`No existe un registro de auditoria con el ID ${req.params.id}.`]
        ));
    }

    return successResponse(res, 200, "Registro de auditoria encontrado", log);
});

// ── POST /audit ──────────────────────────────────────────────────────────────
/**
 * Crea un nuevo registro de auditoría.
 * La validación de campos la realiza validate(createAuditLogSchema) en la ruta.
 * Requiere permiso: audit.read
 *
 * @body {number} user_id        - ID del usuario que ejecutó la acción.
 * @body {string} action         - Código de acción (CREATE, UPDATE, DELETE, LOGIN, etc.).
 * @body {string} affected_table - Tabla afectada (products, users, categories, etc.).
 * @body {number} record_id      - ID del registro dentro de la tabla afectada.
 * @body {string} [details]      - Información adicional opcional.
 */
export const createAuditLog = catchAsync(async (req, res) => {
    const { user_id, action, affected_table, record_id, details } = req.body;

    const newLog = await AuditModel.create({
        user_id,
        action,
        affected_table,
        record_id,
        details,
    });

    return successResponse(res, 201, "Registro de auditoria creado correctamente", newLog);
});
