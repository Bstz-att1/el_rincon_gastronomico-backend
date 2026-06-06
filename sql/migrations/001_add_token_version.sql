-- ============================================
-- MIGRACIÓN 001: Soporte de invalidación de sesiones JWT
-- ============================================
-- Fecha: 2026-06-05
-- Descripción:
--   Agrega la columna token_version a la tabla usuarios.
--   Esta columna permite invalidar todos los tokens JWT activos de un usuario
--   cuando este hace logout, sin necesidad de una blacklist externa (Redis, etc.).
--
-- Mecanismo:
--   • Al hacer login  → el JWT incluye el claim tokenVersion = user.token_version
--   • Al hacer logout → se ejecuta: UPDATE usuarios SET token_version = token_version + 1
--   • En cada request → authMiddleware compara decoded.tokenVersion con DB.token_version
--   • Si no coinciden → el token es rechazado con 401 "Sesión cerrada"
--
-- EJECUTAR SOLO SI la tabla 'usuarios' ya existe y NO tiene la columna 'token_version'.
-- ============================================

USE rincon_gastronomico;

-- Agregar columna token_version (solo si no existe)
ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS token_version INT UNSIGNED NOT NULL DEFAULT 0
    COMMENT 'Versión del token. Se incrementa en cada logout para invalidar sesiones previas.'
    AFTER rol;

-- Resetear a 0 todos los usuarios existentes (estado limpio)
-- Esto fuerza a que todos los usuarios inicien sesión nuevamente para obtener
-- un token con la versión correcta.
UPDATE usuarios SET token_version = 0;

-- Verificar resultado
SELECT id, username, rol, token_version FROM usuarios;
