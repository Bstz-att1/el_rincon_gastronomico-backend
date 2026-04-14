import pool from "../config/db.js";

export const ProductModel = {
    // 1. Obtener todos los productos
    findAll: async () => {
        const [rows] = await pool.query(
            "SELECT * FROM productos"
        );
        return rows;
    },

    // 2. Obtener un producto por ID
    findById: async (id) => {
        const [rows] = await pool.query(
            "SELECT * FROM productos WHERE id = ?",
            [id]
        );
        return rows[0];
    },

    // 3. Crear un nuevo producto
    create: async (productData) => {
        const { nombre, descripcion, categoria_id, cantidad } = productData;

        const [result] = await pool.query(
            "INSERT INTO productos (nombre, descripcion, categoria_id, cantidad) VALUES (?, ?, ?, ?)",
            [nombre, descripcion || null, categoria_id, cantidad ?? 0]
        );

        // Retornamos el producto recién creado
        const [newProduct] = await pool.query(
            "SELECT * FROM productos WHERE id = ?",
            [result.insertId]
        );
        return newProduct[0];
    },

    // 4. Actualizar un producto completamente ( PUT )
    updateComplete: async (id, { nombre, descripcion, categoria_id, cantidad }) => {
        // Todos los campos obligatorios del update completo
        if (!nombre || !categoria_id || cantidad === undefined || cantidad === null) {
            throw new Error("Nombre, categoria_id y cantidad son requeridos");
        }

        const [result] = await pool.query(
            "UPDATE productos SET nombre = ?, descripcion = ?, categoria_id = ?, cantidad = ? WHERE id = ?",
            [nombre, descripcion || null, categoria_id, cantidad, id]
        );

        // Verificar que sí se ejerció el cambio
        if (result.affectedRows === 0) return null;

        const [updatedProduct] = await pool.query(
            "SELECT * FROM productos WHERE id = ?",
            [id]
        );
        return updatedProduct[0];
    },

    // 5. Actualizar un producto parcialmente ( PATCH )
    updatePartial: async (id, updatedFields) => {
        const { nombre, descripcion, categoria_id, cantidad } = updatedFields;

        const [result] = await pool.query(
            "UPDATE productos SET nombre = COALESCE(?, nombre), descripcion = COALESCE(?, descripcion), categoria_id = COALESCE(?, categoria_id), cantidad = COALESCE(?, cantidad) WHERE id = ?",
            [nombre, descripcion, categoria_id, cantidad, id]
        );

        // Verificar que sí se ejerció el cambio
        if (result.affectedRows === 0) return null;

        const [updatedProduct] = await pool.query(
            "SELECT * FROM productos WHERE id = ?",
            [id]
        );
        return updatedProduct[0];
    },

    // 6. Eliminar un producto
    delete: async (id) => {
        const [result] = await pool.query(
            "DELETE FROM productos WHERE id = ?",
            [id]
        );
        return result.affectedRows > 0;
    }
};
