// ============================================
//   BARRIL — RUTAS
// ============================================
//
// Punto de entrada único para todos los routers de la API.
// Se usa en app.js para registrar todas las rutas.
//
//   import { authRouter, userRouter, productRouter } from "./routes/index.js";
//
// ============================================

export { default as authRouter }     from "./auth.routes.js";
export { default as userRouter }     from "./users.routes.js";
export { default as categoryRouter } from "./categories.routes.js";
export { default as productRouter }  from "./products.routes.js";
export { default as auditRouter }    from "./audits.routes.js";
export { default as roleRouter }     from "./roles.routes.js";
