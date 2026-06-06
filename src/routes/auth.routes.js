import { Router } from "express";
import { login, logout, getMe } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const authRouter = Router();

// ============================================
//          RUTAS DE AUTENTICACIÓN
// ============================================

/**
 * POST /auth/login
 * Pública — No requiere token.
 * Autentica al usuario y devuelve un JWT firmado.
 */
authRouter.post("/login", login);

/**
 * POST /auth/logout
 * Protegida — Requiere token válido.
 * Invalida todos los tokens del usuario incrementando token_version en la DB.
 */
authRouter.post("/logout", authMiddleware, logout);

/**
 * GET /auth/me
 * Protegida — Requiere token válido.
 * Devuelve la información del usuario autenticado actualmente.
 * Útil para que el frontend verifique el estado de la sesión.
 */
authRouter.get("/me", authMiddleware, getMe);

export default authRouter;
