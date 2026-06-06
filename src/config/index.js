// ============================================
//   BARRIL — CONFIGURACIÓN
// ============================================
//
// Punto de entrada único para la configuración del proyecto.
//
// NOTA IMPORTANTE: re-exportar pool desde este barril garantiza
// que la conexión a MySQL se establece en cuanto cualquier módulo
// importe algo de config/index.js — el side-effect de db.js
// se ejecuta exactamente una vez (caché de módulos ES).
//
//   import { pool, JWT_CONFIG, validateJWTConfig } from "../config/index.js";
//
// ============================================

// Pool de conexiones MySQL (re-exportado como named export)
export { default as pool } from "./db.js";

// Configuración y validación JWT
export { JWT_CONFIG, validateJWTConfig } from "./jwt.config.js";
