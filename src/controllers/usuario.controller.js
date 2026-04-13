//  ============================================
//      CONTROLADOR CENTRADO EN USUARIOS
//  ============================================ 

import { UserModel } from "../models/usuario.model.js";
import { errorResponse, successResponse } from "../utils/response.handler.js";

// Trae todos los usuarios
export const getAllUsers = async (req, res) => {
    try {
        const users = await UserModel.findAll();
        return successResponse(res, 200, "Lista de usuarios obtenida", users);
    } catch (error) {
        return errorResponse(res, 500, "Error del servidor", error.message)
    }
};

// Trae un usuario por su Id
export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await UserModel.findById(Number(id));

        if (!user) {
            return errorResponse(res, 404, "Usuario no encontrado", `Usuario con ID ${id} no encontrado`)
        }

        return successResponse(res, 200, "Usuario encontrado", user);
    } catch (error) {
        errorResponse(res, 500, "Error del servidor", error.message)
    }
};

// Crea un nuevo usuario
export const createUser = async (req, res) => {
    try {
        const { documento, nombre, rol } = req.body;

        if (!documento || !nombre) {
            return errorResponse(res, 400, "Error al crear usuario", "Los campos documento y nombre son obligatorios")
        }

        const existingUser = await UserModel.findByDocumento(documento);
        if (existingUser) {
            return errorResponse(res, 409, "Error al crear usuario", `Ya existe un usuario con el documento ${documento}`)
        }

        const newUser = await UserModel.create({ documento, nombre, rol });
        return successResponse(res, 200, "Usuario creado correctamente", newUser);
    } catch (error) {
        errorResponse(res, 500, "Error del servidor", error.message)
    }
};

// Actualiza todos los campos del usuario ( PUT )
export const updateUserComplete = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, documento, rol } = req.body;

        // Ambos campos son obligatorios
        if (!nombre || !documento) {
            return errorResponse(res, 400, "Error al actualizar", "Nombre y documento son obligatorios");
        }

        const updatedUser = await UserModel.updateComplete(Number(id), { nombre, rol });

        if (!updatedUser) {
            return errorResponse(res, 404, "Error al actualizar", `Usuario con ID ${id} no encontrado`);
        }

        return successResponse(res, 200, "Usuario actualizado completamente", updatedUser);
    } catch (error) {
        errorResponse(res, 500, "Error del servidor", error.message);
    }
};

// Actualiza parcialcialmente ( PATCH )
export const updateUserPartial = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, rol } = req.body;

        // Validación parcial
        if (!nombre && !rol) {
            return errorResponse(res, 400, "Error al actualizar", "Se requiere al menos un campo para actualizar");
        }

        const updatedUser = await UserModel.updatePartial(Number(id), { nombre, rol });

        if (!updatedUser) {
            return errorResponse(res, 404, "Error al actualizar", `Usuario con ID ${id} no encontrado`);
        }

        return successResponse(res, 200, "Usuario actualizado parcialmente", updatedUser);
    } catch (error) {
        errorResponse(res, 500, "Error del servidor", error.message);
    }
};

// Elimina un usuario
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const userExists = await UserModel.findById(Number(id));

        if (!userExists) {
            return errorResponse(res, 404, "Error al eliminar usuario", `No se pudo eliminar: Usuario con ID ${id} no encontrado`)
        }

        await UserModel.delete(Number(id));
        return successResponse(res, 200, "Usuario eliminado correctamente");
    } catch (error) {
        errorResponse(res, 500, "Error del servidor", error.message)
    }
};