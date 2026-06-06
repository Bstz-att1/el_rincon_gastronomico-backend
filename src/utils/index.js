// ============================================
//   BARRIL — UTILIDADES
// ============================================
//
// Punto de entrada único para todas las utilidades del proyecto.
// Importar desde aquí en vez de desde los archivos individuales:
//
//   import { catchAsync, buildError, successResponse } from "../utils/index.js";
//
// ============================================

export { catchAsync } from "./catchAsync.js";

export {
    successResponse,
    errorResponse,
    buildError,
    buildUnauthorizedError,
} from "./response.handler.js";
