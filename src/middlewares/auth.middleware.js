import { UserModel }                             from "../models/index.js";
import { buildError }                             from "../utils/index.js";
import { verifyToken, extractTokenFromHeader }    from "../services/index.js";

// ============================================
//   MIDDLEWARE DE AUTENTICACION JWT
// ============================================

/**
 * Protege rutas que requieren sesion activa.
 *
 * Proceso de validacion en 5 capas:
 *
 *  Capa 1 - Extraccion y formato del token
 *    Verifica header Authorization con prefijo "Bearer" y estructura JWT de 3 partes.
 *
 *  Capa 2 - Verificacion criptografica
 *    Valida firma HMAC, algoritmo (solo HS256), issuer, audience y expiracion.
 *
 *  Capa 3 - Validacion del payload
 *    Verifica que el payload contenga los campos minimos (id, username).
 *
 *  Capa 4 - Verificacion del usuario en base de datos
 *    Confirma que el usuario sigue existiendo (no fue eliminado tras emitir el token).
 *
 *  Capa 5 - Verificacion de version del token (invalidacion de sesiones)
 *    Compara tokenVersion del JWT con token_version en DB.
 *    Si el usuario hizo logout, el token queda invalido sin blacklist externa.
 */
export const authMiddleware = async (req, res, next) => {
    try {
        // -- Capa 1: Extraccion y formato basico del token
        const token = extractTokenFromHeader(req.headers.authorization);
        if (!token) {
            return next(buildError(
                "No autorizado", 401,
                ["Token no proporcionado o con formato incorrecto. " +
                 "Use el formato: Authorization: Bearer <token>"]
            ));
        }

        // -- Capa 2: Verificacion criptografica (firma, expiracion, claims)
        const decoded = verifyToken(token);

        // -- Capa 3: Validacion del payload
        const { id, username, tokenVersion } = decoded;
        if (!id || !username) {
            return next(buildError(
                "Token invalido", 401,
                ["El token no contiene los campos de usuario requeridos (id, username)."]
            ));
        }

        // -- Capa 4: Verificacion del usuario en DB
        // findById no devuelve password_hash — principio de minima exposicion.
        const userInDb = await UserModel.findById(Number(id));
        if (!userInDb) {
            return next(buildError(
                "No autorizado", 401,
                ["El usuario asociado a este token ya no existe en el sistema."]
            ));
        }

        // -- Capa 5: Verificacion de version del token (logout / invalidacion)
        // Si token_version en DB es diferente al del JWT, el usuario cerro sesion.
        if (typeof tokenVersion !== "undefined" && tokenVersion !== userInDb.token_version) {
            return next(buildError(
                "Sesion cerrada", 401,
                ["Esta sesion ha sido cerrada. Inicie sesion nuevamente para obtener un token valido."]
            ));
        }

        // Adjuntar usuario verificado al request (datos frescos de DB, no del token)
        req.user = {
            id:       userInDb.id,
            username: userInDb.username,
            name:     userInDb.name,
        };

        next();
    } catch (err) {
        if (err.isOperational) return next(err);
        return next(buildError(
            "Error interno de autenticacion", 500,
            ["Ocurrio un error inesperado durante la autenticacion."]
        ));
    }
};
