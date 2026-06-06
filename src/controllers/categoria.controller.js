//  ============================================
//      CONTROLADOR CENTRADO EN CATEGORÍAS
//  ============================================ 

import { CategoryModel } from "../models/categoria.model.js";
import { buildError, successResponse } from "../utils/response.handler.js";
import { catchAsync } from "../utils/catchAsync.js";

// Trae todas las categorías
export const getAllCategories = catchAsync(async (req, res) => {
    const categories = await CategoryModel.findAll();
    return successResponse(res, 200, "Lista de categorías obtenida", categories);
});

// Trae una categoría por su Id
export const getCategoryById = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const category = await CategoryModel.findById(Number(id));

    if (!category) {
        return next(buildError("Categoría no encontrada", 404, [`Categoría con ID ${id} no encontrada`]));
    }

    return successResponse(res, 200, "Categoría encontrada", category);
});

// Crea una nueva categoría
export const createCategory = catchAsync(async (req, res, next) => {
    const { nombre, descripcion } = req.body;

    if (!nombre) {
        return next(buildError("Error al crear categoría", 400, ["El campo nombre es obligatorio"]));
    }

    const existingCategory = await CategoryModel.findByNombre(nombre);
    if (existingCategory) {
        return next(buildError("Error al crear categoría", 409, [`Ya existe una categoría con el nombre ${nombre}`]));
    }

    const newCategory = await CategoryModel.create({ nombre, descripcion });
    return successResponse(res, 200, "Categoría creada correctamente", newCategory);
});

// Actualiza todos los campos de la categoría ( PUT )
export const updateCategoryComplete = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;

    if (!nombre || !descripcion) {
        return next(buildError("Error al actualizar", 400, ["Nombre y descripcion son obligatorios"]));
    }

    const updatedCategory = await CategoryModel.updateComplete(Number(id), { nombre, descripcion });

    if (!updatedCategory) {
        return next(buildError("Error al actualizar", 404, [`Categoría con ID ${id} no encontrada`]));
    }

    return successResponse(res, 200, "Categoría actualizada completamente", updatedCategory);
});

// Actualiza parcialmente ( PATCH )
export const updateCategoryPartial = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;

    if (!nombre && !descripcion) {
        return next(buildError("Error al actualizar", 400, ["Se requiere al menos un campo para actualizar"]));
    }

    const updatedCategory = await CategoryModel.updatePartial(Number(id), { nombre, descripcion });

    if (!updatedCategory) {
        return next(buildError("Error al actualizar", 404, [`Categoría con ID ${id} no encontrada`]));
    }

    return successResponse(res, 200, "Categoría actualizada parcialmente", updatedCategory);
});

// Elimina una categoría
export const deleteCategory = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const categoryExists = await CategoryModel.findById(Number(id));

    if (!categoryExists) {
        return next(buildError("Error al eliminar categoría", 404, [`No se pudo eliminar: Categoría con ID ${id} no encontrada`]));
    }

    await CategoryModel.delete(Number(id));
    return successResponse(res, 200, "Categoría eliminada correctamente");
});
