// ============================================
//   RUTAS DE AUDITORÍA
// ============================================
//
// Los registros de auditoría son INMUTABLES por diseño:
//   → No existen endpoints PUT, PATCH ni DELETE.
//
// Permisos requeridos:
//   GET  /audit      → audit.read    (listar todos los registros)
//   GET  /audit/:id  → audit.read    (obtener un registro por ID)
//   POST /audit      → audit.create  (crear un registro manualmente)
//
// La creación manual vía API es útil para integraciones externas o
// registros administrativos. En condiciones normales, los logs se
// generan automáticamente dentro de los controladores de negocio.
// ============================================

import { Router } from "express";
import { getAllAuditLogs, getAuditLogById, createAuditLog } from "../controllers/index.js";
import { authMiddleware, checkPermission, validate }        from "../middlewares/index.js";
import { createAuditLogSchema }                             from "../schemas/index.js";

const auditRouter = Router();

// Listar todos los registros de auditoría
auditRouter.get("/",    authMiddleware, checkPermission("audit.read"),   getAllAuditLogs);

// Obtener un registro de auditoría por ID
auditRouter.get("/:id", authMiddleware, checkPermission("audit.read"),   getAuditLogById);

// Crear un registro de auditoría manualmente (validado con Zod)
auditRouter.post("/",   authMiddleware, checkPermission("audit.create"), validate(createAuditLogSchema), createAuditLog);

export default auditRouter;
