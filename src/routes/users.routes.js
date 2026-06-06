// ============================================
//   RUTAS DE USUARIOS
// ============================================
//
// Cadena de middlewares por ruta:
//   authMiddleware          → verifica JWT y carga req.user
//   checkPermission(code)   → verifica permiso RBAC del usuario
//   validate(schema)        → valida y transforma el body con Zod
//   controller              → lógica de negocio
//
// Permisos requeridos:
//   GET    /users      → users.read
//   GET    /users/:id  → users.read
//   POST   /users      → users.create
//   PUT    /users/:id  → users.update
//   PATCH  /users/:id  → users.update
//   DELETE /users/:id  → users.delete
// ============================================

import { Router } from "express";
import {
    getAllUsers,
    getUserById,
    createUser,
    updateUserComplete,
    updateUserPartial,
    deleteUser,
} from "../controllers/index.js";
import { authMiddleware, checkPermission, validate } from "../middlewares/index.js";
import {
    createUserSchema,
    updateUserSchema,
    patchUserSchema,
} from "../schemas/index.js";

const userRouter = Router();

// Listar todos los usuarios
userRouter.get("/",       authMiddleware, checkPermission("users.read"),   getAllUsers);

// Obtener un usuario por ID
userRouter.get("/:id",    authMiddleware, checkPermission("users.read"),   getUserById);

// Crear un nuevo usuario
userRouter.post("/",      authMiddleware, checkPermission("users.create"), validate(createUserSchema), createUser);

// Reemplazar datos completos de un usuario (PUT)
userRouter.put("/:id",    authMiddleware, checkPermission("users.update"), validate(updateUserSchema), updateUserComplete);

// Actualizar datos parciales de un usuario (PATCH)
userRouter.patch("/:id",  authMiddleware, checkPermission("users.update"), validate(patchUserSchema),  updateUserPartial);

// Eliminar un usuario
userRouter.delete("/:id", authMiddleware, checkPermission("users.delete"), deleteUser);

export default userRouter;
