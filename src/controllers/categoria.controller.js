//  ============================================
//      CONTROLADOR CENTRADO EN CATEGORÍAS
//  ============================================ 

import { CategoryModel } from "../models/categoria.model.js";
import { errorResponse, successResponse } from "../utils/response.handler.js";

// Trae todas las categorías
export const getAllCategories = async (req, res) => {
    try {
        const categories = await CategoryModel.findAll();
        return successResponse(res, 200, "Lista de categorías obtenida", categories);
    } catch (error) {
        return errorResponse(res, 500, "Error del servidor", error.message);
    }
};

// Trae una categoría por su Id
export const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await CategoryModel.findById(Number(id));

        if (!category) {
            return errorResponse(res, 404, "Categoría no encontrada", `Categoría con ID ${id} no encontrada`);
        }

        return successResponse(res, 200, "Categoría encontrada", category);
    } catch (error) {
        return errorResponse(res, 500, "Error del servidor", error.message);
    }
};

// Crea una nueva categoría
export const createCategory = async (req, res) => {
    try {
        const { nombre, descripcion } = req.body;

        if (!nombre) {
            return errorResponse(res, 400, "Error al crear categoría", "El campo nombre es obligatorio");
        }

        const existingCategory = await CategoryModel.findByNombre(nombre);
        if (existingCategory) {
            return errorResponse(res, 409, "Error al crear categoría", `Ya existe una categoría con el nombre ${nombre}`);
        }

        const newCategory = await CategoryModel.create({ nombre, descripcion });
        return successResponse(res, 200, "Categoría creada correctamente", newCategory);
    } catch (error) {
        return errorResponse(res, 500, "Error del servidor", error.message);
    }
};

// Actualiza todos los campos de la categoría ( PUT )
export const updateCategoryComplete = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion } = req.body;

        // Ambos campos son obligatorios
        if (!nombre || !descripcion) {
            return errorResponse(res, 400, "Error al actualizar", "Nombre y descripcion son obligatorios");
        }

        const updatedCategory = await CategoryModel.updateComplete(Number(id), { nombre, descripcion });

        if (!updatedCategory) {
            return errorResponse(res, 404, "Error al actualizar", `Categoría con ID ${id} no encontrada`);
        }

        return successResponse(res, 200, "Categoría actualizada completamente", updatedCategory);
    } catch (error) {
        return errorResponse(res, 500, "Error del servidor", error.message);
    }
};

// Actualiza parcialmente ( PATCH )
export const updateCategoryPartial = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion } = req.body;

        // Validación parcial
        if (!nombre && !descripcion) {
            return errorResponse(res, 400, "Error al actualizar", "Se requiere al menos un campo para actualizar");
        }

        const updatedCategory = await CategoryModel.updatePartial(Number(id), { nombre, descripcion });

        if (!updatedCategory) {
            return errorResponse(res, 404, "Error al actualizar", `Categoría con ID ${id} no encontrada`);
        }

        return successResponse(res, 200, "Categoría actualizada parcialmente", updatedCategory);
    } catch (error) {
        return errorResponse(res, 500, "Error del servidor", error.message);
    }
};

// Elimina una categoría
export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const categoryExists = await CategoryModel.findById(Number(id));

        if (!categoryExists) {
            return errorResponse(res, 404, "Error al eliminar categoría", `No se pudo eliminar: Categoría con ID ${id} no encontrada`);
        }

        await CategoryModel.delete(Number(id));
        return successResponse(res, 200, "Categoría eliminada correctamente");
    } catch (error) {
        return errorResponse(res, 500, "Error del servidor", error.message);
    }
};
