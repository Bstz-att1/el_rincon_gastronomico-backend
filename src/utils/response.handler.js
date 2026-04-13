//  ============================================
//         ESTANDARIZACION DE RESPUESTAS
//  ============================================

// Respuesta exitosa 
export const successResponse = (res, statusCode, message, data = []) => {
    return res.status(statusCode).json({
        success: true,
        message: message,
        data: data
    });
};

// Respuesta erronea
export const errorResponse = (res, statusCode, message, errors = []) => {
    // Nos aseguramos de que errors siempre sea un arreglo
    const formattedErrors = Array.isArray(errors) ? errors : [errors];

    return res.status(statusCode).json({
        success: false,
        message: message,
        data: [],
        errors: formattedErrors,
    });
};
