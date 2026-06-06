//  ============================================
//      CONTROLADOR CENTRADO EN PRODUCTOS
//  ============================================ 

import { ProductModel } from "../models/producto.model.js";
import { buildError, successResponse } from "../utils/response.handler.js";
import { catchAsync } from "../utils/catchAsync.js";

// Trae todos los productos
export const getAllProducts = catchAsync(async (req, res) => {
    const products = await ProductModel.findAll();
    return successResponse(res, 200, "Lista de productos obtenida", products);
});

// Trae un producto por su Id
export const getProductById = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const product = await ProductModel.findById(Number(id));

    if (!product) {
        return next(buildError("Producto no encontrado", 404, [`Producto con ID ${id} no encontrado`]));
    }

    return successResponse(res, 200, "Producto encontrado", product);
});

// Crea un nuevo producto
export const createProduct = catchAsync(async (req, res, next) => {
    const { nombre, descripcion, categoria_id, cantidad } = req.body;

    if (!nombre || !categoria_id) {
        return next(buildError("Error al crear producto", 400, ["Los campos nombre y categoria_id son obligatorios"]));
    }

    const newProduct = await ProductModel.create({ nombre, descripcion, categoria_id, cantidad });
    return successResponse(res, 200, "Producto creado correctamente", newProduct);
});

// Actualiza todos los campos del producto ( PUT )
export const updateProductComplete = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { nombre, descripcion, categoria_id, cantidad } = req.body;

    if (!nombre || !categoria_id || cantidad === undefined || cantidad === null) {
        return next(buildError("Error al actualizar", 400, ["Nombre, categoria_id y cantidad son obligatorios"]));
    }

    const updatedProduct = await ProductModel.updateComplete(Number(id), { nombre, descripcion, categoria_id, cantidad });

    if (!updatedProduct) {
        return next(buildError("Error al actualizar", 404, [`Producto con ID ${id} no encontrado`]));
    }

    return successResponse(res, 200, "Producto actualizado completamente", updatedProduct);
});

// Actualiza parcialmente ( PATCH )
export const updateProductPartial = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { nombre, descripcion, categoria_id, cantidad } = req.body;

    if (
        nombre === undefined &&
        descripcion === undefined &&
        categoria_id === undefined &&
        cantidad === undefined
    ) {
        return next(buildError("Error al actualizar", 400, ["Se requiere al menos un campo para actualizar"]));
    }

    const updatedProduct = await ProductModel.updatePartial(Number(id), { nombre, descripcion, categoria_id, cantidad });

    if (!updatedProduct) {
        return next(buildError("Error al actualizar", 404, [`Producto con ID ${id} no encontrado`]));
    }

    return successResponse(res, 200, "Producto actualizado parcialmente", updatedProduct);
});

// Elimina un producto
export const deleteProduct = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const productExists = await ProductModel.findById(Number(id));

    if (!productExists) {
        return next(buildError("Error al eliminar producto", 404, [`No se pudo eliminar: Producto con ID ${id} no encontrado`]));
    }

    await ProductModel.delete(Number(id));
    return successResponse(res, 200, "Producto eliminado correctamente");
});
