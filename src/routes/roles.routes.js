import { Router } from "express";
import { getAllRoles, getAllPermissions, getRoleById, getRolePermissions, createRole, updateRoleComplete, updateRolePartial, deleteRole } from "../controllers/roles.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { checkPermission } from "../middlewares/rbac.middleware.js";
import { validate } from "../middlewares/validator.middleware.js";
import { createRoleSchema, updateRoleSchema, patchRoleSchema } from "../schemas/roles.schema.js";

const roleRouter = Router();

// Listar todos los permisos disponibles del sistema
roleRouter.get("/permissions",        authMiddleware, checkPermission("roles.read"),   getAllPermissions);
roleRouter.get("/",                   authMiddleware, checkPermission("roles.read"),   getAllRoles);
roleRouter.get("/:id",               authMiddleware, checkPermission("roles.read"),   getRoleById);
roleRouter.get("/:id/permissions",   authMiddleware, checkPermission("roles.read"),   getRolePermissions);
roleRouter.post("/",                  authMiddleware, checkPermission("roles.create"), validate(createRoleSchema), createRole);
roleRouter.put("/:id",               authMiddleware, checkPermission("roles.update"), validate(updateRoleSchema), updateRoleComplete);
roleRouter.patch("/:id",             authMiddleware, checkPermission("roles.update"), validate(patchRoleSchema),  updateRolePartial);
roleRouter.delete("/:id",            authMiddleware, checkPermission("roles.delete"), deleteRole);

export default roleRouter;
