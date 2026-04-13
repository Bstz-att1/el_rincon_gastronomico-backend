import express from "express";
import "./config/db.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: "Bienvenido a la API de gestionamiento del rincon gastronomico",
        data: [],
        errors: [],
    });
})

export default app;