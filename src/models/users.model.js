import pool from "../config/db.js";

// ============================================
//          MODELO DE USUARIOS
// ============================================

/**
 * Columnas públicas del usuario (sin password_hash).
 * Se usa en todos los SELECT que no requieren la contraseña.
 *
 * Incluye token_version para que el authMiddleware pueda verificar
 * la validez del token tras un logout.
 */
const PUBLIC_FIELDS =
    "id, documento, nombre, username, rol, token_version, creado_en, actualizado_en";

export const UserModel = {

    // ── 1. Obtener todos los usuarios ─────────────────────────────────────
    findAll: async () => {
        const [rows] = await pool.query(
            `SELECT ${PUBLIC_FIELDS} FROM usuarios`
        );
        return rows;
    },

    // ── 2. Obtener un usuario por ID ──────────────────────────────────────
    // Incluye token_version para que authMiddleware pueda validar la sesión.
    findById: async (id) => {
        const [rows] = await pool.query(
            `SELECT ${PUBLIC_FIELDS} FROM usuarios WHERE id = ?`,
            [id]
        );
        return rows[0];
    },

    // ── 3. Obtener un usuario con su password_hash (solo para autenticación) ─
    // Solo se usa en el login — no exponer en otro contexto.
    findByUsername: async (username) => {
        const [rows] = await pool.query(
            "SELECT * FROM usuarios WHERE username = ?",
            [username]
        );
        return rows[0];
    },

    // ── 4. Buscar por documento (para validación de duplicados) ───────────
    findByDocumento: async (documento) => {
        const [rows] = await pool.query(
            `SELECT ${PUBLIC_FIELDS} FROM usuarios WHERE documento = ?`,
            [documento]
        );
        return rows[0];
    },

    // ── 5. Buscar por username sin password (para validación de duplicados) ─
    findByUsernamePublic: async (username) => {
        const [rows] = await pool.query(
            `SELECT ${PUBLIC_FIELDS} FROM usuarios WHERE username = ?`,
            [username]
        );
        return rows[0];
    },

    // ── 6. Crear un nuevo usuario ─────────────────────────────────────────
    create: async (userData) => {
        const { documento, nombre, username, password_hash, rol } = userData;

        const [result] = await pool.query(
            "INSERT INTO usuarios (documento, nombre, username, password_hash, rol) VALUES (?, ?, ?, ?, ?)",
            [documento, nombre, username, password_hash, rol || "user"]
        );

        const [newUser] = await pool.query(
            `SELECT ${PUBLIC_FIELDS} FROM usuarios WHERE id = ?`,
            [result.insertId]
        );
        return newUser[0];
    },

    // ── 7. Actualizar completamente ( PUT ) ───────────────────────────────
    updateComplete: async (id, { nombre, rol }) => {
        if (!nombre || !rol) {
            throw new Error("Nombre y rol son requeridos para actualización completa.");
        }

        const [result] = await pool.query(
            "UPDATE usuarios SET nombre = ?, rol = ? WHERE id = ?",
            [nombre, rol, id]
        );

        if (result.affectedRows === 0) return null;

        const [updatedUser] = await pool.query(
            `SELECT ${PUBLIC_FIELDS} FROM usuarios WHERE id = ?`,
            [id]
        );
        return updatedUser[0];
    },

    // ── 8. Actualizar parcialmente ( PATCH ) ──────────────────────────────
    updatePartial: async (id, updatedFields) => {
        const { nombre, rol } = updatedFields;

        const [result] = await pool.query(
            "UPDATE usuarios SET nombre = COALESCE(?, nombre), rol = COALESCE(?, rol) WHERE id = ?",
            [nombre ?? null, rol ?? null, id]
        );

        if (result.affectedRows === 0) return null;

        const [updatedUser] = await pool.query(
            `SELECT ${PUBLIC_FIELDS} FROM usuarios WHERE id = ?`,
            [id]
        );
        return updatedUser[0];
    },

    // ── 9. Eliminar un usuario ────────────────────────────────────────────
    delete: async (id) => {
        const [result] = await pool.query(
            "DELETE FROM usuarios WHERE id = ?",
            [id]
        );
        return result.affectedRows > 0;
    },

    // ── 10. Incrementar token_version (LOGOUT / Invalidación de sesión) ───
    /**
     * Incrementa el campo token_version del usuario en la base de datos.
     *
     * Efecto: todos los JWT emitidos ANTES de esta operación quedan inválidos
     * automáticamente porque authMiddleware compara decoded.tokenVersion
     * con el valor actual en la DB.
     *
     * Se usa en el endpoint POST /auth/logout.
     *
     * @param {number} id - ID del usuario a invalidar.
     * @returns {boolean} true si la operación fue exitosa.
     */
    incrementTokenVersion: async (id) => {
        const [result] = await pool.query(
            "UPDATE usuarios SET token_version = token_version + 1 WHERE id = ?",
            [id]
        );
        return result.affectedRows > 0;
    },
};
