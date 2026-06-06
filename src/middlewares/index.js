// ============================================
//   BARRIL — MIDDLEWARES
// ============================================
//
// Punto de entrada único para todos los middlewares de la aplicación.
//
//   import { authMiddleware, validate, checkPermission } from "../middlewares/index.js";
//
// ============================================

// Autenticación JWT (verifica token y carga req.user)
export { authMiddleware } from "./auth.middleware.js";

// Manejadores globales de errores (registrar SIEMPRE al final en app.js)
export { notFoundHandler, globalErrorHandler } from "./error.middleware.js";

// Control de acceso basado en roles (RBAC)
export { checkPermission } from "./rbac.middleware.js";

// Validación de body con esquemas Zod
export { validate } from "./validator.middleware.js";
