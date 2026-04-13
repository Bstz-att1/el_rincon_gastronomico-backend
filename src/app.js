import express from "express";
import "./config/db.js";
import userRouter from "./routes/usuario.routes.js"
import { successResponse } from "./utils/response.handler.js";
const app = express();

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

export default app;