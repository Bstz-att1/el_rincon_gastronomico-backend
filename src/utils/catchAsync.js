// ============================================
//   UTILIDAD — WRAPPER PARA FUNCIONES ASYNC
// ============================================

/**
 * Envuelve un handler de Express asíncrono para capturar automáticamente
 * cualquier error (rechazos de Promise) y propagarlo a next().
 *
 * Sin este wrapper, un error lanzado dentro de un async handler no sería
 * capturado por el globalErrorHandler de Express — la petición quedaría
 * colgada o causaría un unhandledRejection.
 *
 * @param {function(Request, Response, NextFunction): Promise<void>} fn
 *   Función async del controlador o middleware.
 * @returns {import("express").RequestHandler}
 *   Handler estándar de Express con captura de errores integrada.
 *
 * @example
 * export const getUser = catchAsync(async (req, res, next) => {
 *   const user = await UserModel.findById(req.params.id);
 *   successResponse(res, 200, "Usuario encontrado", user);
 * });
 */
export const catchAsync = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
