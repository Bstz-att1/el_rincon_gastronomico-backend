//  ============================================
//      CONTROLADOR CENTRADO EN PRODUCTOS
//  ============================================ 

import { ProductModel } from "../models/producto.model.js";
import { errorResponse, successResponse } from "../utils/response.handler.js";

// Trae todos los productos
export const getAllProducts = async (req, res) => {
    try {
        const products = await ProductModel.findAll();
        return successResponse(res, 200, "Lista de productos obtenida", products);
    } catch (error) {
        return errorResponse(res, 500, "Error del servidor", error.message);
    }
};

// Trae un producto por su Id
export const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await ProductModel.findById(Number(id));

        if (!product) {
            return errorResponse(res, 404, "Producto no encontrado", `Producto con ID ${id} no encontrado`);
        }

        return successResponse(res, 200, "Producto encontrado", product);
    } catch (error) {
        return errorResponse(res, 500, "Error del servidor", error.message);
    }
};

// Crea un nuevo producto
export const createProduct = async (req, res) => {
    try {
        const { nombre, descripcion, categoria_id, cantidad } = req.body;

        if (!nombre || !categoria_id) {
            return errorResponse(res, 400, "Error al crear producto", "Los campos nombre y categoria_id son obligatorios");
        }

        const newProduct = await ProductModel.create({ nombre, descripcion, categoria_id, cantidad });
        return successResponse(res, 200, "Producto creado correctamente", newProduct);
    } catch (error) {
        return errorResponse(res, 500, "Error del servidor", error.message);
    }
};

// Actualiza todos los campos del producto ( PUT )
export const updateProductComplete = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, categoria_id, cantidad } = req.body;

        // Campos obligatorios para actualización completa
        if (!nombre || !categoria_id || cantidad === undefined || cantidad === null) {
            return errorResponse(res, 400, "Error al actualizar", "Nombre, categoria_id y cantidad son obligatorios");
        }

        const updatedProduct = await ProductModel.updateComplete(Number(id), { nombre, descripcion, categoria_id, cantidad });

        if (!updatedProduct) {
            return errorResponse(res, 404, "Error al actualizar", `Producto con ID ${id} no encontrado`);
        }

        return successResponse(res, 200, "Producto actualizado completamente", updatedProduct);
    } catch (error) {
        return errorResponse(res, 500, "Error del servidor", error.message);
    }
};

// Actualiza parcialmente ( PATCH )
export const updateProductPartial = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, categoria_id, cantidad } = req.body;

        // Validación parcial
        if (
            nombre === undefined &&
            descripcion === undefined &&
            categoria_id === undefined &&
            cantidad === undefined
        ) {
            return errorResponse(res, 400, "Error al actualizar", "Se requiere al menos un campo para actualizar");
        }

        const updatedProduct = await ProductModel.updatePartial(Number(id), { nombre, descripcion, categoria_id, cantidad });

        if (!updatedProduct) {
            return errorResponse(res, 404, "Error al actualizar", `Producto con ID ${id} no encontrado`);
        }

        return successResponse(res, 200, "Producto actualizado parcialmente", updatedProduct);
    } catch (error) {
        return errorResponse(res, 500, "Error del servidor", error.message);
    }
};

// Elimina un producto
export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const productExists = await ProductModel.findById(Number(id));

        if (!productExists) {
            return errorResponse(res, 404, "Error al eliminar producto", `No se pudo eliminar: Producto con ID ${id} no encontrado`);
        }

        await ProductModel.delete(Number(id));
        return successResponse(res, 200, "Producto eliminado correctamente");
    } catch (error) {
        return errorResponse(res, 500, "Error del servidor", error.message);
    }
};
