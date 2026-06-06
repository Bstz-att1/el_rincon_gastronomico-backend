import pool from "../config/db.js";

export const UserModel = {
    // 1. Obtener todos los usuarios
    findAll: async () => {
        const [rows] = await pool.query(
            "SELECT id, documento, nombre, username, rol, creado_en, actualizado_en FROM usuarios"
        );
        return rows;
    },

    // 2. Obtener un usuario por ID
    findById: async (id) => {
        const [rows] = await pool.query(
            "SELECT id, documento, nombre, username, rol, creado_en, actualizado_en FROM usuarios WHERE id = ?",
            [id]
        );
        return rows[0];
    },

    findByIdWithPassword: async (id) => {
        const [rows] = await pool.query(
            "SELECT * FROM usuarios WHERE id = ?",
            [id]
        );
        return rows[0];
    },

    // 3. Buscar por documento (Para validaciones de duplicados)
    findByDocumento: async (documento) => {
        const [rows] = await pool.query(
            "SELECT id, documento, nombre, username, rol, creado_en, actualizado_en FROM usuarios WHERE documento = ?",
            [documento]
        );
        return rows[0];
    },

    findByUsername: async (username) => {
        const [rows] = await pool.query(
            "SELECT * FROM usuarios WHERE username = ?",
            [username]
        );
        return rows[0];
    },

    // 4. Crear un nuevo usuario
    create: async (userData) => {
        const { documento, nombre, username, password_hash, rol } = userData;

        const [result] = await pool.query(
            "INSERT INTO usuarios (documento, nombre, username, password_hash, rol) VALUES (?, ?, ?, ?, ?)",
            [documento, nombre, username, password_hash, rol || "user"]
        );

        const [newUser] = await pool.query(
            "SELECT id, documento, nombre, username, rol, creado_en, actualizado_en FROM usuarios WHERE id = ?",
            [result.insertId]
        );
        return newUser[0];
    },

    // 5. Actualizar un usuario completamente ( PUT )
    updateComplete: async (id, { nombre, rol }) => {
        // Todos los campos son obligatorios
        if (!nombre || !rol) {
            throw new Error("Nombre y rol son requeridos");
        }

        const [result] = await pool.query(
            "UPDATE usuarios SET nombre = ?, rol = ? WHERE id = ?",
            [nombre, rol, id]
        );

        // Verificar que si se ejercion el cambio
        if (result.affectedRows === 0) return null;

        const [updatedUser] = await pool.query(
            "SELECT id, documento, nombre, username, rol, creado_en, actualizado_en FROM usuarios WHERE id = ?",
            [id]
        );
        return updatedUser[0];
    },

    // 6. Actualizar un usuario parcialmente ( PATCH )
    updatePartial: async (id, updatedFields) => {
        const { nombre, rol } = updatedFields;

        // Solo actualizamos campos que vengan en el body
        const [result] = await pool.query(
            "UPDATE usuarios SET nombre = COALESCE(?, nombre), rol = COALESCE(?, rol) WHERE id = ?",
            [nombre, rol, id]
        );

        // Verificar que si se ejercion el cambio
        if (result.affectedRows === 0) return null;

        const [updatedUser] = await pool.query(
            "SELECT id, documento, nombre, username, rol, creado_en, actualizado_en FROM usuarios WHERE id = ?",
            [id]
        );
        return updatedUser[0];
    },

    // 7. Eliminar un usuario
    delete: async (id) => {
        const [result] = await pool.query(
            "DELETE FROM usuarios WHERE id = ?",
            [id]
        );
        return result.affectedRows > 0;
    }
};