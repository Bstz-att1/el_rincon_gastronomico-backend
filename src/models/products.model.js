import pool from "../config/db.js";

// ============================================
//   MODELO DE PRODUCTOS
// ============================================
//
// Gestiona todas las operaciones de base de datos sobre la tabla products.
// Cada producto pertenece a una categoría (FK category_id → categories.id).
//
// Todas las queries de consulta incluyen un JOIN con categories para
// exponer category_name directamente, sin necesidad de una segunda consulta.
// ============================================

export const ProductModel = {

    // 1. Obtener todos los productos con el nombre de su categoría, ordenados por nombre
    findAll: async () => {
        const [rows] = await pool.query(
            `SELECT p.*, c.name AS category_name
             FROM products p
             JOIN categories c ON c.id = p.category_id
             ORDER BY p.name ASC`
        );
        return rows;
    },

    // 2. Obtener un producto por ID con el nombre de su categoría
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

    // 3. Crear un nuevo producto y devolver el registro creado con el nombre de categoría
    create: async ({ name, description, category_id, quantity }) => {
        const [result] = await pool.query(
            "INSERT INTO products (name, description, category_id, quantity) VALUES (?, ?, ?, ?)",
            [name, description ?? null, category_id, quantity ?? 0]
        );

        const [newProduct] = await pool.query(
            `SELECT p.*, c.name AS category_name
             FROM products p
             JOIN categories c ON c.id = p.category_id
             WHERE p.id = ?`,
            [result.insertId]
        );
        return newProduct[0];
    },

    // 4. Actualizar un producto completamente (PUT — reemplaza todos los campos)
    update: async (id, { name, description, category_id, quantity }) => {
        const [result] = await pool.query(
            "UPDATE products SET name = ?, description = ?, category_id = ?, quantity = ? WHERE id = ?",
            [name, description ?? null, category_id, quantity, id]
        );
        if (result.affectedRows === 0) return null;

        const [updated] = await pool.query(
            `SELECT p.*, c.name AS category_name
             FROM products p
             JOIN categories c ON c.id = p.category_id
             WHERE p.id = ?`,
            [id]
        );
        return updated[0];
    },

    // 5. Actualizar un producto parcialmente (PATCH — solo los campos enviados)
    // COALESCE(?, campo) mantiene el valor actual si el parámetro es NULL.
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
             FROM products p
             JOIN categories c ON c.id = p.category_id
             WHERE p.id = ?`,
            [id]
        );
        return patched[0];
    },

    // 6. Eliminar un producto por ID
    // Retorna true si se eliminó, false si no existía.
    delete: async (id) => {
        const [result] = await pool.query(
            "DELETE FROM products WHERE id = ?",
            [id]
        );
        return result.affectedRows > 0;
    },
};
