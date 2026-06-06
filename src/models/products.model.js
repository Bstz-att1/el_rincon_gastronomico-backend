import pool from "../config/db.js";

// ============================================
//       MODELO DE PRODUCTOS
// ============================================

export const ProductModel = {

    // 1. Obtener todos los productos (con nombre de categoria)
    findAll: async () => {
        const [rows] = await pool.query(
            `SELECT p.*, c.name AS category_name
             FROM products p
             JOIN categories c ON c.id = p.category_id
             ORDER BY p.name ASC`
        );
        return rows;
    },

    // 2. Obtener un producto por ID (con nombre de categoria)
    findById: async (id) => {
        const [rows] = await pool.query(
            `SELECT p.*, c.name AS category_name
             FROM products p
             JOIN categories c ON c.id = p.category_id
             WHERE p.id = ?`,
            [id]
        );
        return rows[0];
    },

    // 3. Crear un nuevo producto
    create: async ({ name, description, category_id, quantity }) => {
        const [result] = await pool.query(
            "INSERT INTO products (name, description, category_id, quantity) VALUES (?, ?, ?, ?)",
            [name, description ?? null, category_id, quantity ?? 0]
        );
        const [newProduct] = await pool.query(
            `SELECT p.*, c.name AS category_name
             FROM products p JOIN categories c ON c.id = p.category_id
             WHERE p.id = ?`,
            [result.insertId]
        );
        return newProduct[0];
    },

    // 4. Actualizar un producto completamente (PUT)
    update: async (id, { name, description, category_id, quantity }) => {
        const [result] = await pool.query(
            "UPDATE products SET name = ?, description = ?, category_id = ?, quantity = ? WHERE id = ?",
            [name, description ?? null, category_id, quantity, id]
        );
        if (result.affectedRows === 0) return null;

        const [updated] = await pool.query(
            `SELECT p.*, c.name AS category_name
             FROM products p JOIN categories c ON c.id = p.category_id
             WHERE p.id = ?`,
            [id]
        );
        return updated[0];
    },

    // 5. Actualizar un producto parcialmente (PATCH)
    patch: async (id, { name, description, category_id, quantity }) => {
        const [result] = await pool.query(
            `UPDATE products SET
                name        = COALESCE(?, name),
                description = COALESCE(?, description),
                category_id = COALESCE(?, category_id),
                quantity    = COALESCE(?, quantity)
             WHERE id = ?`,
            [name ?? null, description ?? null, category_id ?? null, quantity ?? null, id]
        );
        if (result.affectedRows === 0) return null;

        const [patched] = await pool.query(
            `SELECT p.*, c.name AS category_name
             FROM products p JOIN categories c ON c.id = p.category_id
             WHERE p.id = ?`,
            [id]
        );
        return patched[0];
    },

    // 6. Eliminar un producto
    delete: async (id) => {
        const [result] = await pool.query("DELETE FROM products WHERE id = ?", [id]);
        return result.affectedRows > 0;
    },
};
