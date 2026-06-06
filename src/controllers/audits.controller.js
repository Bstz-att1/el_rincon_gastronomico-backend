import { AuditModel } from "../models/audits.model.js";
import { buildError, successResponse } from "../utils/response.handler.js";
import { catchAsync } from "../utils/catchAsync.js";

// ============================================
//      CONTROLADOR DE AUDITORIA
// ============================================
// Los registros de auditoria son INMUTABLES por diseno:
// solo se crean y consultan, nunca se modifican ni eliminan.

const parseId = (id) => { const parsed = Number(id); return Number.isInteger(parsed) && parsed > 0 ? parsed : null; };

export const getAllAuditLogs = catchAsync(async (req, res) => {
    const logs = await AuditModel.findAll();
    return successResponse(res, 200, "Lista de registros de auditoria obtenida", logs);
});

export const getAuditLogById = catchAsync(async (req, res, next) => {
    const id = parseId(req.params.id);
    if (!id) return next(buildError("ID invalido", 400, ["El parametro id debe ser un entero positivo."]));
    const log = await AuditModel.findById(id);
    if (!log) return next(buildError("Registro no encontrado", 404, ["No existe un registro de auditoria con el ID " + req.params.id]));
    return successResponse(res, 200, "Registro de auditoria encontrado", log);
});

export const createAuditLog = catchAsync(async (req, res, next) => {
    const { user_id, action, affected_table, record_id, details } = req.body;
    if (!user_id || !action || !affected_table || !record_id) {
        return next(buildError("Datos incompletos", 400, ["Los campos user_id, action, affected_table y record_id son obligatorios."]));
    }
    const newLog = await AuditModel.create({ user_id, action, affected_table, record_id, details });
    return successResponse(res, 201, "Registro de auditoria creado correctamente", newLog);
});
