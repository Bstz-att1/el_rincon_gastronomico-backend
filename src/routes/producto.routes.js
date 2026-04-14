import { Router } from "express";
import {
    getAllProducts,
    getProductById,
    createProduct,
    updateProductComplete,
    updateProductPartial,
    deleteProduct
} from "../controllers/producto.controller.js";

const productRouter = Router();

// ============================================
// RUTAS DEL MÓDULO DE PRODUCTOS (CRUD)
// ============================================

// Obtener todos los productos
productRouter.get("/", getAllProducts);

// Obtener un producto específico por su ID
productRouter.get("/:id", getProductById);

// Registrar un nuevo producto
productRouter.post("/", createProduct);

// Actualizar datos del producto completamente ( PUT )
productRouter.put("/:id", updateProductComplete);

// Actualizar datos del producto parcialmente ( PATCH )
productRouter.patch("/:id", updateProductPartial);

// Eliminar un producto del sistema
productRouter.delete("/:id", deleteProduct);

export default productRouter;
