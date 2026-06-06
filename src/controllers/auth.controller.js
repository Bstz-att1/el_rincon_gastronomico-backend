import bcrypt from "bcryptjs";
import { UserModel } from "../models/users.model.js";
import { buildError, successResponse } from "../utils/response.handler.js";
import { catchAsync } from "../utils/catchAsync.js";
import { signToken } from "../services/token.service.js";
import { JWT_CONFIG } from "../config/jwt.config.js";

// ============================================
//      CONTROLADOR DE AUTENTICACIÓN
// ============================================

/**
 * POST /auth/login
 *
 * Autentica un usuario con username + password.
 * Devuelve un token JWT firmado junto con los datos públicos del usuario.
 *
 * Seguridad aplicada:
 *  - Validación de campos obligatorios (sin revelar qué campo falta).
 *  - Hash bcrypt para comparación de contraseña (tiempo constante para evitar timing attacks).
 *  - Mensaje de error genérico para usuario/contraseña incorrectos (evita user enumeration).
 *  - Token firmado con todos los claims de seguridad (via signToken del token.service).
 */
export const login = catchAsync(async (req, res, next) => {
    const { username, password } = req.body;

    // ── Validación de entrada ─────────────────────────────────────────────
    if (!username || !password) {
        return next(
            buildError(
                "Datos de acceso incompletos",
                400,
                ["Los campos 'username' y 'password' son obligatorios."]
            )
        );
    }

    // Validación de tipos — evitar inyecciones no numéricas pasadas como objetos
    if (typeof username !== "string" || typeof password !== "string") {
        return next(
            buildError(
                "Datos de acceso inválidos",
                400,
                ["Los campos 'username' y 'password' deben ser texto plano."]
            )
        );
    }

    // Sanitización básica: limpiar espacios extremos
    const sanitizedUsername = username.trim();
    if (!sanitizedUsername) {
        return next(
            buildError("Datos de acceso incompletos", 400, ["El campo 'username' no puede estar vacío."])
        );
    }

    // ── Verificación del usuario ──────────────────────────────────────────
    const user = await UserModel.findByUsername(sanitizedUsername);

    // Nota de seguridad: El mensaje de error es INTENCIONALMENTE genérico.
    // No indicamos si el usuario existe o no (evita "User Enumeration Attack").
    if (!user || !user.password_hash) {
        return next(
            buildError("Credenciales inválidas", 401, [
                "Usuario o contraseña incorrectos.",
            ])
        );
    }

    // ── Verificación de contraseña (tiempo constante) ─────────────────────
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
        return next(
            buildError("Credenciales inválidas", 401, [
                "Usuario o contraseña incorrectos.",
            ])
        );
    }

    // ── Generación del token ──────────────────────────────────────────────
    // signToken() incluye: sub, id, username, nombre, rol, tokenVersion, iss, aud, iat, exp
    const token = signToken(user);

    // ── Respuesta exitosa ─────────────────────────────────────────────────
    return successResponse(res, 200, "Autenticación exitosa", {
        token,
        expiresIn: JWT_CONFIG.expiresIn,
        user: {
            id: user.id,
            username: user.username,
            nombre: user.nombre,
            rol: user.rol,
        },
    });
});

/**
 * POST /auth/logout
 *
 * Cierra la sesión del usuario activo invalidando todos sus tokens anteriores.
 *
 * Mecanismo de invalidación:
 *  - Se incrementa token_version en la base de datos del usuario.
 *  - El middleware authMiddleware verifica este valor en cada request.
 *  - Cualquier token emitido ANTES del logout queda automáticamente inválido.
 *
 * Nota: El cliente debe eliminar el token de su almacenamiento local
 * (localStorage, sessionStorage, memoria, etc.).
 *
 * Ruta protegida — requiere authMiddleware.
 */
export const logout = catchAsync(async (req, res, next) => {
    // req.user es inyectado por authMiddleware — el usuario ya está autenticado
    const userId = req.user.id;

    // Incrementar token_version invalida todos los tokens anteriores del usuario
    await UserModel.incrementTokenVersion(userId);

    return successResponse(
        res,
        200,
        "Sesión cerrada correctamente",
        {
            message:
                "Todos los tokens de acceso anteriores han sido invalidados. " +
                "Por favor, elimine el token del almacenamiento del cliente.",
        }
    );
});

/**
 * GET /auth/me
 *
 * Devuelve la información del usuario autenticado actualmente.
 * Los datos se obtienen de req.user (inyectado por authMiddleware desde la DB).
 *
 * Ruta protegida — requiere authMiddleware.
 */
export const getMe = catchAsync(async (req, res) => {
    return successResponse(
        res,
        200,
        "Información del usuario autenticado",
        req.user
    );
});
