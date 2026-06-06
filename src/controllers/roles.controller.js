import { RoleModel } from "../models/roles.model.js";
import { buildError, successResponse } from "../utils/response.handler.js";
import { catchAsync } from "../utils/catchAsync.js";

// ============================================
//      CONTROLADOR DE ROLES (RBAC)
// ============================================

const parseId = (id) => { const parsed = Number(id); return Number.isInteger(parsed) && parsed > 0 ? parsed : null; };

// Resolucion de codigos de permisos a IDs verificados en DB
const resolvePermissionIds = async (codes, next) => {
    const found = await RoleModel.findPermissionsByCodes(codes);
    const foundCodes = new Set(found.map((p) => p.code));
    const missing = codes.filter((code) => !foundCodes.has(code));
    if (missing.length > 0) {
        next(buildError("Permisos invalidos", 400, ["Los siguientes codigos de permiso no existen: " + missing.join(", ")]));
        return null;
    }
    return found.map((p) => p.id);
};

// GET /roles
export const getAllRoles = catchAsync(async (req, res) => {
    const roles = await RoleModel.findAll();
    return successResponse(res, 200, "Lista de roles obtenida", roles);
});

// GET /roles/permissions -- listar todos los permisos disponibles
export const getAllPermissions = catchAsync(async (req, res) => {
    const permissions = await RoleModel.findAllPermissions();
    return successResponse(res, 200, "Lista de permisos disponibles", permissions);
});

// GET /roles/:id
export const getRoleById = catchAsync(async (req, res, next) => {
    const id = parseId(req.params.id);
    if (!id) return next(buildError("ID invalido", 400, ["El parametro id debe ser un entero positivo."]));
    const role = await RoleModel.findById(id);
    if (!role) return next(buildError("Rol no encontrado", 404, ["No existe un rol con el ID " + req.params.id]));
    return successResponse(res, 200, "Rol encontrado", role);
});

// GET /roles/:id/permissions
export const getRolePermissions = catchAsync(async (req, res, next) => {
    const id = parseId(req.params.id);
    if (!id) return next(buildError("ID invalido", 400, ["El parametro id debe ser un entero positivo."]));
    const role = await RoleModel.findById(id);
    if (!role) return next(buildError("Rol no encontrado", 404, ["No existe un rol con el ID " + req.params.id]));
    const permissions = await RoleModel.findPermissionsByRoleId(id);
    return successResponse(res, 200, "Permisos del rol obtenidos", permissions);
});

// POST /roles
export const createRole = catchAsync(async (req, res, next) => {
    const { name, description, permissions } = req.body;
    const existing = await RoleModel.findByName(name);
    if (existing) return next(buildError("Rol duplicado", 409, ["Ya existe un rol con el nombre: " + name]));
    const permissionIds = await resolvePermissionIds(permissions, next);
    if (permissionIds === null) return;
    const newRole = await RoleModel.create({ name, description, permissionIds });
    return successResponse(res, 201, "Rol creado correctamente", newRole);
});

// PUT /roles/:id
export const updateRoleComplete = catchAsync(async (req, res, next) => {
    const id = parseId(req.params.id);
    if (!id) return next(buildError("ID invalido", 400, ["El parametro id debe ser un entero positivo."]));
    const roleExists = await RoleModel.findById(id);
    if (!roleExists) return next(buildError("Rol no encontrado", 404, ["No existe un rol con el ID " + req.params.id]));
    if (roleExists.is_system) return next(buildError("Operacion no permitida", 403, ["Los roles del sistema no pueden ser modificados."]));
    const { name, description, permissions } = req.body;
    if (name !== roleExists.name) {
        const duplicate = await RoleModel.findByName(name);
        if (duplicate) return next(buildError("Rol duplicado", 409, ["Ya existe un rol con el nombre: " + name]));
    }
    const permissionIds = await resolvePermissionIds(permissions, next);
    if (permissionIds === null) return;
    const updated = await RoleModel.update(id, { name, description, permissionIds });
    return successResponse(res, 200, "Rol actualizado completamente", updated);
});

// PATCH /roles/:id
export const updateRolePartial = catchAsync(async (req, res, next) => {
    const id = parseId(req.params.id);
    if (!id) return next(buildError("ID invalido", 400, ["El parametro id debe ser un entero positivo."]));
    const roleExists = await RoleModel.findById(id);
    if (!roleExists) return next(buildError("Rol no encontrado", 404, ["No existe un rol con el ID " + req.params.id]));
    if (roleExists.is_system) return next(buildError("Operacion no permitida", 403, ["Los roles del sistema no pueden ser modificados."]));
    const { name, description, permissions } = req.body;
    if (name && name !== roleExists.name) {
        const duplicate = await RoleModel.findByName(name);
        if (duplicate) return next(buildError("Rol duplicado", 409, ["Ya existe un rol con el nombre: " + name]));
    }
    let permissionIds;
    if (permissions !== undefined) {
        permissionIds = await resolvePermissionIds(permissions, next);
        if (permissionIds === null) return;
    }
    const patched = await RoleModel.update(id, { name, description, permissionIds });
    return successResponse(res, 200, "Rol actualizado parcialmente", patched);
});

// DELETE /roles/:id
export const deleteRole = catchAsync(async (req, res, next) => {
    const id = parseId(req.params.id);
    if (!id) return next(buildError("ID invalido", 400, ["El parametro id debe ser un entero positivo."]));
    const roleExists = await RoleModel.findById(id);
    if (!roleExists) return next(buildError("Rol no encontrado", 404, ["No existe un rol con el ID " + req.params.id]));
    if (roleExists.is_system) return next(buildError("Operacion no permitida", 403, ["Los roles del sistema (is_system=1) no pueden ser eliminados."]));
    await RoleModel.delete(id);
    return successResponse(res, 200, "Rol eliminado correctamente");
});
