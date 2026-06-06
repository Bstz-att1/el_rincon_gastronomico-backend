import { Router } from "express";
import { getAllCategories, getCategoryById, createCategory, updateCategoryComplete, updateCategoryPartial, deleteCategory } from "../controllers/categories.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { checkPermission } from "../middlewares/rbac.middleware.js";
import { validate } from "../middlewares/validator.middleware.js";
import { createCategorySchema, updateCategorySchema, patchCategorySchema } from "../schemas/categories.schema.js";

const categoryRouter = Router();

categoryRouter.get("/",      authMiddleware, checkPermission("categories.read"),   getAllCategories);
categoryRouter.get("/:id",   authMiddleware, checkPermission("categories.read"),   getCategoryById);
categoryRouter.post("/",     authMiddleware, checkPermission("categories.create"), validate(createCategorySchema), createCategory);
categoryRouter.put("/:id",   authMiddleware, checkPermission("categories.update"), validate(updateCategorySchema), updateCategoryComplete);
categoryRouter.patch("/:id", authMiddleware, checkPermission("categories.update"), validate(patchCategorySchema),  updateCategoryPartial);
categoryRouter.delete("/:id",authMiddleware, checkPermission("categories.delete"), deleteCategory);

export default categoryRouter;
