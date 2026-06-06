import "dotenv/config";
import express from "express";
import cors from "cors";
import "./config/db.js";
import { validateJWTConfig } from "./config/jwt.config.js";
import authRouter     from "./routes/auth.routes.js";
import userRouter     from "./routes/users.routes.js";
import categoryRouter from "./routes/categories.routes.js";
import productRouter  from "./routes/products.routes.js";
import auditRouter    from "./routes/audits.routes.js";
import roleRouter     from "./routes/roles.routes.js";
import { successResponse } from "./utils/response.handler.js";
import { globalErrorHandler, notFoundHandler } from "./middlewares/error.middleware.js";

// ============================================
//   VALIDACION DE CONFIGURACION (al inicio)
// ============================================

// Lanzar error fatal si la configuracion JWT no cumple requisitos de seguridad.
// Esto IMPIDE que la aplicacion arranque con configuracion insegura o incompleta.
validateJWTConfig();

// ============================================
//   INICIALIZACION DE LA APLICACION
// ============================================

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    successResponse(res, 200, "Bienvenido a la API de gestion del Rincon Gastronomico");
});

// ============================================
//              DEFINICION DE RUTAS
// ============================================

app.use("/auth",       authRouter);
app.use("/users",      userRouter);
app.use("/categories", categoryRouter);
app.use("/products",   productRouter);
app.use("/audit",      auditRouter);
app.use("/roles",      roleRouter);

// ============================================
//         MANEJO GLOBAL DE ERRORES
// ============================================

app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
