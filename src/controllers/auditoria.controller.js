//  ============================================
//      CONTROLADOR CENTRADO EN AUDITORÍA
//  ============================================ 

import { AuditModel } from "../models/auditoria.model.js";
import { errorResponse, successResponse } from "../utils/response.handler.js";

// Trae todos los registros de auditoría
export const getAllAuditLogs = async (req, res) => {
    try {
        const auditLogs = await AuditModel.findAll();
        return successResponse(res, 200, "Lista de auditoría obtenida", auditLogs);
    } catch (error) {
        return errorResponse(res, 500, "Error del servidor", error.message);
    }
};

// Trae un registro de auditoría por su Id
export const getAuditLogById = async (req, res) => {
    try {
        const { id } = req.params;
        const auditLog = await AuditModel.findById(Number(id));

        if (!auditLog) {
            return errorResponse(res, 404, "Registro de auditoría no encontrado", `Registro con ID ${id} no encontrado`);
        }

        return successResponse(res, 200, "Registro de auditoría encontrado", auditLog);
    } catch (error) {
        return errorResponse(res, 500, "Error del servidor", error.message);
    }
};

// Crea un nuevo registro de auditoría
export const createAuditLog = async (req, res) => {
    try {
        const { usuario_id, accion, tabla_afectada, registro_id, detalles } = req.body;

        if (!usuario_id || !accion || !tabla_afectada || !registro_id) {
            return errorResponse(
                res,
                400,
                "Error al crear registro de auditoría",
                "Los campos usuario_id, accion, tabla_afectada y registro_id son obligatorios"
            );
        }

        const newAuditLog = await AuditModel.create({ usuario_id, accion, tabla_afectada, registro_id, detalles });
        return successResponse(res, 200, "Registro de auditoría creado correctamente", newAuditLog);
    } catch (error) {
        return errorResponse(res, 500, "Error del servidor", error.message);
    }
};

// Actualiza todos los campos del registro de auditoría ( PUT )
export const updateAuditLogComplete = async (req, res) => {
    try {
        const { id } = req.params;
        const { usuario_id, accion, tabla_afectada, registro_id, detalles } = req.body;

        // Campos obligatorios para actualización completa
        if (!usuario_id || !accion || !tabla_afectada || !registro_id) {
            return errorResponse(
                res,
                400,
                "Error al actualizar",
                "usuario_id, accion, tabla_afectada y registro_id son obligatorios"
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
            return errorResponse(res, 404, "Error al actualizar", `Registro de auditoría con ID ${id} no encontrado`);
        }

        return successResponse(res, 200, "Registro de auditoría actualizado completamente", updatedAuditLog);
    } catch (error) {
        return errorResponse(res, 500, "Error del servidor", error.message);
    }
};

// Actualiza parcialmente ( PATCH )
export const updateAuditLogPartial = async (req, res) => {
    try {
        const { id } = req.params;
        const { usuario_id, accion, tabla_afectada, registro_id, detalles } = req.body;

        // Validación parcial
        if (
            usuario_id === undefined &&
            accion === undefined &&
            tabla_afectada === undefined &&
            registro_id === undefined &&
            detalles === undefined
        ) {
            return errorResponse(res, 400, "Error al actualizar", "Se requiere al menos un campo para actualizar");
        }

        const updatedAuditLog = await AuditModel.updatePartial(Number(id), {
            usuario_id,
            accion,
            tabla_afectada,
            registro_id,
            detalles
        });

        if (!updatedAuditLog) {
            return errorResponse(res, 404, "Error al actualizar", `Registro de auditoría con ID ${id} no encontrado`);
        }

        return successResponse(res, 200, "Registro de auditoría actualizado parcialmente", updatedAuditLog);
    } catch (error) {
        return errorResponse(res, 500, "Error del servidor", error.message);
    }
};

// Elimina un registro de auditoría
export const deleteAuditLog = async (req, res) => {
    try {
        const { id } = req.params;

        const auditLogExists = await AuditModel.findById(Number(id));

        if (!auditLogExists) {
            return errorResponse(
                res,
                404,
                "Error al eliminar registro de auditoría",
                `No se pudo eliminar: Registro con ID ${id} no encontrado`
            );
        }

        await AuditModel.delete(Number(id));
        return successResponse(res, 200, "Registro de auditoría eliminado correctamente");
    } catch (error) {
        return errorResponse(res, 500, "Error del servidor", error.message);
    }
};
