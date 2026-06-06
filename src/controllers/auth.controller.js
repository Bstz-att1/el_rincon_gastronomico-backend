import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserModel } from "../models/usuario.model.js";
import { buildError, successResponse } from "../utils/response.handler.js";
import { catchAsync } from "../utils/catchAsync.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev_jwt_secret_change_me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "8h";

export const login = catchAsync(async (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return next(
      buildError(
        "Error de autenticación",
        400,
        ["Los campos username y password son obligatorios"]
      )
    );
  }

  const user = await UserModel.findByUsername(username);

  if (!user || !user.password_hash) {
    return next(
      buildError("Credenciales inválidas", 401, ["Usuario o contraseña incorrectos"])
    );
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    return next(
      buildError("Credenciales inválidas", 401, ["Usuario o contraseña incorrectos"])
    );
  }

  const payload = {
    id: user.id,
    username: user.username,
    nombre: user.nombre,
    rol: user.rol,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  return successResponse(res, 200, "Autenticación exitosa", {
    token,
    user: payload,
  });
});
