import jwt from "jsonwebtoken";
import { JWT_CONFIG } from "../config/index.js";
import { buildError }  from "../utils/index.js";

// ============================================
//          SERVICIO DE TOKENS JWT
// ============================================

/**
 * Genera un token JWT firmado con todos los claims de seguridad.
 *
 * Claims incluidos:
 *  - sub          : ID del usuario (subject estandar JWT)
 *  - id           : ID del usuario (alias explicito para compatibilidad)
 *  - username     : Nombre de usuario
 *  - name         : Nombre completo del usuario
 *  - roles        : Array de nombres de roles asignados al usuario
 *  - tokenVersion : Version del token — invalida sesiones previas en logout
 *  - iss          : Emisor (issuer)
 *  - aud          : Audiencia
 *  - iat / exp    : Fecha de emision / expiracion
 *
 * @param {object}   user      - Objeto usuario de la base de datos.
 * @param {string[]} roleNames - Array de nombres de roles del usuario.
 * @returns {string}             Token JWT firmado.
 */
export const signToken = (user, roleNames = []) => {
    const payload = {
        sub:          String(user.id),
        id:           user.id,
        username:     user.username,
        name:         user.name,
        roles:        roleNames,
        // tokenVersion: invalida todos los tokens previos al hacer logout.
        // Si el valor en DB cambia, los tokens viejos fallan en authMiddleware.
        tokenVersion: user.token_version ?? 0,
    };

    return jwt.sign(payload, JWT_CONFIG.secret, {
        expiresIn: JWT_CONFIG.expiresIn,
        algorithm: JWT_CONFIG.algorithm,
        issuer:    JWT_CONFIG.issuer,
        audience:  JWT_CONFIG.audience,
    });
};

/**
 * Verifica y decodifica un token JWT.
 * Valida: firma, algoritmo, issuer, audience y expiracion.
 *
 * Lanza un AppError con codigo HTTP apropiado. Nunca expone detalles internos.
 *
 * @param {string} token - Token JWT a verificar.
 * @returns {object}       Payload decodificado si el token es valido.
 */
export const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_CONFIG.secret, {
            algorithms: [JWT_CONFIG.algorithm], // Lista blanca de algoritmos (evita 'alg: none')
            issuer:     JWT_CONFIG.issuer,
            audience:   JWT_CONFIG.audience,
            complete:   false,                  // Solo el payload decodificado
        });
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw buildError(
                "Sesion expirada", 401,
                ["El token de acceso ha expirado. Por favor, inicie sesion nuevamente."]
            );
        }
        if (error instanceof jwt.NotBeforeError) {
            throw buildError(
                "Token no activo", 401,
                ["El token todavia no es valido. Verifique la configuracion de fecha/hora."]
            );
        }
        if (error instanceof jwt.JsonWebTokenError) {
            // No exponer detalles al cliente para no ayudar a un atacante
            throw buildError(
                "Token invalido", 401,
                ["El token de acceso es invalido o ha sido modificado."]
            );
        }
        throw buildError(
            "Error de autenticacion", 500,
            ["Ocurrio un error interno al verificar el token."]
        );
    }
};

/**
 * Extrae y valida superficialmente el token del header Authorization.
 *
 * Valida: existencia del header, prefijo "Bearer ", token no vacio y
 * estructura de 3 partes (header.payload.signature).
 * NO verifica la firma — eso lo hace verifyToken().
 *
 * @param {string|undefined} authHeader - Valor del header Authorization.
 * @returns {string|null}                 Token extraido, o null si el header es invalido.
 */
export const extractTokenFromHeader = (authHeader) => {
    if (!authHeader || typeof authHeader !== "string") return null;

    const BEARER_PREFIX = "Bearer ";
    if (!authHeader.startsWith(BEARER_PREFIX)) return null;

    const token = authHeader.slice(BEARER_PREFIX.length).trim();
    if (!token) return null;

    // Verificar estructura basica de JWT: tres partes separadas por puntos
    const parts = token.split(".");
    if (parts.length !== 3 || parts.some((p) => p.length === 0)) return null;

    return token;
};
