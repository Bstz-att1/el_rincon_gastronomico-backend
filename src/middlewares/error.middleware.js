// ============================================
//   MIDDLEWARES GLOBALES DE MANEJO DE ERRORES
// ============================================
//
// Estos dos middlewares DEBEN registrarse al FINAL de app.js,
// después de todas las rutas, en este orden:
//   1. notFoundHandler    — 3 parámetros (no es error-handler)
//   2. globalErrorHandler — 4 parámetros (Express lo identifica como error-handler)
//
// Express reconoce un error-handler por tener EXACTAMENTE 4 parámetros.
// ============================================

import { errorResponse } from "../utils/response.handler.js";

/**
 * Manejador de rutas no encontradas (404).
 *
 * Se ejecuta cuando ninguna ruta definida coincide con la solicitud.
 * Devuelve un JSON estandarizado en vez del HTML por defecto de Express.
 *
 * @param {import("express").Request}      req
 * @param {import("express").Response}     res
 * @param {import("express").NextFunction} _next - No se usa; Express requiere la firma completa.
 */
export const notFoundHandler = (req, res, _next) => {
    return errorResponse(
        res,
        404,
        "Ruta no encontrada",
        [`El endpoint '${req.method} ${req.originalUrl}' no existe en esta API.`]
    );
};

/**
 * Manejador global de errores de Express.
 *
 * Captura todos los errores propagados con next(err) desde cualquier
 * middleware o controlador. Distingue entre:
 *   - Errores operacionales (4xx): flujo esperado, no se loguean.
 *   - Errores de servidor (5xx): bugs o fallos inesperados, se registran en consola.
 *
 * Contrato de propiedades en el objeto de error (ver buildError en response.handler.js):
 *   - err.statusCode    {number}    — código HTTP a devolver (defecto: 500)
 *   - err.message       {string}    — mensaje corto del error
 *   - err.errors        {string[]}  — lista de detalles para el cliente
 *   - err.isOperational {boolean}   — true = error controlado, false = bug
 *
 * @param {Error}  err
 * @param {import("express").Request}      req
 * @param {import("express").Response}     res
 * @param {import("express").NextFunction} _next - Requerido por Express aunque no se use.
 */
export const globalErrorHandler = (err, req, res, _next) => {
    const statusCode = err.statusCode || 500;
    const message    = err.message    || "Error interno del servidor";
    const errors     = err.errors     || [message];

    // Registrar errores 5xx en consola para diagnóstico — los 4xx son flujo normal.
    if (statusCode >= 500) {
        console.error(`[ERROR ${statusCode}] ${req.method} ${req.originalUrl}`);
        console.error(err);
    }

    return errorResponse(res, statusCode, message, errors);
};
