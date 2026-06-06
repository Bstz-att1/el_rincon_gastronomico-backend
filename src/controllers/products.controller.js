import { ProductModel } from "../models/products.model.js";
import { CategoryModel } from "../models/categories.model.js";
import { buildError, successResponse } from "../utils/response.handler.js";
import { catchAsync } from "../utils/catchAsync.js";

// ============================================
//      CONTROLADOR DE PRODUCTOS
// ============================================

const parseId = (id) => { const parsed = Number(id); return Number.isInteger(parsed) && parsed > 0 ? parsed : null; };

export const getAllProducts = catchAsync(async (req, res) => {
    const products = await ProductModel.findAll();
    return successResponse(res, 200, "Lista de productos obtenida", products);
});

export const getProductById = catchAsync(async (req, res, next) => {
    const id = parseId(req.params.id);
    if (!id) return next(buildError("ID invalido", 400, ["El parametro id debe ser un entero positivo."]));
    const product = await ProductModel.findById(id);
    if (!product) return next(buildError("Producto no encontrado", 404, ["No existe un producto con el ID " + req.params.id]));
    return successResponse(res, 200, "Producto encontrado", product);
});

export const createProduct = catchAsync(async (req, res, next) => {
    const { name, description, category_id, quantity } = req.body;
    const catExists = await CategoryModel.findById(category_id);
    if (!catExists) return next(buildError("Categoria no encontrada", 404, ["No existe una categoria con el ID: " + category_id]));
    const newProduct = await ProductModel.create({ name, description, category_id, quantity });
    return successResponse(res, 201, "Producto creado correctamente", newProduct);
});

export const updateProductComplete = catchAsync(async (req, res, next) => {
    const id = parseId(req.params.id);
    if (!id) return next(buildError("ID invalido", 400, ["El parametro id debe ser un entero positivo."]));
    const productExists = await ProductModel.findById(id);
    if (!productExists) return next(buildError("Producto no encontrado", 404, ["No existe un producto con el ID " + req.params.id]));
    const { name, description, category_id, quantity } = req.body;
    const catExists = await CategoryModel.findById(category_id);
    if (!catExists) return next(buildError("Categoria no encontrada", 404, ["No existe una categoria con el ID: " + category_id]));
    const updated = await ProductModel.update(id, { name, description, category_id, quantity });
    return successResponse(res, 200, "Producto actualizado completamente", updated);
});

export const updateProductPartial = catchAsync(async (req, res, next) => {
    const id = parseId(req.params.id);
    if (!id) return next(buildError("ID invalido", 400, ["El parametro id debe ser un entero positivo."]));
    const productExists = await ProductModel.findById(id);
    if (!productExists) return next(buildError("Producto no encontrado", 404, ["No existe un producto con el ID " + req.params.id]));
    const { name, description, category_id, quantity } = req.body;
    if (category_id !== undefined) {
        const catExists = await CategoryModel.findById(category_id);
        if (!catExists) return next(buildError("Categoria no encontrada", 404, ["No existe una categoria con el ID: " + category_id]));
    }
    const patched = await ProductModel.patch(id, { name, description, category_id, quantity });
    return successResponse(res, 200, "Producto actualizado parcialmente", patched);
});

export const deleteProduct = catchAsync(async (req, res, next) => {
    const id = parseId(req.params.id);
    if (!id) return next(buildError("ID invalido", 400, ["El parametro id debe ser un entero positivo."]));
    const productExists = await ProductModel.findById(id);
    if (!productExists) return next(buildError("Producto no encontrado", 404, ["No existe un producto con el ID " + req.params.id]));
    await ProductModel.delete(id);
    return successResponse(res, 200, "Producto eliminado correctamente");
});
