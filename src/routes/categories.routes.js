// ============================================
//   RUTAS DE CATEGORÍAS
// ============================================
//
// Permisos requeridos:
//   GET    /categories      → categories.read
//   GET    /categories/:id  → categories.read
//   POST   /categories      → categories.create
//   PUT    /categories/:id  → categories.update
//   PATCH  /categories/:id  → categories.update
//   DELETE /categories/:id  → categories.delete
// ============================================

import { Router } from "express";
import {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategoryComplete,
    updateCategoryPartial,
    deleteCategory,
} from "../controllers/categories.controller.js";
import { authMiddleware }  from "../middlewares/auth.middleware.js";
import { checkPermission } from "../middlewares/rbac.middleware.js";
import { validate }        from "../middlewares/validator.middleware.js";
import {
    createCategorySchema,
    updateCategorySchema,
    patchCategorySchema,
} from "../schemas/categories.schema.js";

const categoryRouter = Router();

// Listar todas las categorías
categoryRouter.get("/",       authMiddleware, checkPermission("categories.read"),   getAllCategories);

// Obtener una categoría por ID
categoryRouter.get("/:id",    authMiddleware, checkPermission("categories.read"),   getCategoryById);

// Crear una nueva categoría
categoryRouter.post("/",      authMiddleware, checkPermission("categories.create"), validate(createCategorySchema), createCategory);

// Reemplazar datos completos de una categoría (PUT)
categoryRouter.put("/:id",    authMiddleware, checkPermission("categories.update"), validate(updateCategorySchema), updateCategoryComplete);

// Actualizar datos parciales de una categoría (PATCH)
categoryRouter.patch("/:id",  authMiddleware, checkPermission("categories.update"), validate(patchCategorySchema),  updateCategoryPartial);

// Eliminar una categoría
categoryRouter.delete("/:id", authMiddleware, checkPermission("categories.delete"), deleteCategory);

export default categoryRouter;
