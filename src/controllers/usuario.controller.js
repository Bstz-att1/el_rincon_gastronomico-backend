//  ============================================
//      CONTROLADOR CENTRADO EN USUARIOS
//  ============================================ 

import bcrypt from "bcryptjs";
import { UserModel } from "../models/usuario.model.js";
import { buildError, successResponse } from "../utils/response.handler.js";
import { catchAsync } from "../utils/catchAsync.js";

// Trae todos los usuarios
export const getAllUsers = catchAsync(async (req, res) => {
    const users = await UserModel.findAll();
    return successResponse(res, 200, "Lista de usuarios obtenida", users);
});

// Trae un usuario por su Id
export const getUserById = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const user = await UserModel.findById(Number(id));

    if (!user) {
        return next(buildError("Usuario no encontrado", 404, [`Usuario con ID ${id} no encontrado`]));
    }

    return successResponse(res, 200, "Usuario encontrado", user);
});

// Crea un nuevo usuario
export const createUser = catchAsync(async (req, res, next) => {
    const { documento, nombre, username, password, rol } = req.body;

    if (!documento || !nombre || !username || !password) {
        return next(
            buildError(
                "Error al crear usuario",
                400,
                ["Los campos documento, nombre, username y password son obligatorios"]
            )
        );
    }

    const existingUserByDoc = await UserModel.findByDocumento(documento);
    if (existingUserByDoc) {
        return next(buildError("Error al crear usuario", 409, [`Ya existe un usuario con el documento ${documento}`]));
    }

    const existingUserByUsername = await UserModel.findByUsername(username);
    if (existingUserByUsername) {
        return next(buildError("Error al crear usuario", 409, [`Ya existe un usuario con el username ${username}`]));
    }

    const password_hash = await bcrypt.hash(password, 10);

    const newUser = await UserModel.create({
        documento,
        nombre,
        username,
        password_hash,
        rol: rol || "user",
    });

    return successResponse(res, 200, "Usuario creado correctamente", newUser);
});

// Actualiza todos los campos del usuario ( PUT )
export const updateUserComplete = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { nombre, documento, rol } = req.body;

    if (!nombre || !documento) {
        return next(buildError("Error al actualizar", 400, ["Nombre y documento son obligatorios"]));
    }

    const updatedUser = await UserModel.updateComplete(Number(id), { nombre, rol });

    if (!updatedUser) {
        return next(buildError("Error al actualizar", 404, [`Usuario con ID ${id} no encontrado`]));
    }

    return successResponse(res, 200, "Usuario actualizado completamente", updatedUser);
});

// Actualiza parcialmente ( PATCH )
export const updateUserPartial = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { nombre, rol } = req.body;

    if (!nombre && !rol) {
        return next(buildError("Error al actualizar", 400, ["Se requiere al menos un campo para actualizar"]));
    }

    const updatedUser = await UserModel.updatePartial(Number(id), { nombre, rol });

    if (!updatedUser) {
        return next(buildError("Error al actualizar", 404, [`Usuario con ID ${id} no encontrado`]));
    }

    return successResponse(res, 200, "Usuario actualizado parcialmente", updatedUser);
});

// Elimina un usuario
export const deleteUser = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const userExists = await UserModel.findById(Number(id));

    if (!userExists) {
        return next(buildError("Error al eliminar usuario", 404, [`No se pudo eliminar: Usuario con ID ${id} no encontrado`]));
    }

    await UserModel.delete(Number(id));
    return successResponse(res, 200, "Usuario eliminado correctamente");
});
