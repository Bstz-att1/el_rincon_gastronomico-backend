// ============================================
//   RUTAS DE ROLES (RBAC)
// ============================================
//
// Permisos requeridos:
//   GET    /roles/permissions      → roles.read   (listar todos los permisos del sistema)
//   GET    /roles                  → roles.read   (listar todos los roles)
//   GET    /roles/:id              → roles.read   (obtener un rol por ID)
//   GET    /roles/:id/permissions  → roles.read   (permisos de un rol específico)
//   POST   /roles                  → roles.create
//   PUT    /roles/:id              → roles.update
//   PATCH  /roles/:id              → roles.update
//   DELETE /roles/:id              → roles.delete
//
// IMPORTANTE: La ruta GET /roles/permissions DEBE registrarse ANTES de
// GET /roles/:id para que Express no interprete "permissions" como :id.
// ============================================

import { Router } from "express";
import {
    getAllRoles,
    getAllPermissions,
    getRoleById,
    getRolePermissions,
    createRole,
    updateRoleComplete,
    updateRolePartial,
    deleteRole,
} from "../controllers/index.js";
import { authMiddleware, checkPermission, validate } from "../middlewares/index.js";
import {
    createRoleSchema,
    updateRoleSchema,
    patchRoleSchema,
} from "../schemas/index.js";

const roleRouter = Router();

// Listar todos los permisos disponibles del sistema (debe ir antes de /:id)
roleRouter.get("/permissions",       authMiddleware, checkPermission("roles.read"),   getAllPermissions);

// Listar todos los roles con sus permisos
roleRouter.get("/",                  authMiddleware, checkPermission("roles.read"),   getAllRoles);

// Obtener un rol por ID con sus permisos
roleRouter.get("/:id",               authMiddleware, checkPermission("roles.read"),   getRoleById);

// Obtener los permisos de un rol específico
roleRouter.get("/:id/permissions",   authMiddleware, checkPermission("roles.read"),   getRolePermissions);

// Crear un nuevo rol
roleRouter.post("/",                 authMiddleware, checkPermission("roles.create"), validate(createRoleSchema), createRole);

// Reemplazar datos completos de un rol (PUT)
roleRouter.put("/:id",               authMiddleware, checkPermission("roles.update"), validate(updateRoleSchema), updateRoleComplete);

// Actualizar datos parciales de un rol (PATCH)
roleRouter.patch("/:id",             authMiddleware, checkPermission("roles.update"), validate(patchRoleSchema),  updateRolePartial);

// Eliminar un rol (solo si no es de sistema)
roleRouter.delete("/:id",            authMiddleware, checkPermission("roles.delete"), deleteRole);

export default roleRouter;
