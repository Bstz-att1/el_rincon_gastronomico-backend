import bcrypt from "bcryptjs";
import { UserModel }               from "../models/index.js";
import { buildError, successResponse } from "../utils/index.js";
import { catchAsync }              from "../utils/index.js";
import { signToken }               from "../services/index.js";
import { JWT_CONFIG }              from "../config/index.js";

// ============================================
//      CONTROLADOR DE AUTENTICACION
// ============================================

/**
 * POST /auth/login
 * Autentica un usuario con username + password.
 * La validacion Zod se aplica en la ruta (validate(loginSchema)).
 *
 * Seguridad aplicada:
 *  - Comparacion bcrypt (tiempo constante, evita timing attacks).
 *  - Mensaje generico usuario/contrasena incorrectos (evita user enumeration).
 *  - Token firmado con array de roles en el payload.
 */
export const login = catchAsync(async (req, res, next) => {
    const { username, password } = req.body;

    // Buscar usuario en DB (incluye password_hash para comparacion)
    const user = await UserModel.findByUsername(username);

    // Mensaje intencionalmente generico para evitar user enumeration attack
    if (!user || !user.password_hash) {
        return next(buildError("Credenciales invalidas", 401, ["Usuario o contrasena incorrectos."]));
    }

    // Verificacion de contrasena con bcrypt (tiempo constante)
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
        return next(buildError("Credenciales invalidas", 401, ["Usuario o contrasena incorrectos."]));
    }

    // Obtener nombres de roles del usuario para el payload del JWT
    const roleNames = await UserModel.getRoleNamesByUserId(user.id);

    // Generar token JWT con roles incluidos en el payload
    const token = signToken(user, roleNames);

    return successResponse(res, 200, "Autenticacion exitosa", {
        token,
        expires_in: JWT_CONFIG.expiresIn,
        user: {
            id:       user.id,
            username: user.username,
            name:     user.name,
            roles:    roleNames,
        },
    });
});

/**
 * POST /auth/logout
 * Invalida todos los tokens del usuario incrementando token_version en DB.
 * Ruta protegida (requiere authMiddleware).
 */
export const logout = catchAsync(async (req, res) => {
    await UserModel.incrementTokenVersion(req.user.id);
    return successResponse(res, 200, "Sesion cerrada correctamente", {
        message: "Todos los tokens de acceso anteriores han sido invalidados. " +
                 "Por favor, elimine el token del almacenamiento del cliente.",
    });
});

/**
 * GET /auth/me
 * Devuelve la informacion del usuario autenticado actualmente.
 * Ruta protegida (requiere authMiddleware).
 */
export const getMe = catchAsync(async (req, res) => {
    return successResponse(res, 200, "Informacion del usuario autenticado", req.user);
});
