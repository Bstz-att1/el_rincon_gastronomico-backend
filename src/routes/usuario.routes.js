import { Router } from "express";
import {
    getAllUsers,
    getUserById,
    createUser,
    updateUserComplete,
    updateUserPartial,
    deleteUser
} from "../controllers/usuario.controller.js";

const userRouter = Router();

// ============================================
// RUTAS DEL MÓDULO DE USUARIOS (CRUD)
// ============================================

// Obtener todos los usuarios
userRouter.get("/", getAllUsers);

// Obtener un usuario específico por su ID
userRouter.get("/:id", getUserById);

// Registrar un nuevo usuario
userRouter.post("/", createUser);

// Actualizar datos del usuario completamente ( PUT )
userRouter.put("/:id", updateUserComplete);

// Actualizar datos del usuario parcialmente ( PATCH )
userRouter.patch("/:id", updateUserPartial);

// Eliminar un usuario del sistema
userRouter.delete("/:id", deleteUser);

export default userRouter;