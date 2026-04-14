import jwt from "jsonwebtoken";
import { errorResponse } from "../utils/response.handler.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev_jwt_secret_change_me";

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization || "";

  if (!authHeader.startsWith("Bearer ")) {
    return errorResponse(
      res,
      401,
      "No autorizado",
      "Token no proporcionado o formato inválido"
    );
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return errorResponse(res, 401, "No autorizado", "Token inválido o expirado");
  }
};

export const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user?.rol) {
      return errorResponse(res, 403, "Acceso denegado", "Rol no disponible en el token");
    }

    if (!allowedRoles.includes(req.user.rol)) {
      return errorResponse(
        res,
        403,
        "Acceso denegado",
        `El rol '${req.user.rol}' no tiene permisos para esta acción`
      );
    }

    next();
  };
};
