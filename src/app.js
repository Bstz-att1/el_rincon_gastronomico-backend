import express from "express";
import cors from "cors";
import "./config/db.js";
import userRouter from "./routes/usuario.routes.js";
import categoryRouter from "./routes/categoria.routes.js";
import productRouter from "./routes/producto.routes.js";
import auditRouter from "./routes/auditoria.routes.js";
import { successResponse } from "./utils/response.handler.js";
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

// Ruta para usuarios
app.use("/usuarios", userRouter);

// Ruta para categorías
app.use("/categorias", categoryRouter);

// Ruta para productos
app.use("/productos", productRouter);

// Ruta para auditoría
app.use("/auditoria", auditRouter);

export default app;
