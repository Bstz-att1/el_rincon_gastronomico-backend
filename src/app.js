import express from "express";
import cors from "cors";
import "./config/db.js";
import userRouter from "./routes/users.routes.js";
import categoryRouter from "./routes/categories.routes.js";
import productRouter from "./routes/products.routes.js";
import auditRouter from "./routes/audits.routes.js";
import authRouter from "./routes/auth.routes.js";
import { successResponse } from "./utils/response.handler.js";
import { globalErrorHandler, notFoundHandler } from "./middlewares/error.middleware.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    successResponse(res, 200, "Bienvenido a la API de gestionamiento del rincon gastronomico")
})

//  ============================================
//              DEFINICION DE RUTAS
//  ============================================

// Ruta de autenticación
app.use("/auth", authRouter);

// Ruta para usuarios
app.use("/usuarios", userRouter);

// Ruta para categorías
app.use("/categorias", categoryRouter);

// Ruta para productos
app.use("/productos", productRouter);

// Ruta para auditoría
app.use("/auditoria", auditRouter);

// Middleware para rutas no encontradas
app.use(notFoundHandler);

// Middleware global de errores
app.use(globalErrorHandler);

export default app;
