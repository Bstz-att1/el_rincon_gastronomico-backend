/**
 * Utilidad para manejo de errores en funciones asíncronas
 */
export const catchAsync = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
