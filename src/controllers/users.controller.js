import bcrypt from "bcryptjs";
import { UserModel, RoleModel }        from "../models/index.js";
import { buildError, successResponse } from "../utils/index.js";
import { catchAsync }                  from "../utils/index.js";

// ============================================
//      CONTROLADOR DE USUARIOS
// ============================================

// Validacion de ID de parametro de ruta
const parseId = (id) => {
    const parsed = Number(id);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

// Resolucion de nombres de roles a IDs verificados en DB
const resolveRoleIds = async (roleNames, next) => {
    const allRoles = await RoleModel.findAll();
    const roleMap  = new Map(allRoles.map((r) => [r.name, r.id]));

    const roleIds      = [];
    const invalidRoles = [];

    for (const name of roleNames) {
        const id = roleMap.get(name);
        if (id) {
            roleIds.push(id);
        } else {
            invalidRoles.push(name);
        }
    }

    if (invalidRoles.length > 0) {
        next(buildError(
            "Roles invalidos", 400,
            ["Los siguientes roles no existen: " + invalidRoles.join(", ")]
        ));
        return null;
    }

    return roleIds;
};

// ── GET /users ──────────────────────────────────────────────────────────────
export const getAllUsers = catchAsync(async (req, res) => {
    const users = await UserModel.findAll();
    return successResponse(res, 200, "Lista de usuarios obtenida", users);
});

// ── GET /users/:id ──────────────────────────────────────────────────────────
export const getUserById = catchAsync(async (req, res, next) => {
    const id = parseId(req.params.id);
    if (!id) {
        return next(buildError("ID invalido", 400, ["El parametro id debe ser un numero entero positivo."]));
    }

    const user = await UserModel.findById(id);
    if (!user) {
        return next(buildError("Usuario no encontrado", 404, ["No existe un usuario con el ID " + req.params.id]));
    }

    return successResponse(res, 200, "Usuario encontrado", user);
});

// ── POST /users ─────────────────────────────────────────────────────────────
// Validacion Zod se aplica en la ruta antes de llegar aqui (via validate(createUserSchema))
export const createUser = catchAsync(async (req, res, next) => {
    const { document, name, username, password, roles } = req.body;

    // Verificar unicidad de documento
    const existingByDoc = await UserModel.findByDocument(document);
    if (existingByDoc) {
        return next(buildError(
            "Documento duplicado", 409,
            ["Ya existe un usuario con el documento: " + document]
        ));
    }

    // Verificar unicidad de username
    const existingByUsername = await UserModel.findByUsernamePublic(username);
    if (existingByUsername) {
        return next(buildError(
            "Username duplicado", 409,
            ["Ya existe un usuario con el username: " + username]
        ));
    }

    // Resolver nombres de roles a IDs
    const roleIds = await resolveRoleIds(roles, next);
    if (roleIds === null) return;

    const password_hash = await bcrypt.hash(password, 10);

    const newUser = await UserModel.create({ document, name, username, password_hash, roleIds });
    return successResponse(res, 201, "Usuario creado correctamente", newUser);
});

// ── PUT /users/:id ──────────────────────────────────────────────────────────
export const updateUserComplete = catchAsync(async (req, res, next) => {
    const id = parseId(req.params.id);
    if (!id) {
        return next(buildError("ID invalido", 400, ["El parametro id debe ser un numero entero positivo."]));
    }

    const userExists = await UserModel.findById(id);
    if (!userExists) {
        return next(buildError("Usuario no encontrado", 404, ["No existe un usuario con el ID " + req.params.id]));
    }

    const { name, roles } = req.body;

    const roleIds = await resolveRoleIds(roles, next);
    if (roleIds === null) return;

    const updated = await UserModel.update(id, { name, roleIds });
    return successResponse(res, 200, "Usuario actualizado completamente", updated);
});

// ── PATCH /users/:id ────────────────────────────────────────────────────────
export const updateUserPartial = catchAsync(async (req, res, next) => {
    const id = parseId(req.params.id);
    if (!id) {
        return next(buildError("ID invalido", 400, ["El parametro id debe ser un numero entero positivo."]));
    }

    const userExists = await UserModel.findById(id);
    if (!userExists) {
        return next(buildError("Usuario no encontrado", 404, ["No existe un usuario con el ID " + req.params.id]));
    }

    const { name, roles } = req.body;

    let roleIds;
    if (roles !== undefined) {
        roleIds = await resolveRoleIds(roles, next);
        if (roleIds === null) return;
    }

    const patched = await UserModel.patch(id, { name, roleIds });
    return successResponse(res, 200, "Usuario actualizado parcialmente", patched);
});

// ── DELETE /users/:id ───────────────────────────────────────────────────────
export const deleteUser = catchAsync(async (req, res, next) => {
    const id = parseId(req.params.id);
    if (!id) {
        return next(buildError("ID invalido", 400, ["El parametro id debe ser un numero entero positivo."]));
    }

    // No permitir que un usuario se elimine a si mismo
    if (id === req.user.id) {
        return next(buildError(
            "Operacion no permitida", 403,
            ["No puedes eliminar tu propia cuenta de usuario."]
        ));
    }

    const userExists = await UserModel.findById(id);
    if (!userExists) {
        return next(buildError("Usuario no encontrado", 404, ["No existe un usuario con el ID " + req.params.id]));
    }

    await UserModel.delete(id);
    return successResponse(res, 200, "Usuario eliminado correctamente");
});
