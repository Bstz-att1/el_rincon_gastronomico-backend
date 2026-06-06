import { Router } from "express";
import { login, logout, getMe } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validator.middleware.js";
import { loginSchema } from "../schemas/auth.schema.js";

// ============================================
// RUTAS DE AUTENTICACION
// ============================================

const authRouter = Router();

// POST /auth/login -- Autenticar usuario (Zod valida el body antes del controlador)
authRouter.post("/login", validate(loginSchema), login);

// POST /auth/logout -- Cerrar sesion e invalidar todos los tokens del usuario
authRouter.post("/logout", authMiddleware, logout);

// GET /auth/me -- Obtener datos del usuario autenticado actualmente
authRouter.get("/me", authMiddleware, getMe);

export default authRouter;
