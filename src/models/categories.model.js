import pool from "../config/db.js";

// ============================================
//       MODELO DE CATEGORIAS
// ============================================

export const CategoryModel = {

    // 1. Obtener todas las categorias
    findAll: async () => {
        const [rows] = await pool.query("SELECT * FROM categories ORDER BY name ASC");
        return rows;
    },

    // 2. Obtener una categoria por ID
    findById: async (id) => {
        const [rows] = await pool.query(
            "SELECT * FROM categories WHERE id = ?",
            [id]
        );
        return rows[0];
    },

    // 3. Buscar por nombre (para validacion de duplicados)
    findByName: async (name) => {
        const [rows] = await pool.query(
            "SELECT * FROM categories WHERE name = ?",
            [name]
        );
        return rows[0];
    },

    // 4. Crear una nueva categoria
    create: async ({ name, description }) => {
        const [result] = await pool.query(
            "INSERT INTO categories (name, description) VALUES (?, ?)",
            [name, description ?? null]
        );
        const [newCategory] = await pool.query(
            "SELECT * FROM categories WHERE id = ?",
            [result.insertId]
        );
        return newCategory[0];
    },

    // 5. Actualizar una categoria completamente (PUT)
    update: async (id, { name, description }) => {
        const [result] = await pool.query(
            "UPDATE categories SET name = ?, description = ? WHERE id = ?",
            [name, description ?? null, id]
        );
        if (result.affectedRows === 0) return null;

        const [updated] = await pool.query(
            "SELECT * FROM categories WHERE id = ?",
            [id]
        );
        return updated[0];
    },

    // 6. Actualizar una categoria parcialmente (PATCH)
    patch: async (id, { name, description }) => {
        const [result] = await pool.query(
            "UPDATE categories SET name = COALESCE(?, name), description = COALESCE(?, description) WHERE id = ?",
            [name ?? null, description ?? null, id]
        );
        if (result.affectedRows === 0) return null;

        const [patched] = await pool.query(
            "SELECT * FROM categories WHERE id = ?",
            [id]
        );
        return patched[0];
    },

    // 7. Eliminar una categoria
    delete: async (id) => {
        const [result] = await pool.query(
            "DELETE FROM categories WHERE id = ?",
            [id]
        );
        return result.affectedRows > 0;
    },
};
