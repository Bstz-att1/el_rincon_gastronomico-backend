import { UserModel } from "../models/users.model.js";
import { buildError } from "../utils/response.handler.js";
import { verifyToken, extractTokenFromHeader } from "../services/token.service.js";

// ============================================
//   MIDDLEWARE DE AUTENTICACIÓN JWT ROBUSTO
// ============================================

/**
 * Middleware de autenticación — protege rutas que requieren sesión activa.
 *
 * Proceso de validación en 5 capas:
 *
 *  Capa 1 — Extracción y formato del token
 *    → Verifica que el header Authorization exista y tenga el prefijo "Bearer".
 *    → Verifica la estructura básica del JWT (3 partes separadas por puntos).
 *
 *  Capa 2 — Verificación criptográfica del token
 *    → Valida la firma HMAC con la clave secreta.
 *    → Valida el algoritmo (lista blanca: solo HS256).
 *    → Valida issuer y audience para evitar uso de tokens de otros sistemas.
 *    → Valida la expiración (exp claim).
 *    → Diferencia entre token expirado, no activo aún, y malformado/manipulado.
 *
 *  Capa 3 — Validación del payload
 *    → Verifica que el payload contenga los campos mínimos (id, username, rol).
 *
 *  Capa 4 — Verificación del usuario en base de datos
 *    → Confirma que el usuario sigue existiendo en el sistema.
 *    → Detecta si la cuenta fue eliminada después de emitir el token.
 *
 *  Capa 5 — Verificación de versión del token (invalidación de sesiones)
 *    → Compara tokenVersion del JWT con token_version en la DB.
 *    → Si el usuario hizo logout (o un admin forzó el cierre), el token queda inválido
 *      sin necesidad de un almacén externo (Redis, blacklist, etc.).
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const authMiddleware = async (req, res, next) => {
    try {
        // ── Capa 1: Extracción y formato básico ───────────────────────────
        const token = extractTokenFromHeader(req.headers.authorization);

        if (!token) {
            return next(
                buildError(
                    "No autorizado",
                    401,
                    [
                        "Token no proporcionado o con formato incorrecto. " +
                        "El header debe tener el formato: Authorization: Bearer <token>",
                    ]
                )
            );
        }

        // ── Capa 2: Verificación criptográfica (firma, expiración, claims) ─
        // verifyToken() lanza un AppError con código HTTP apropiado en caso de fallo.
        const decoded = verifyToken(token);

        // ── Capa 3: Validación del payload ────────────────────────────────
        const { id, username, rol, tokenVersion } = decoded;

        if (!id || !username || !rol) {
            return next(
                buildError(
                    "Token inválido",
                    401,
                    ["El token no contiene los campos de usuario requeridos (id, username, rol)."]
                )
            );
        }

        // ── Capa 4: Verificación del usuario en base de datos ─────────────
        // Usamos findById (no devuelve password_hash) — principio de mínima exposición.
        const userInDb = await UserModel.findById(Number(id));

        if (!userInDb) {
            return next(
                buildError(
                    "No autorizado",
                    401,
                    ["El usuario asociado a este token ya no existe en el sistema."]
                )
            );
        }

        // ── Capa 5: Verificación de versión del token (logout/invalidación) ─
        // Si el campo token_version de la DB es mayor al del JWT,
        // significa que el usuario hizo logout (o fue forzado) y el token quedó obsoleto.
        if (typeof tokenVersion !== "undefined" && tokenVersion !== userInDb.token_version) {
            return next(
                buildError(
                    "Sesión cerrada",
                    401,
                    [
                        "Esta sesión ha sido cerrada. Por favor, inicie sesión nuevamente " +
                        "para obtener un token válido.",
                    ]
                )
            );
        }

        // ── Adjuntar usuario verificado a la request ──────────────────────
        // Los datos vienen de la DB (no del token) para garantizar que estén actualizados.
        req.user = {
            id: userInDb.id,
            username: userInDb.username,
            nombre: userInDb.nombre,
            rol: userInDb.rol,
        };

        next();

    } catch (err) {
        // Si el error es operacional (lanzado por verifyToken o buildError),
        // se pasa directamente al manejador global de errores.
        if (err.isOperational) {
            return next(err);
        }

        // Error inesperado (bug, problema de conexión a DB, etc.)
        return next(
            buildError(
                "Error interno de autenticación",
                500,
                ["Ocurrió un error inesperado durante la autenticación."]
            )
        );
    }
};

// ============================================
//   MIDDLEWARE DE VERIFICACIÓN DE ROLES
// ============================================

/**
 * Middleware de control de acceso por rol.
 * DEBE usarse siempre DESPUÉS de authMiddleware.
 *
 * @param {...string} allowedRoles - Roles con acceso permitido a la ruta.
 * @returns {import('express').RequestHandler}
 *
 * @example
 * router.delete('/:id', authMiddleware, checkRole('admin'), deleteUser);
 */
export const checkRole = (...allowedRoles) => {
    return (req, res, next) => {
        // Si llegamos aquí sin req.user, hay un problema de configuración en las rutas
        if (!req.user?.rol) {
            return next(
                buildError(
                    "Acceso denegado",
                    403,
                    ["No hay información de rol disponible. Use authMiddleware antes de checkRole."]
                )
            );
        }

        if (!allowedRoles.includes(req.user.rol)) {
            return next(
                buildError(
                    "Acceso denegado",
                    403,
                    [
                        `El rol '${req.user.rol}' no tiene permisos para realizar esta acción. ` +
                        `Se requiere uno de: [${allowedRoles.join(", ")}].`,
                    ]
                )
            );
        }

        next();
    };
};
