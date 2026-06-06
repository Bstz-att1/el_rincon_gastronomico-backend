//  ============================================
//         ESTANDARIZACION DE RESPUESTAS
//  ============================================

/**
 * Utilidad para estandarizar las respuestas exitosas de la API
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
 * Utilidad para estandarizar las respuestas de error de la API
 */
export const errorResponse = (res, statusCode, message, errors = []) => {
    const formattedErrors = Array.isArray(errors) ? errors : [errors];

    return res.status(statusCode).json({
        success: false,
        message,
        data: [],
        errors: formattedErrors,
    });
};

/**
 * Genera un error personalizado para respuestas controladas del servidor.
 */
export const buildError = (message, statusCode = 500, details = []) => {
    const err = new Error(message);
    err.statusCode = statusCode;
    err.isOperational = true;
    err.errors = details.length ? details : [message];
    return err;
};

/**
 * Crea un error 401 estandarizado para rutas protegidas
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
