import { CategoryModel } from "../models/categories.model.js";
import { buildError, successResponse } from "../utils/response.handler.js";
import { catchAsync } from "../utils/catchAsync.js";

// ============================================
//   CONTROLADOR DE CATEGORÍAS
// ============================================
//
// CRUD completo sobre la tabla categories.
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

// ── GET /categories ──────────────────────────────────────────────────────────
/**
 * Devuelve todas las categorías, ordenadas alfabéticamente por nombre.
 * Requiere permiso: categories.read
 */
export const getAllCategories = catchAsync(async (_req, res) => {
    const categories = await CategoryModel.findAll();
    return successResponse(res, 200, "Lista de categorias obtenida", categories);
});

// ── GET /categories/:id ──────────────────────────────────────────────────────
/**
 * Devuelve una categoría por su ID.
 * Requiere permiso: categories.read
 */
export const getCategoryById = catchAsync(async (req, res, next) => {
    const id = parseId(req.params.id);
    if (!id) {
        return next(buildError("ID invalido", 400, ["El parametro id debe ser un entero positivo."]));
    }

    const category = await CategoryModel.findById(id);
    if (!category) {
        return next(buildError(
            "Categoria no encontrada", 404,
            [`No existe una categoria con el ID ${req.params.id}.`]
        ));
    }

    return successResponse(res, 200, "Categoria encontrada", category);
});

// ── POST /categories ─────────────────────────────────────────────────────────
/**
 * Crea una nueva categoría.
 * Valida que el nombre no esté duplicado antes de insertar.
 * Requiere permiso: categories.create
 *
 * @body {string} name        - Nombre de la categoría (único).
 * @body {string} [description] - Descripción opcional.
 */
export const createCategory = catchAsync(async (req, res, next) => {
    const { name, description } = req.body;

    // Verificar unicidad del nombre
    const existing = await CategoryModel.findByName(name);
    if (existing) {
        return next(buildError(
            "Categoria duplicada", 409,
            [`Ya existe una categoria con el nombre: "${name}".`]
        ));
    }

    const newCategory = await CategoryModel.create({ name, description });
    return successResponse(res, 201, "Categoria creada correctamente", newCategory);
});

// ── PUT /categories/:id ──────────────────────────────────────────────────────
/**
 * Reemplaza completamente los datos de una categoría existente.
 * Requiere permiso: categories.update
 *
 * @body {string} name        - Nuevo nombre (obligatorio en PUT).
 * @body {string} description - Nueva descripción (obligatoria en PUT).
 */
export const updateCategoryComplete = catchAsync(async (req, res, next) => {
    const id = parseId(req.params.id);
    if (!id) {
        return next(buildError("ID invalido", 400, ["El parametro id debe ser un entero positivo."]));
    }

    const categoryExists = await CategoryModel.findById(id);
    if (!categoryExists) {
        return next(buildError(
            "Categoria no encontrada", 404,
            [`No existe una categoria con el ID ${req.params.id}.`]
        ));
    }

    const { name, description } = req.body;

    // Verificar nombre único solo si cambió respecto al actual
    if (name !== categoryExists.name) {
        const duplicate = await CategoryModel.findByName(name);
        if (duplicate) {
            return next(buildError(
                "Categoria duplicada", 409,
                [`Ya existe una categoria con el nombre: "${name}".`]
            ));
        }
    }

    const updated = await CategoryModel.update(id, { name, description });
    return successResponse(res, 200, "Categoria actualizada completamente", updated);
});

// ── PATCH /categories/:id ────────────────────────────────────────────────────
/**
 * Actualiza parcialmente una categoría. Solo los campos enviados se modifican.
 * Requiere permiso: categories.update
 *
 * @body {string} [name]        - Nuevo nombre (opcional).
 * @body {string} [description] - Nueva descripción (opcional).
 */
export const updateCategoryPartial = catchAsync(async (req, res, next) => {
    const id = parseId(req.params.id);
    if (!id) {
        return next(buildError("ID invalido", 400, ["El parametro id debe ser un entero positivo."]));
    }

    const categoryExists = await CategoryModel.findById(id);
    if (!categoryExists) {
        return next(buildError(
            "Categoria no encontrada", 404,
            [`No existe una categoria con el ID ${req.params.id}.`]
        ));
    }

    const { name, description } = req.body;

    // Verificar nombre único solo si se envió un nombre diferente al actual
    if (name && name !== categoryExists.name) {
        const duplicate = await CategoryModel.findByName(name);
        if (duplicate) {
            return next(buildError(
                "Categoria duplicada", 409,
                [`Ya existe una categoria con el nombre: "${name}".`]
            ));
        }
    }

    const patched = await CategoryModel.patch(id, { name, description });
    return successResponse(res, 200, "Categoria actualizada parcialmente", patched);
});

// ── DELETE /categories/:id ───────────────────────────────────────────────────
/**
 * Elimina una categoría por su ID.
 * Nota: Si la categoría tiene productos asociados, la BD rechazará la operación
 * por restricción de clave foránea (FK en products.category_id).
 * Requiere permiso: categories.delete
 */
export const deleteCategory = catchAsync(async (req, res, next) => {
    const id = parseId(req.params.id);
    if (!id) {
        return next(buildError("ID invalido", 400, ["El parametro id debe ser un entero positivo."]));
    }

    const categoryExists = await CategoryModel.findById(id);
    if (!categoryExists) {
        return next(buildError(
            "Categoria no encontrada", 404,
            [`No existe una categoria con el ID ${req.params.id}.`]
        ));
    }

    await CategoryModel.delete(id);
    return successResponse(res, 200, "Categoria eliminada correctamente");
});
