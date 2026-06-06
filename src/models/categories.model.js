import pool from "../config/db.js";

export const CategoryModel = {
    // 1. Obtener todas las categorías
    findAll: async () => {
        const [rows] = await pool.query(
            "SELECT * FROM categorias"
        );
        return rows;
    },

    // 2. Obtener una categoría por ID
    findById: async (id) => {
        const [rows] = await pool.query(
            "SELECT * FROM categorias WHERE id = ?",
            [id]
        );
        return rows[0];
    },

    // 3. Buscar por nombre (Para validaciones de duplicados)
    findByNombre: async (nombre) => {
        const [rows] = await pool.query(
            "SELECT * FROM categorias WHERE nombre = ?",
            [nombre]
        );
        return rows[0];
    },

    // 4. Crear una nueva categoría
    create: async (categoryData) => {
        const { nombre, descripcion } = categoryData;

        const [result] = await pool.query(
            "INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)",
            [nombre, descripcion || null]
        );

        // Retornamos la categoría recién creada
        const [newCategory] = await pool.query(
            "SELECT * FROM categorias WHERE id = ?",
            [result.insertId]
        );
        return newCategory[0];
    },

    // 5. Actualizar una categoría completamente ( PUT )
    updateComplete: async (id, { nombre, descripcion }) => {
        // Todos los campos son obligatorios
        if (!nombre || !descripcion) {
            throw new Error("Nombre y descripcion son requeridos");
        }

        const [result] = await pool.query(
            "UPDATE categorias SET nombre = ?, descripcion = ? WHERE id = ?",
            [nombre, descripcion, id]
        );

        // Verificar que sí se ejerció el cambio
        if (result.affectedRows === 0) return null;

        const [updatedCategory] = await pool.query(
            "SELECT * FROM categorias WHERE id = ?",
            [id]
        );
        return updatedCategory[0];
    },

    // 6. Actualizar una categoría parcialmente ( PATCH )
    updatePartial: async (id, updatedFields) => {
        const { nombre, descripcion } = updatedFields;

        // Solo actualizamos campos que vengan en el body
        const [result] = await pool.query(
            "UPDATE categorias SET nombre = COALESCE(?, nombre), descripcion = COALESCE(?, descripcion) WHERE id = ?",
            [nombre, descripcion, id]
        );

        // Verificar que sí se ejerció el cambio
        if (result.affectedRows === 0) return null;

        const [updatedCategory] = await pool.query(
            "SELECT * FROM categorias WHERE id = ?",
            [id]
        );
        return updatedCategory[0];
    },

    // 7. Eliminar una categoría
    delete: async (id) => {
        const [result] = await pool.query(
            "DELETE FROM categorias WHERE id = ?",
            [id]
        );
        return result.affectedRows > 0;
    }
};
