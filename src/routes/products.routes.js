// ============================================
//   RUTAS DE PRODUCTOS
// ============================================
//
// Permisos requeridos:
//   GET    /products      → products.read
//   GET    /products/:id  → products.read
//   POST   /products      → products.create
//   PUT    /products/:id  → products.update
//   PATCH  /products/:id  → products.update
//   DELETE /products/:id  → products.delete
// ============================================

import { Router } from "express";
import {
    getAllProducts,
    getProductById,
    createProduct,
    updateProductComplete,
    updateProductPartial,
    deleteProduct,
} from "../controllers/index.js";
import { authMiddleware, checkPermission, validate } from "../middlewares/index.js";
import {
    createProductSchema,
    updateProductSchema,
    patchProductSchema,
} from "../schemas/index.js";

const productRouter = Router();

// Listar todos los productos
productRouter.get("/",       authMiddleware, checkPermission("products.read"),   getAllProducts);

// Obtener un producto por ID
productRouter.get("/:id",    authMiddleware, checkPermission("products.read"),   getProductById);

// Crear un nuevo producto
productRouter.post("/",      authMiddleware, checkPermission("products.create"), validate(createProductSchema), createProduct);

// Reemplazar datos completos de un producto (PUT)
productRouter.put("/:id",    authMiddleware, checkPermission("products.update"), validate(updateProductSchema), updateProductComplete);

// Actualizar datos parciales de un producto (PATCH)
productRouter.patch("/:id",  authMiddleware, checkPermission("products.update"), validate(patchProductSchema),  updateProductPartial);

// Eliminar un producto
productRouter.delete("/:id", authMiddleware, checkPermission("products.delete"), deleteProduct);

export default productRouter;
