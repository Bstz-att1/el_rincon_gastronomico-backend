import { RoleModel }                  from "../models/index.js";
import { buildError, successResponse } from "../utils/index.js";
import { catchAsync }                  from "../utils/index.js";

// ============================================
//   CONTROLADOR DE ROLES (RBAC)
// ============================================
//
// Gestiona los roles y los permisos del sistema RBAC.
//
// Restricciones de seguridad:
//   - Los roles con is_system=1 NO pueden modificarse ni eliminarse.
//   - Los permisos se referencian por código (ej: "products.read") y
//     se convierten a IDs validados en DB antes de persistir.
//
// La validación del body (Zod) se aplica en la capa de rutas.
// ============================================

/**
 * Convierte y valida un parámetro de ruta :id a entero positivo.
 * @param {string} id - Valor del parámetro de ruta.
 * @returns {number|null} Número entero positivo, o null si es inválido.
 */
const parseId = (id) => {
    const parsed = Number(id);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

/**
 * Convierte un array de códigos de permisos a sus IDs en DB.
 * Si algún código no existe, llama a next(err) y retorna null.
 *
 * @param {string[]} codes - Códigos de permiso (ej: ["products.read", "users.create"]).
 * @param {Function} next  - Función next de Express para propagar errores.
 * @returns {Promise<number[]|null>} Array de IDs o null si hay códigos inválidos.
 */
const resolvePermissionIds = async (codes, next) => {
    const found      = await RoleModel.findPermissionsByCodes(codes);
    const foundCodes = new Set(found.map((p) => p.code));
    const missing    = codes.filter((code) => !foundCodes.has(code));

    if (missing.length > 0) {
        next(buildError(
            "Permisos invalidos", 400,
            [`Los siguientes codigos de permiso no existen: ${missing.join(", ")}.`]
        ));
        return null;
    }

    return found.map((p) => p.id);
};

// ── GET /roles/permissions ───────────────────────────────────────────────────
/**
 * Devuelve todos los permisos disponibles en el sistema, agrupados por recurso.
 * Útil para el frontend al construir formularios de asignación de permisos.
 * Requiere permiso: roles.read
 *
 * NOTA: Esta ruta DEBE registrarse ANTES de GET /roles/:id en el router,
 * para que Express no interprete "permissions" como un :id.
 */
export const getAllPermissions = catchAsync(async (_req, res) => {
    const permissions = await RoleModel.findAllPermissions();
    return successResponse(res, 200, "Lista de permisos disponibles", permissions);
});

// ── GET /roles ───────────────────────────────────────────────────────────────
/**
 * Devuelve todos los roles con sus permisos agregados.
 * Requiere permiso: roles.read
 */
export const getAllRoles = catchAsync(async (_req, res) => {
    const roles = await RoleModel.findAll();
    return successResponse(res, 200, "Lista de roles obtenida", roles);
});

// ── GET /roles/:id ───────────────────────────────────────────────────────────
/**
 * Devuelve un rol por su ID, incluyendo sus permisos.
 * Requiere permiso: roles.read
 */
export const getRoleById = catchAsync(async (req, res, next) => {
    const id = parseId(req.params.id);
    if (!id) {
        return next(buildError("ID invalido", 400, ["El parametro id debe ser un entero positivo."]));
    }

    const role = await RoleModel.findById(id);
    if (!role) {
        return next(buildError(
            "Rol no encontrado", 404,
            [`No existe un rol con el ID ${req.params.id}.`]
        ));
    }

    return successResponse(res, 200, "Rol encontrado", role);
});

// ── GET /roles/:id/permissions ───────────────────────────────────────────────
/**
 * Devuelve la lista de permisos asignados a un rol específico.
 * Requiere permiso: roles.read
 */
export const getRolePermissions = catchAsync(async (req, res, next) => {
    const id = parseId(req.params.id);
    if (!id) {
        return next(buildError("ID invalido", 400, ["El parametro id debe ser un entero positivo."]));
    }

    const role = await RoleModel.findById(id);
    if (!role) {
        return next(buildError(
            "Rol no encontrado", 404,
            [`No existe un rol con el ID ${req.params.id}.`]
        ));
    }

    const permissions = await RoleModel.findPermissionsByRoleId(id);
    return successResponse(res, 200, "Permisos del rol obtenidos", permissions);
});

// ── POST /roles ──────────────────────────────────────────────────────────────
/**
 * Crea un nuevo rol con los permisos indicados.
 * Los permisos se envían como array de códigos (strings) y se convierten a IDs.
 * Requiere permiso: roles.create
 *
 * @body {string}   name          - Nombre único del rol.
 * @body {string}   [description] - Descripción opcional.
 * @body {string[]} permissions   - Array de códigos de permiso (ej: ["products.read"]).
 */
export const createRole = catchAsync(async (req, res, next) => {
    const { name, description, permissions } = req.body;

    // Verificar que el nombre no esté en uso
    const existing = await RoleModel.findByName(name);
    if (existing) {
        return next(buildError(
            "Rol duplicado", 409,
            [`Ya existe un rol con el nombre: "${name}".`]
        ));
    }

    const permissionIds = await resolvePermissionIds(permissions, next);
    if (permissionIds === null) return;

    const newRole = await RoleModel.create({ name, description, permissionIds });
    return successResponse(res, 201, "Rol creado correctamente", newRole);
});

// ── PUT /roles/:id ───────────────────────────────────────────────────────────
/**
 * Reemplaza completamente los datos de un rol (nombre, descripción y permisos).
 * No aplica a roles del sistema (is_system=1).
 * Requiere permiso: roles.update
 *
 * @body {string}   name          - Nuevo nombre.
 * @body {string}   [description] - Nueva descripción.
 * @body {string[]} permissions   - Nuevo array de códigos de permisos.
 */
export const updateRoleComplete = catchAsync(async (req, res, next) => {
    const id = parseId(req.params.id);
    if (!id) {
        return next(buildError("ID invalido", 400, ["El parametro id debe ser un entero positivo."]));
    }

    const roleExists = await RoleModel.findById(id);
    if (!roleExists) {
        return next(buildError(
            "Rol no encontrado", 404,
            [`No existe un rol con el ID ${req.params.id}.`]
        ));
    }

    // Bloquear modificación de roles del sistema
    if (roleExists.is_system) {
        return next(buildError(
            "Operacion no permitida", 403,
            ["Los roles del sistema (is_system=1) no pueden ser modificados."]
        ));
    }

    const { name, description, permissions } = req.body;

    // Verificar nombre único solo si cambió
    if (name !== roleExists.name) {
        const duplicate = await RoleModel.findByName(name);
        if (duplicate) {
            return next(buildError(
                "Rol duplicado", 409,
                [`Ya existe un rol con el nombre: "${name}".`]
            ));
        }
    }

    const permissionIds = await resolvePermissionIds(permissions, next);
    if (permissionIds === null) return;

    const updated = await RoleModel.update(id, { name, description, permissionIds });
    return successResponse(res, 200, "Rol actualizado completamente", updated);
});

// ── PATCH /roles/:id ─────────────────────────────────────────────────────────
/**
 * Actualiza parcialmente un rol. Solo los campos enviados se modifican.
 * No aplica a roles del sistema (is_system=1).
 * Requiere permiso: roles.update
 *
 * @body {string}   [name]        - Nuevo nombre.
 * @body {string}   [description] - Nueva descripción.
 * @body {string[]} [permissions] - Nuevo array de códigos de permisos.
 */
export const updateRolePartial = catchAsync(async (req, res, next) => {
    const id = parseId(req.params.id);
    if (!id) {
        return next(buildError("ID invalido", 400, ["El parametro id debe ser un entero positivo."]));
    }

    const roleExists = await RoleModel.findById(id);
    if (!roleExists) {
        return next(buildError(
            "Rol no encontrado", 404,
            [`No existe un rol con el ID ${req.params.id}.`]
        ));
    }

    // Bloquear modificación de roles del sistema
    if (roleExists.is_system) {
        return next(buildError(
            "Operacion no permitida", 403,
            ["Los roles del sistema (is_system=1) no pueden ser modificados."]
        ));
    }

    const { name, description, permissions } = req.body;

    // Verificar nombre único solo si se envió un nombre diferente
    if (name && name !== roleExists.name) {
        const duplicate = await RoleModel.findByName(name);
        if (duplicate) {
            return next(buildError(
                "Rol duplicado", 409,
                [`Ya existe un rol con el nombre: "${name}".`]
            ));
        }
    }

    // Resolver permisos solo si se enviaron
    let permissionIds;
    if (permissions !== undefined) {
        permissionIds = await resolvePermissionIds(permissions, next);
        if (permissionIds === null) return;
    }

    const patched = await RoleModel.update(id, { name, description, permissionIds });
    return successResponse(res, 200, "Rol actualizado parcialmente", patched);
});

// ── DELETE /roles/:id ────────────────────────────────────────────────────────
/**
 * Elimina un rol por su ID.
 * No aplica a roles del sistema (is_system=1).
 * Requiere permiso: roles.delete
 */
export const deleteRole = catchAsync(async (req, res, next) => {
    const id = parseId(req.params.id);
    if (!id) {
        return next(buildError("ID invalido", 400, ["El parametro id debe ser un entero positivo."]));
    }

    const roleExists = await RoleModel.findById(id);
    if (!roleExists) {
        return next(buildError(
            "Rol no encontrado", 404,
            [`No existe un rol con el ID ${req.params.id}.`]
        ));
    }

    // Bloquear eliminación de roles del sistema
    if (roleExists.is_system) {
        return next(buildError(
            "Operacion no permitida", 403,
            ["Los roles del sistema (is_system=1) no pueden ser eliminados."]
        ));
    }

    await RoleModel.delete(id);
    return successResponse(res, 200, "Rol eliminado correctamente");
});
