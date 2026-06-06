import "dotenv/config";
import express from "express";
import cors from "cors";
import "./config/db.js";
import { validateJWTConfig } from "./config/jwt.config.js";
import userRouter from "./routes/users.routes.js";
import categoryRouter from "./routes/categories.routes.js";
import productRouter from "./routes/products.routes.js";
import auditRouter from "./routes/audits.routes.js";
import authRouter from "./routes/auth.routes.js";
import { successResponse } from "./utils/response.handler.js";
import { globalErrorHandler, notFoundHandler } from "./middlewares/error.middleware.js";

// ============================================
//   VALIDACIÓN DE CONFIGURACIÓN (al inicio)
// ============================================

// Lanzar error fatal si la configuración JWT no cumple requisitos de seguridad.
// Esto IMPIDE que la aplicación arranque con configuración insegura o incompleta.
// Configura JWT_SECRET, JWT_EXPIRES_IN en el archivo .env antes de iniciar.
validateJWTConfig();

// ============================================
//   INICIALIZACIÓN DE LA APLICACIÓN
// ============================================

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Ruta de bienvenida ────────────────────────────────────────────────────
app.get("/", (req, res) => {
    successResponse(res, 200, "Bienvenido a la API de gestión del Rincón Gastronómico");
});

// ============================================
//              DEFINICIÓN DE RUTAS
// ============================================

// Ruta de autenticación (login, logout, me)
app.use("/auth", authRouter);

// Ruta para usuarios
app.use("/usuarios", userRouter);

// Ruta para categorías
app.use("/categorias", categoryRouter);

// Ruta para productos
app.use("/productos", productRouter);

// Ruta para auditoría
app.use("/auditoria", auditRouter);

// ============================================
//         MANEJO GLOBAL DE ERRORES
// ============================================

// Middleware para rutas no encontradas (404)
app.use(notFoundHandler);

// Middleware global de errores (debe ser el ÚLTIMO middleware)
app.use(globalErrorHandler);

export default app;
