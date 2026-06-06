import { Router } from "express";
import { getAllUsers, getUserById, createUser, updateUserComplete, updateUserPartial, deleteUser } from "../controllers/users.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { checkPermission } from "../middlewares/rbac.middleware.js";
import { validate } from "../middlewares/validator.middleware.js";
import { createUserSchema, updateUserSchema, patchUserSchema } from "../schemas/users.schema.js";

const userRouter = Router();

userRouter.get("/",      authMiddleware, checkPermission("users.read"),   getAllUsers);
userRouter.get("/:id",   authMiddleware, checkPermission("users.read"),   getUserById);
userRouter.post("/",     authMiddleware, checkPermission("users.create"), validate(createUserSchema), createUser);
userRouter.put("/:id",   authMiddleware, checkPermission("users.update"), validate(updateUserSchema), updateUserComplete);
userRouter.patch("/:id", authMiddleware, checkPermission("users.update"), validate(patchUserSchema),  updateUserPartial);
userRouter.delete("/:id",authMiddleware, checkPermission("users.delete"), deleteUser);

export default userRouter;
