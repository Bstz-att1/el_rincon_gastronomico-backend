import { Router } from "express";
import {
    getAllProducts,
    getProductById,
    createProduct,
    updateProductComplete,
    updateProductPartial,
    deleteProduct
} from "../controllers/products.controller.js";
import { authMiddleware, checkRole } from "../middlewares/auth.middleware.js";

const productRouter = Router();

// ============================================
// RUTAS DEL MÓDULO DE PRODUCTOS (CRUD)
// ============================================

// Obtener todos los productos
productRouter.get("/", authMiddleware, checkRole("admin", "user"), getAllProducts);

// Obtener un producto específico por su ID
productRouter.get("/:id", authMiddleware, checkRole("admin", "user"), getProductById);

// Registrar un nuevo producto
productRouter.post("/", authMiddleware, checkRole("admin"), createProduct);

// Actualizar datos del producto completamente ( PUT )
productRouter.put("/:id", authMiddleware, checkRole("admin"), updateProductComplete);

// Actualizar datos del producto parcialmente ( PATCH )
productRouter.patch("/:id", authMiddleware, checkRole("admin"), updateProductPartial);

// Eliminar un producto del sistema
productRouter.delete("/:id", authMiddleware, checkRole("admin"), deleteProduct);

export default productRouter;
