import { ProductModel }  from "../models/products.model.js";
import { CategoryModel } from "../models/categories.model.js";
import { buildError, successResponse } from "../utils/response.handler.js";
import { catchAsync } from "../utils/catchAsync.js";

// ============================================
//   CONTROLADOR DE PRODUCTOS
// ============================================
//
// CRUD completo sobre la tabla products.
// Cada producto pertenece a una categoría (FK category_id).
// Se verifica que la categoría exista antes de crear o actualizar.
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

// ── GET /products ────────────────────────────────────────────────────────────
/**
 * Devuelve todos los productos con el nombre de su categoría, ordenados por nombre.
 * Requiere permiso: products.read
 */
export const getAllProducts = catchAsync(async (_req, res) => {
    const products = await ProductModel.findAll();
    return successResponse(res, 200, "Lista de productos obtenida", products);
});

// ── GET /products/:id ────────────────────────────────────────────────────────
/**
 * Devuelve un producto por su ID, incluyendo el nombre de la categoría.
 * Requiere permiso: products.read
 */
export const getProductById = catchAsync(async (req, res, next) => {
    const id = parseId(req.params.id);
    if (!id) {
        return next(buildError("ID invalido", 400, ["El parametro id debe ser un entero positivo."]));
    }

    const product = await ProductModel.findById(id);
    if (!product) {
        return next(buildError(
            "Producto no encontrado", 404,
            [`No existe un producto con el ID ${req.params.id}.`]
        ));
    }

    return successResponse(res, 200, "Producto encontrado", product);
});

// ── POST /products ───────────────────────────────────────────────────────────
/**
 * Crea un nuevo producto.
 * Verifica que la categoría indicada exista antes de insertar.
 * Requiere permiso: products.create
 *
 * @body {string} name         - Nombre del producto.
 * @body {string} [description] - Descripción opcional.
 * @body {number} category_id  - ID de la categoría a la que pertenece.
 * @body {number} [quantity=0] - Cantidad en stock (por defecto 0).
 */
export const createProduct = catchAsync(async (req, res, next) => {
    const { name, description, category_id, quantity } = req.body;

    // Verificar que la categoría existe antes de crear el producto
    const catExists = await CategoryModel.findById(category_id);
    if (!catExists) {
        return next(buildError(
            "Categoria no encontrada", 404,
            [`No existe una categoria con el ID ${category_id}.`]
        ));
    }

    const newProduct = await ProductModel.create({ name, description, category_id, quantity });
    return successResponse(res, 201, "Producto creado correctamente", newProduct);
});

// ── PUT /products/:id ────────────────────────────────────────────────────────
/**
 * Reemplaza completamente los datos de un producto existente.
 * Todos los campos son obligatorios (ver updateProductSchema).
 * Requiere permiso: products.update
 *
 * @body {string} name        - Nombre del producto.
 * @body {string} [description] - Descripción (opcional en modelo, aunque se envía en PUT).
 * @body {number} category_id - ID de la categoría.
 * @body {number} quantity    - Cantidad en stock.
 */
export const updateProductComplete = catchAsync(async (req, res, next) => {
    const id = parseId(req.params.id);
    if (!id) {
        return next(buildError("ID invalido", 400, ["El parametro id debe ser un entero positivo."]));
    }

    const productExists = await ProductModel.findById(id);
    if (!productExists) {
        return next(buildError(
            "Producto no encontrado", 404,
            [`No existe un producto con el ID ${req.params.id}.`]
        ));
    }

    const { name, description, category_id, quantity } = req.body;

    // Verificar que la nueva categoría existe
    const catExists = await CategoryModel.findById(category_id);
    if (!catExists) {
        return next(buildError(
            "Categoria no encontrada", 404,
            [`No existe una categoria con el ID ${category_id}.`]
        ));
    }

    const updated = await ProductModel.update(id, { name, description, category_id, quantity });
    return successResponse(res, 200, "Producto actualizado completamente", updated);
});

// ── PATCH /products/:id ──────────────────────────────────────────────────────
/**
 * Actualiza parcialmente un producto. Solo los campos enviados se modifican.
 * Si se envía category_id, se verifica que la categoría exista.
 * Requiere permiso: products.update
 *
 * @body {string} [name]        - Nuevo nombre.
 * @body {string} [description] - Nueva descripción.
 * @body {number} [category_id] - Nuevo ID de categoría.
 * @body {number} [quantity]    - Nueva cantidad en stock.
 */
export const updateProductPartial = catchAsync(async (req, res, next) => {
    const id = parseId(req.params.id);
    if (!id) {
        return next(buildError("ID invalido", 400, ["El parametro id debe ser un entero positivo."]));
    }

    const productExists = await ProductModel.findById(id);
    if (!productExists) {
        return next(buildError(
            "Producto no encontrado", 404,
            [`No existe un producto con el ID ${req.params.id}.`]
        ));
    }

    const { name, description, category_id, quantity } = req.body;

    // Solo verificar la categoría si se está cambiando
    if (category_id !== undefined) {
        const catExists = await CategoryModel.findById(category_id);
        if (!catExists) {
            return next(buildError(
                "Categoria no encontrada", 404,
                [`No existe una categoria con el ID ${category_id}.`]
            ));
        }
    }

    const patched = await ProductModel.patch(id, { name, description, category_id, quantity });
    return successResponse(res, 200, "Producto actualizado parcialmente", patched);
});

// ── DELETE /products/:id ─────────────────────────────────────────────────────
/**
 * Elimina un producto por su ID.
 * Requiere permiso: products.delete
 */
export const deleteProduct = catchAsync(async (req, res, next) => {
    const id = parseId(req.params.id);
    if (!id) {
        return next(buildError("ID invalido", 400, ["El parametro id debe ser un entero positivo."]));
    }

    const productExists = await ProductModel.findById(id);
    if (!productExists) {
        return next(buildError(
            "Producto no encontrado", 404,
            [`No existe un producto con el ID ${req.params.id}.`]
        ));
    }

    await ProductModel.delete(id);
    return successResponse(res, 200, "Producto eliminado correctamente");
});
