// ============================================
//   CONFIGURACIÓN CENTRAL DE EXPRESS
// ============================================
//
// Este módulo configura y exporta la aplicación Express.
// El arranque del servidor HTTP está en server.js (separación de responsabilidades).
//
// Orden de middlewares (importante para el correcto funcionamiento):
//   1. Validación de configuración JWT         → falla rápido si la config es insegura
//   2. CORS                                    → debe ir ANTES que cualquier ruta
//   3. Parseo de body (JSON / urlencoded)      → límite de 10 KB contra payloads grandes
//   4. Rutas de la API
//   5. Manejador 404                           → ruta no encontrada
//   6. Manejador global de errores             → debe ser el ÚLTIMO middleware
// ============================================

import "dotenv/config";
import express from "express";
import cors    from "cors";

import "./config/db.js";
import { validateJWTConfig } from "./config/jwt.config.js";

import authRouter     from "./routes/auth.routes.js";
import userRouter     from "./routes/users.routes.js";
import categoryRouter from "./routes/categories.routes.js";
import productRouter  from "./routes/products.routes.js";
import auditRouter    from "./routes/audits.routes.js";
import roleRouter     from "./routes/roles.routes.js";

import { successResponse }                     from "./utils/response.handler.js";
import { globalErrorHandler, notFoundHandler } from "./middlewares/error.middleware.js";

// ============================================
//   1. VALIDACIÓN DE CONFIGURACIÓN JWT
// ============================================
// Se ejecuta antes de inicializar Express.
// Si JWT_SECRET falta o es inseguro, la app NO arranca.
validateJWTConfig();

// ============================================
//   2. INICIALIZACIÓN DE EXPRESS
// ============================================
const app = express();

// ── CORS ─────────────────────────────────────────────────────────────────────
// CORS_ORIGIN en .env define qué orígenes pueden consumir la API.
// Ejemplos:
//   Desarrollo  → CORS_ORIGIN=http://localhost:5173
//   Producción  → CORS_ORIGIN=https://miapp.com
//   Sin env     → permite todos los orígenes (solo aceptable en dev local)
const corsOptions = {
    origin:         process.env.CORS_ORIGIN || "*",
    methods:        ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials:    true,
};
app.use(cors(corsOptions));

// ── Parseo de cuerpo de solicitudes ─────────────────────────────────────────
// Límite de 10 KB — mitiga ataques de payloads JSON maliciosamente grandes.
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// ============================================
//   3. RUTA RAÍZ — Health check básico
// ============================================
app.get("/", (_req, res) => {
    successResponse(res, 200, "API Rincón Gastronómico activa", {
        version: "1.0.0",
        status:  "ok",
        docs:    "Consulta el README para la documentación de endpoints.",
    });
});

// ============================================
//   4. DEFINICIÓN DE RUTAS
// ============================================
app.use("/auth",       authRouter);
app.use("/users",      userRouter);
app.use("/categories", categoryRouter);
app.use("/products",   productRouter);
app.use("/audit",      auditRouter);
app.use("/roles",      roleRouter);

// ============================================
//   5 & 6. MANEJADORES DE ERROR (siempre al final)
// ============================================
// notFoundHandler   : responde 404 para cualquier ruta no registrada.
// globalErrorHandler: centraliza todos los errores propagados con next(err).
app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
