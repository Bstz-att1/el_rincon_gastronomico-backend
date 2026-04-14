import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserModel } from "../models/usuario.model.js";
import { errorResponse, successResponse } from "../utils/response.handler.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev_jwt_secret_change_me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "8h";

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return errorResponse(
        res,
        400,
        "Error de autenticación",
        "Los campos username y password son obligatorios"
      );
    }

    const user = await UserModel.findByUsername(username);

    if (!user || !user.password_hash) {
      return errorResponse(
        res,
        401,
        "Credenciales inválidas",
        "Usuario o contraseña incorrectos"
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return errorResponse(
        res,
        401,
        "Credenciales inválidas",
        "Usuario o contraseña incorrectos"
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
  } catch (error) {
    return errorResponse(res, 500, "Error del servidor", error.message);
  }
};
