import { Router } from "express";
import {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategoryComplete,
    updateCategoryPartial,
    deleteCategory
} from "../controllers/categoria.controller.js";

const categoryRouter = Router();

// ============================================
// RUTAS DEL MÓDULO DE CATEGORÍAS (CRUD)
// ============================================

// Obtener todas las categorías
categoryRouter.get("/", getAllCategories);

// Obtener una categoría específica por su ID
categoryRouter.get("/:id", getCategoryById);

// Registrar una nueva categoría
categoryRouter.post("/", createCategory);

// Actualizar datos de la categoría completamente ( PUT )
categoryRouter.put("/:id", updateCategoryComplete);

// Actualizar datos de la categoría parcialmente ( PATCH )
categoryRouter.patch("/:id", updateCategoryPartial);

// Eliminar una categoría del sistema
categoryRouter.delete("/:id", deleteCategory);

export default categoryRouter;
