// ============================================
//      CONFIGURACIÓN CENTRALIZADA DE JWT
// ============================================

/**
 * Valida que las variables de entorno requeridas para JWT estén presentes
 * y cumplan los requisitos mínimos de seguridad.
 *
 * Se debe llamar UNA SOLA VEZ al iniciar la aplicación (en app.js).
 * Si falla, la aplicación se detiene — no hay JWT inseguro por defecto.
 *
 * @throws {Error} Si alguna variable requerida falta o es insegura.
 */
export const validateJWTConfig = () => {
    const errors = [];

    // 1. Secreto principal
    if (!process.env.JWT_SECRET) {
        errors.push("JWT_SECRET no está definida en las variables de entorno.");
    } else if (process.env.JWT_SECRET.length < 32) {
        errors.push(
            `JWT_SECRET es demasiado corta (${process.env.JWT_SECRET.length} chars). ` +
            "Se requieren mínimo 32 caracteres para garantizar seguridad."
        );
    }

    // 2. Tiempo de expiración
    if (!process.env.JWT_EXPIRES_IN) {
        errors.push("JWT_EXPIRES_IN no está definida en las variables de entorno.");
    }

    if (errors.length > 0) {
        throw new Error(
            "[JWT Config] La aplicación no puede iniciar con configuración JWT insegura:\n" +
            errors.map((e) => `  • ${e}`).join("\n")
        );
    }
};

// ============================================
//       OBJETO DE CONFIGURACIÓN JWT
// ============================================

/**
 * Configuración JWT derivada de variables de entorno.
 * Usar Object.freeze para evitar modificaciones accidentales en runtime.
 *
 * IMPORTANTE: Se debe llamar validateJWTConfig() antes de usar este objeto
 * para garantizar que los valores sean seguros.
 */
export const JWT_CONFIG = Object.freeze({
    // Clave secreta para firmar los tokens
    secret: process.env.JWT_SECRET,

    // Tiempo de vida del token (p.ej. "8h", "1d", "30m")
    expiresIn: process.env.JWT_EXPIRES_IN || "8h",

    // Algoritmo de firma (HS256 es el estándar simétrico seguro con secreto fuerte)
    algorithm: "HS256",

    // Identificador del emisor — permite validar que el token fue generado por ESTA API
    issuer: process.env.JWT_ISSUER || "rincon-gastronomico-api",

    // Identificador del receptor esperado — permite validar el destino del token
    audience: process.env.JWT_AUDIENCE || "rincon-gastronomico-app",
});
