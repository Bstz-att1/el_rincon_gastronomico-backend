import { CategoryModel } from "../models/categories.model.js";
import { buildError, successResponse } from "../utils/response.handler.js";
import { catchAsync } from "../utils/catchAsync.js";

// ============================================
//      CONTROLADOR DE CATEGORIAS
// ============================================

const parseId = (id) => {
    const parsed = Number(id);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

export const getAllCategories = catchAsync(async (req, res) => {
    const categories = await CategoryModel.findAll();
    return successResponse(res, 200, "Lista de categorias obtenida", categories);
});

export const getCategoryById = catchAsync(async (req, res, next) => {
    const id = parseId(req.params.id);
    if (!id) return next(buildError("ID invalido", 400, ["El parametro id debe ser un entero positivo."]));
    const category = await CategoryModel.findById(id);
    if (!category) return next(buildError("Categoria no encontrada", 404, ["No existe una categoria con el ID " + req.params.id]));
    return successResponse(res, 200, "Categoria encontrada", category);
});

export const createCategory = catchAsync(async (req, res, next) => {
    const { name, description } = req.body;
    const existing = await CategoryModel.findByName(name);
    if (existing) return next(buildError("Categoria duplicada", 409, ["Ya existe una categoria con el nombre: " + name]));
    const newCategory = await CategoryModel.create({ name, description });
    return successResponse(res, 201, "Categoria creada correctamente", newCategory);
});

export const updateCategoryComplete = catchAsync(async (req, res, next) => {
    const id = parseId(req.params.id);
    if (!id) return next(buildError("ID invalido", 400, ["El parametro id debe ser un entero positivo."]));
    const categoryExists = await CategoryModel.findById(id);
    if (!categoryExists) return next(buildError("Categoria no encontrada", 404, ["No existe una categoria con el ID " + req.params.id]));
    const { name, description } = req.body;
    if (name !== categoryExists.name) {
        const duplicate = await CategoryModel.findByName(name);
        if (duplicate) return next(buildError("Categoria duplicada", 409, ["Ya existe una categoria con el nombre: " + name]));
    }
    const updated = await CategoryModel.update(id, { name, description });
    return successResponse(res, 200, "Categoria actualizada completamente", updated);
});

export const updateCategoryPartial = catchAsync(async (req, res, next) => {
    const id = parseId(req.params.id);
    if (!id) return next(buildError("ID invalido", 400, ["El parametro id debe ser un entero positivo."]));
    const categoryExists = await CategoryModel.findById(id);
    if (!categoryExists) return next(buildError("Categoria no encontrada", 404, ["No existe una categoria con el ID " + req.params.id]));
    const { name, description } = req.body;
    if (name && name !== categoryExists.name) {
        const duplicate = await CategoryModel.findByName(name);
        if (duplicate) return next(buildError("Categoria duplicada", 409, ["Ya existe una categoria con el nombre: " + name]));
    }
    const patched = await CategoryModel.patch(id, { name, description });
    return successResponse(res, 200, "Categoria actualizada parcialmente", patched);
});

export const deleteCategory = catchAsync(async (req, res, next) => {
    const id = parseId(req.params.id);
    if (!id) return next(buildError("ID invalido", 400, ["El parametro id debe ser un entero positivo."]));
    const categoryExists = await CategoryModel.findById(id);
    if (!categoryExists) return next(buildError("Categoria no encontrada", 404, ["No existe una categoria con el ID " + req.params.id]));
    await CategoryModel.delete(id);
    return successResponse(res, 200, "Categoria eliminada correctamente");
});
