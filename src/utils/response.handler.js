// ============================================
//   ESTANDARIZACIÓN DE RESPUESTAS DE LA API
// ============================================
//
// Todas las respuestas (éxito y error) siguen el mismo contrato JSON:
//
//   {
//     "success": boolean,  // true = OK, false = error
//     "message": string,   // mensaje corto legible por humanos
//     "data":    any,      // payload en respuestas exitosas, [] en errores
//     "errors":  string[]  // lista de detalles en errores, [] en éxito
//   }
//
// Esto facilita que el frontend maneje las respuestas de forma uniforme.
// ============================================

/**
 * Envía una respuesta HTTP estandarizada de éxito.
 *
 * @param {import("express").Response} res         - Objeto Response de Express.
 * @param {number}                     statusCode  - Código HTTP (200, 201, etc.).
 * @param {string}                     message     - Mensaje descriptivo del resultado.
 * @param {*}                          [data=[]]   - Payload de la respuesta (objeto, array, etc.).
 * @returns {import("express").Response}
 */
export const successResponse = (res, statusCode, message, data = []) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
        errors: [],
    });
};

/**
 * Envía una respuesta HTTP estandarizada de error.
 *
 * @param {import("express").Response} res         - Objeto Response de Express.
 * @param {number}                     statusCode  - Código HTTP (400, 401, 404, 500, etc.).
 * @param {string}                     message     - Mensaje corto del error.
 * @param {string|string[]}            [errors=[]] - Detalle(s) del error para el cliente.
 * @returns {import("express").Response}
 */
export const errorResponse = (res, statusCode, message, errors = []) => {
    const formattedErrors = Array.isArray(errors) ? errors : [errors];

    return res.status(statusCode).json({
        success: false,
        message,
        data:    [],
        errors:  formattedErrors,
    });
};

/**
 * Crea un objeto Error enriquecido para errores controlados (operacionales).
 *
 * Los errores creados con esta función son propagados con next(err) y
 * capturados por globalErrorHandler, que los serializa con errorResponse.
 *
 * @param {string}   message       - Mensaje corto del error.
 * @param {number}   [statusCode=500] - Código HTTP del error.
 * @param {string[]} [details=[]]  - Lista de mensajes de detalle para el cliente.
 * @returns {Error}  Error enriquecido con statusCode, isOperational y errors.
 */
export const buildError = (message, statusCode = 500, details = []) => {
    const err = new Error(message);
    err.statusCode    = statusCode;
    err.isOperational = true; // Marca el error como controlado (no es un bug)
    err.errors        = details.length ? details : [message];
    return err;
};

/**
 * Crea un error 401 estandarizado para acceso no autorizado.
 * Atajo para el patrón más común en authMiddleware y RBAC.
 *
 * @param {string} [detail] - Mensaje de detalle específico del contexto.
 * @returns {Error}
 */
export const buildUnauthorizedError = (
    detail = "No autorizado. Debe iniciar sesión para acceder a este recurso."
) => {
    return buildError(
        "No autorizado. Debe iniciar sesión para acceder a este recurso.",
        401,
        [detail]
    );
};
