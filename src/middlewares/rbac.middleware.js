import { RoleModel } from "../models/roles.model.js";
import { buildError, buildUnauthorizedError } from "../utils/response.handler.js";
import { catchAsync } from "../utils/catchAsync.js";

// ============================================
//   MIDDLEWARE RBAC -- CONTROL DE ACCESO
// ============================================

/**
 * Verifica que el usuario autenticado tenga el permiso requerido.
 *
 * Proceso:
 *  1. Obtiene todos los permisos del usuario desde DB (via roles asignados).
 *  2. Almacena los permisos en req.user.permissions para trazabilidad.
 *  3. Verifica si el codigo de permiso requerido esta en la lista.
 *
 * IMPORTANTE: Debe usarse DESPUES de authMiddleware.
 *
 * Codigos de permisos disponibles (patron: resource.action):
 *   users.*       - users.read, users.create, users.update, users.delete
 *   roles.*       - roles.read, roles.create, roles.update, roles.delete
 *   categories.*  - categories.read, categories.create, categories.update, categories.delete
 *   products.*    - products.read, products.create, products.update, products.delete
 *   audit.*       - audit.read, audit.create
 *
 * @param {string} requiredPermission - Codigo del permiso (ej: "products.create").
 * @returns {import("express").RequestHandler}
 *
 * @example
 * router.post("/", authMiddleware, checkPermission("products.create"), createProduct);
 */
export const checkPermission = (requiredPermission) =>
    catchAsync(async (req, res, next) => {
        const userId = req.user?.id;

        if (!userId) {
            return next(buildUnauthorizedError(
                "No se encontro informacion del usuario en la solicitud. Use authMiddleware primero."
            ));
        }

        // Obtener permisos completos (code + resource) para trazabilidad
        const permissions = await RoleModel.getPermissionsByUserId(userId);
        req.user.permissions = permissions;

        // Normalizar a codigos para verificacion de acceso
        const permissionCodes = permissions.map((p) => p.code);
        const hasPermission = permissionCodes.includes(requiredPermission);

        if (!hasPermission) {
            return next(buildError(
                "Acceso denegado", 403,
                [`No tienes permiso para realizar esta accion: "${requiredPermission}".`]
            ));
        }

        next();
    });