import pool from "../config/db.js";

// ============================================
//   MODELO DE CATEGORÍAS
// ============================================
//
// Gestiona todas las operaciones de base de datos sobre la tabla categories.
// Las categorías son la clasificación principal de los productos.
//
// Consideración de integridad:
//   Si una categoría tiene productos asociados, la FK en products.category_id
//   impedirá su eliminación (MySQL rechazará el DELETE con ER_ROW_IS_REFERENCED).
//   El controlador debe capturar ese error y devolver una respuesta descriptiva.
// ============================================

export const CategoryModel = {

    // 1. Obtener todas las categorías, ordenadas alfabéticamente por nombre
    findAll: async () => {
        const [rows] = await pool.query(
            "SELECT * FROM categories ORDER BY name ASC"
        );
        return rows;
    },

    // 2. Obtener una categoría por ID
    findById: async (id) => {
        const [rows] = await pool.query(
            "SELECT * FROM categories WHERE id = ?",
            [id]
        );
        return rows[0];
    },

    // 3. Buscar por nombre (para validación de duplicados antes de crear/actualizar)
    findByName: async (name) => {
        const [rows] = await pool.query(
            "SELECT * FROM categories WHERE name = ?",
            [name]
        );
        return rows[0];
    },

    // 4. Crear una nueva categoría y devolver el registro creado
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

    // 5. Actualizar una categoría completamente (PUT — reemplaza todos los campos)
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

    // 6. Actualizar una categoría parcialmente (PATCH — solo los campos enviados)
    // COALESCE(?, campo) mantiene el valor actual si el parámetro es NULL.
    patch: async (id, { name, description }) => {
        const [result] = await pool.query(
            `UPDATE categories
             SET name = COALESCE(?, name), description = COALESCE(?, description)
             WHERE id = ?`,
            [name ?? null, description ?? null, id]
        );
        if (result.affectedRows === 0) return null;

        const [patched] = await pool.query(
            "SELECT * FROM categories WHERE id = ?",
            [id]
        );
        return patched[0];
    },

    // 7. Eliminar una categoría por ID
    // Retorna true si se eliminó, false si no existía.
    delete: async (id) => {
        const [result] = await pool.query(
            "DELETE FROM categories WHERE id = ?",
            [id]
        );
        return result.affectedRows > 0;
    },
};
