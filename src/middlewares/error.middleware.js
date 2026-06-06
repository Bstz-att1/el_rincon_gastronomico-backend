import { errorResponse } from "../utils/response.handler.js";

export const notFoundHandler = (req, res, next) => {
    return errorResponse(
        res,
        404,
        "Ruta no encontrada",
        `No existe ${req.method} ${req.originalUrl}`
    );
};

export const globalErrorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Error interno del servidor";
    const errors = err.errors || [message];

    return errorResponse(res, statusCode, message, errors);
};
