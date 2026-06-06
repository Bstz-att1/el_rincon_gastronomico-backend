// ============================================
//   RUTAS DE AUTENTICACIÓN
// ============================================
//
// Estas rutas NO requieren permiso RBAC — gestionan el ciclo de sesión.
//
//   POST /auth/login   → Pública — autenticar usuario con username + password.
//                         Zod valida el body antes del controlador.
//   POST /auth/logout  → Protegida (JWT) — cerrar sesión e invalidar todos
//                         los tokens del usuario (incrementa token_version).
//   GET  /auth/me      → Protegida (JWT) — devolver datos del usuario actual.
// ============================================

import { Router } from "express";
import { login, logout, getMe }    from "../controllers/index.js";
import { authMiddleware, validate } from "../middlewares/index.js";
import { loginSchema }             from "../schemas/index.js";

const authRouter = Router();

// Autenticar usuario y obtener token JWT
authRouter.post("/login",  validate(loginSchema), login);

// Cerrar sesión e invalidar todos los tokens activos del usuario
authRouter.post("/logout", authMiddleware, logout);

// Obtener información del usuario autenticado actualmente
authRouter.get("/me",      authMiddleware, getMe);

export default authRouter;
