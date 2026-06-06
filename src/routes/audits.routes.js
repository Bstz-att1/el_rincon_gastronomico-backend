import { Router } from "express";
import { getAllAuditLogs, getAuditLogById, createAuditLog } from "../controllers/audits.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { checkPermission } from "../middlewares/rbac.middleware.js";

// Los logs de auditoria son inmutables: no hay PUT/PATCH/DELETE
const auditRouter = Router();

auditRouter.get("/",    authMiddleware, checkPermission("audit.read"), getAllAuditLogs);
auditRouter.get("/:id", authMiddleware, checkPermission("audit.read"), getAuditLogById);
auditRouter.post("/",   authMiddleware, checkPermission("audit.read"), createAuditLog);

export default auditRouter;
