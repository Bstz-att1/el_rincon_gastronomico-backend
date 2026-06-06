import { Router } from "express";
import {
    getAllUsers,
    getUserById,
    createUser,
    updateUserComplete,
    updateUserPartial,
    deleteUser
} from "../controllers/users.controller.js";
import { authMiddleware, checkRole } from "../middlewares/auth.middleware.js";

const userRouter = Router();

// ============================================
// RUTAS DEL MÓDULO DE USUARIOS (CRUD)
// ============================================

// Obtener todos los usuarios
userRouter.get("/", authMiddleware, checkRole("admin", "user"), getAllUsers);

// Obtener un usuario específico por su ID
userRouter.get("/:id", authMiddleware, checkRole("admin", "user"), getUserById);

// Registrar un nuevo usuario
userRouter.post("/", authMiddleware, checkRole("admin"), createUser);

// Actualizar datos del usuario completamente ( PUT )
userRouter.put("/:id", authMiddleware, checkRole("admin"), updateUserComplete);

// Actualizar datos del usuario parcialmente ( PATCH )
userRouter.patch("/:id", authMiddleware, checkRole("admin"), updateUserPartial);

// Eliminar un usuario del sistema
userRouter.delete("/:id", authMiddleware, checkRole("admin"), deleteUser);

export default userRouter;