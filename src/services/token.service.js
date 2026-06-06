import jwt from "jsonwebtoken";
import { JWT_CONFIG } from "../config/jwt.config.js";
import { buildError } from "../utils/response.handler.js";

// ============================================
//          SERVICIO DE TOKENS JWT
// ============================================

/**
 * Genera un token JWT firmado y con todos los claims de seguridad estándar.
 *
 * Claims incluidos:
 *  - sub        : ID del usuario (subject estándar JWT)
 *  - id         : ID del usuario (alias explícito para compatibilidad)
 *  - username   : Nombre de usuario
 *  - nombre     : Nombre completo del usuario
 *  - rol        : Rol del usuario en el sistema
 *  - tokenVersion: Versión del token — permite invalidar sesiones previas al hacer logout
 *  - iss        : Emisor (issuer) — verifica que el token vino de esta API
 *  - aud        : Audiencia — verifica que el token está destinado a esta app
 *  - iat        : Fecha de emisión (issued at)
 *  - exp        : Fecha de expiración
 *
 * @param {object} user   - Objeto usuario (de la base de datos).
 * @returns {string}        Token JWT firmado.
 */
export const signToken = (user) => {
    const payload = {
        sub: String(user.id),
        id: user.id,
        username: user.username,
        nombre: user.nombre,
        rol: user.rol,
        // tokenVersion: permite invalidar todos los tokens anteriores cuando el
        // usuario hace logout. Si el valor en la DB cambia, los tokens viejos fallan.
        tokenVersion: user.token_version ?? 0,
    };

    return jwt.sign(payload, JWT_CONFIG.secret, {
        expiresIn: JWT_CONFIG.expiresIn,
        algorithm: JWT_CONFIG.algorithm,
        issuer: JWT_CONFIG.issuer,
        audience: JWT_CONFIG.audience,
    });
};

/**
 * Verifica y decodifica un token JWT.
 * Valida: firma, algoritmo, issuer, audience y expiración.
 *
 * En caso de error, lanza un AppError operacional con el código HTTP adecuado
 * y un mensaje descriptivo — nunca expone detalles de implementación.
 *
 * @param {string} token  - Token JWT a verificar.
 * @returns {object}        Payload decodificado si el token es válido.
 * @throws {AppError}       Si el token es inválido, expirado o malformado.
 */
export const verifyToken = (token) => {
    try {
        const decoded = jwt.verify(token, JWT_CONFIG.secret, {
            algorithms: [JWT_CONFIG.algorithm],   // Lista blanca de algoritmos (evita "alg: none")
            issuer: JWT_CONFIG.issuer,
            audience: JWT_CONFIG.audience,
            complete: false,                       // Solo el payload decodificado
        });

        return decoded;

    } catch (error) {
        // ── Error: Token expirado ─────────────────────────────────────────
        if (error instanceof jwt.TokenExpiredError) {
            throw buildError(
                "Sesión expirada",
                401,
                ["El token de acceso ha expirado. Por favor, inicie sesión nuevamente."]
            );
        }

        // ── Error: Token aún no válido (nbf claim en el futuro) ──────────
        if (error instanceof jwt.NotBeforeError) {
            throw buildError(
                "Token no activo",
                401,
                ["El token todavía no es válido. Verifique la configuración de fecha/hora."]
            );
        }

        // ── Errores de formato / firma / algoritmo / issuer / audience ───
        if (error instanceof jwt.JsonWebTokenError) {
            // Los detalles específicos del error NO se exponen al cliente
            // para no revelar información que ayude a un atacante.
            throw buildError(
                "Token inválido",
                401,
                ["El token de acceso es inválido o ha sido modificado."]
            );
        }

        // ── Error inesperado ──────────────────────────────────────────────
        throw buildError(
            "Error de autenticación",
            500,
            ["Ocurrió un error interno al verificar el token."]
        );
    }
};

/**
 * Extrae y valida superficialmente el token del header Authorization.
 *
 * Valida:
 *  1. Existencia del header
 *  2. Prefijo "Bearer "
 *  3. Que el token no esté vacío
 *  4. Que tenga la estructura de 3 partes separadas por puntos (header.payload.signature)
 *
 * NO verifica la firma — eso lo hace verifyToken().
 *
 * @param {string|undefined} authHeader - Valor del header Authorization.
 * @returns {string|null}                 Token extraído, o null si el header es inválido.
 */
export const extractTokenFromHeader = (authHeader) => {
    // Verificar que el header existe y es un string
    if (!authHeader || typeof authHeader !== "string") return null;

    // Verificar que el header comienza con "Bearer " (con espacio)
    const BEARER_PREFIX = "Bearer ";
    if (!authHeader.startsWith(BEARER_PREFIX)) return null;

    const token = authHeader.slice(BEARER_PREFIX.length).trim();

    // Verificar que el token no está vacío
    if (!token) return null;

    // Verificar estructura básica de JWT: tres partes separadas por puntos
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    // Verificar que cada parte tiene contenido (no está vacía)
    if (parts.some((part) => part.length === 0)) return null;

    return token;
};
