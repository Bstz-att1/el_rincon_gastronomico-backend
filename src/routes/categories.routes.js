import { Router } from "express";
import {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategoryComplete,
    updateCategoryPartial,
    deleteCategory
} from "../controllers/categories.controller.js";
import { authMiddleware, checkRole } from "../middlewares/auth.middleware.js";

const categoryRouter = Router();

// ============================================
// RUTAS DEL MÓDULO DE CATEGORÍAS (CRUD)
// ============================================

// Obtener todas las categorías
categoryRouter.get("/", authMiddleware, checkRole("admin", "user"), getAllCategories);

// Obtener una categoría específica por su ID
categoryRouter.get("/:id", authMiddleware, checkRole("admin", "user"), getCategoryById);

// Registrar una nueva categoría
categoryRouter.post("/", authMiddleware, checkRole("admin"), createCategory);

// Actualizar datos de la categoría completamente ( PUT )
categoryRouter.put("/:id", authMiddleware, checkRole("admin"), updateCategoryComplete);

// Actualizar datos de la categoría parcialmente ( PATCH )
categoryRouter.patch("/:id", authMiddleware, checkRole("admin"), updateCategoryPartial);

// Eliminar una categoría del sistema
categoryRouter.delete("/:id", authMiddleware, checkRole("admin"), deleteCategory);

export default categoryRouter;
