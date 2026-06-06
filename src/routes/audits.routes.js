import { Router } from "express";
import {
    getAllAuditLogs,
    getAuditLogById,
    createAuditLog,
    updateAuditLogComplete,
    updateAuditLogPartial,
    deleteAuditLog
} from "../controllers/audits.controller.js";
import { authMiddleware, checkRole } from "../middlewares/auth.middleware.js";

const auditRouter = Router();

// ============================================
// RUTAS DEL MÓDULO DE AUDITORÍA (CRUD)
// ============================================

// Obtener todos los registros de auditoría
auditRouter.get("/", authMiddleware, checkRole("admin", "user"), getAllAuditLogs);

// Obtener un registro de auditoría específico por su ID
auditRouter.get("/:id", authMiddleware, checkRole("admin", "user"), getAuditLogById);

// Registrar un nuevo registro de auditoría
auditRouter.post("/", authMiddleware, checkRole("admin"), createAuditLog);

// Actualizar datos del registro de auditoría completamente ( PUT )
auditRouter.put("/:id", authMiddleware, checkRole("admin"), updateAuditLogComplete);

// Actualizar datos del registro de auditoría parcialmente ( PATCH )
auditRouter.patch("/:id", authMiddleware, checkRole("admin"), updateAuditLogPartial);

// Eliminar un registro de auditoría del sistema
auditRouter.delete("/:id", authMiddleware, checkRole("admin"), deleteAuditLog);

export default auditRouter;
