import { Router } from "express";
import {
    getAllAuditLogs,
    getAuditLogById,
    createAuditLog,
    updateAuditLogComplete,
    updateAuditLogPartial,
    deleteAuditLog
} from "../controllers/auditoria.controller.js";

const auditRouter = Router();

// ============================================
// RUTAS DEL MÓDULO DE AUDITORÍA (CRUD)
// ============================================

// Obtener todos los registros de auditoría
auditRouter.get("/", getAllAuditLogs);

// Obtener un registro de auditoría específico por su ID
auditRouter.get("/:id", getAuditLogById);

// Registrar un nuevo registro de auditoría
auditRouter.post("/", createAuditLog);

// Actualizar datos del registro de auditoría completamente ( PUT )
auditRouter.put("/:id", updateAuditLogComplete);

// Actualizar datos del registro de auditoría parcialmente ( PATCH )
auditRouter.patch("/:id", updateAuditLogPartial);

// Eliminar un registro de auditoría del sistema
auditRouter.delete("/:id", deleteAuditLog);

export default auditRouter;
