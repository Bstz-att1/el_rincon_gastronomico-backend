import { Router } from "express";
import { getAllProducts, getProductById, createProduct, updateProductComplete, updateProductPartial, deleteProduct } from "../controllers/products.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { checkPermission } from "../middlewares/rbac.middleware.js";
import { validate } from "../middlewares/validator.middleware.js";
import { createProductSchema, updateProductSchema, patchProductSchema } from "../schemas/products.schema.js";

const productRouter = Router();

productRouter.get("/",      authMiddleware, checkPermission("products.read"),   getAllProducts);
productRouter.get("/:id",   authMiddleware, checkPermission("products.read"),   getProductById);
productRouter.post("/",     authMiddleware, checkPermission("products.create"), validate(createProductSchema), createProduct);
productRouter.put("/:id",   authMiddleware, checkPermission("products.update"), validate(updateProductSchema), updateProductComplete);
productRouter.patch("/:id", authMiddleware, checkPermission("products.update"), validate(patchProductSchema),  updateProductPartial);
productRouter.delete("/:id",authMiddleware, checkPermission("products.delete"), deleteProduct);

export default productRouter;
