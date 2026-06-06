//  ============================================
//      CONTROLADOR CENTRADO EN AUDITORÍA
//  ============================================ 

import { AuditModel } from "../models/audits.model.js";
import { buildError, successResponse } from "../utils/response.handler.js";
import { catchAsync } from "../utils/catchAsync.js";

// Trae todos los registros de auditoría
export const getAllAuditLogs = catchAsync(async (req, res) => {
    const auditLogs = await AuditModel.findAll();
    return successResponse(res, 200, "Lista de auditoría obtenida", auditLogs);
});

// Trae un registro de auditoría por su Id
export const getAuditLogById = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const auditLog = await AuditModel.findById(Number(id));

    if (!auditLog) {
        return next(buildError("Registro de auditoría no encontrado", 404, [`Registro con ID ${id} no encontrado`]));
    }

    return successResponse(res, 200, "Registro de auditoría encontrado", auditLog);
});

// Crea un nuevo registro de auditoría
export const createAuditLog = catchAsync(async (req, res, next) => {
    const { usuario_id, accion, tabla_afectada, registro_id, detalles } = req.body;

    if (!usuario_id || !accion || !tabla_afectada || !registro_id) {
        return next(
            buildError(
                "Error al crear registro de auditoría",
                400,
                ["Los campos usuario_id, accion, tabla_afectada y registro_id son obligatorios"]
            )
        );
    }

    const newAuditLog = await AuditModel.create({ usuario_id, accion, tabla_afectada, registro_id, detalles });
    return successResponse(res, 200, "Registro de auditoría creado correctamente", newAuditLog);
});

// Actualiza todos los campos del registro de auditoría ( PUT )
export const updateAuditLogComplete = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { usuario_id, accion, tabla_afectada, registro_id, detalles } = req.body;

    if (!usuario_id || !accion || !tabla_afectada || !registro_id) {
        return next(
            buildError(
                "Error al actualizar",
                400,
                ["usuario_id, accion, tabla_afectada y registro_id son obligatorios"]
            )
        );
    }

    const updatedAuditLog = await AuditModel.updateComplete(Number(id), {
        usuario_id,
        accion,
        tabla_afectada,
        registro_id,
        detalles
    });

    if (!updatedAuditLog) {
        return next(buildError("Error al actualizar", 404, [`Registro de auditoría con ID ${id} no encontrado`]));
    }

    return successResponse(res, 200, "Registro de auditoría actualizado completamente", updatedAuditLog);
});

// Actualiza parcialmente ( PATCH )
export const updateAuditLogPartial = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { usuario_id, accion, tabla_afectada, registro_id, detalles } = req.body;

    if (
        usuario_id === undefined &&
        accion === undefined &&
        tabla_afectada === undefined &&
        registro_id === undefined &&
        detalles === undefined
    ) {
        return next(buildError("Error al actualizar", 400, ["Se requiere al menos un campo para actualizar"]));
    }

    const updatedAuditLog = await AuditModel.updatePartial(Number(id), {
        usuario_id,
        accion,
        tabla_afectada,
        registro_id,
        detalles
    });

    if (!updatedAuditLog) {
        return next(buildError("Error al actualizar", 404, [`Registro de auditoría con ID ${id} no encontrado`]));
    }

    return successResponse(res, 200, "Registro de auditoría actualizado parcialmente", updatedAuditLog);
});

// Elimina un registro de auditoría
export const deleteAuditLog = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const auditLogExists = await AuditModel.findById(Number(id));

    if (!auditLogExists) {
        return next(
            buildError(
                "Error al eliminar registro de auditoría",
                404,
                [`No se pudo eliminar: Registro con ID ${id} no encontrado`]
            )
        );
    }

    await AuditModel.delete(Number(id));
    return successResponse(res, 200, "Registro de auditoría eliminado correctamente");
});
