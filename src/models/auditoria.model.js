import pool from "../config/db.js";

export const AuditModel = {
    // 1. Obtener todos los registros de auditoría
    findAll: async () => {
        const [rows] = await pool.query(
            "SELECT * FROM audit_logs"
        );
        return rows;
    },

    // 2. Obtener un registro de auditoría por ID
    findById: async (id) => {
        const [rows] = await pool.query(
            "SELECT * FROM audit_logs WHERE id = ?",
            [id]
        );
        return rows[0];
    },

    // 3. Crear un nuevo registro de auditoría
    create: async (auditData) => {
        const { usuario_id, accion, tabla_afectada, registro_id, detalles } = auditData;

        const [result] = await pool.query(
            "INSERT INTO audit_logs (usuario_id, accion, tabla_afectada, registro_id, detalles) VALUES (?, ?, ?, ?, ?)",
            [usuario_id, accion, tabla_afectada, registro_id, detalles || null]
        );

        // Retornamos el registro recién creado
        const [newAuditLog] = await pool.query(
            "SELECT * FROM audit_logs WHERE id = ?",
            [result.insertId]
        );
        return newAuditLog[0];
    },

    // 4. Actualizar un registro completamente ( PUT )
    updateComplete: async (id, { usuario_id, accion, tabla_afectada, registro_id, detalles }) => {
        // Campos obligatorios para actualización completa
        if (!usuario_id || !accion || !tabla_afectada || !registro_id) {
            throw new Error("usuario_id, accion, tabla_afectada y registro_id son requeridos");
        }

        const [result] = await pool.query(
            "UPDATE audit_logs SET usuario_id = ?, accion = ?, tabla_afectada = ?, registro_id = ?, detalles = ? WHERE id = ?",
            [usuario_id, accion, tabla_afectada, registro_id, detalles || null, id]
        );

        // Verificar que sí se ejerció el cambio
        if (result.affectedRows === 0) return null;

        const [updatedAuditLog] = await pool.query(
            "SELECT * FROM audit_logs WHERE id = ?",
            [id]
        );
        return updatedAuditLog[0];
    },

    // 5. Actualizar un registro parcialmente ( PATCH )
    updatePartial: async (id, updatedFields) => {
        const { usuario_id, accion, tabla_afectada, registro_id, detalles } = updatedFields;

        const [result] = await pool.query(
            "UPDATE audit_logs SET usuario_id = COALESCE(?, usuario_id), accion = COALESCE(?, accion), tabla_afectada = COALESCE(?, tabla_afectada), registro_id = COALESCE(?, registro_id), detalles = COALESCE(?, detalles) WHERE id = ?",
            [usuario_id, accion, tabla_afectada, registro_id, detalles, id]
        );

        // Verificar que sí se ejerció el cambio
        if (result.affectedRows === 0) return null;

        const [updatedAuditLog] = await pool.query(
            "SELECT * FROM audit_logs WHERE id = ?",
            [id]
        );
        return updatedAuditLog[0];
    },

    // 6. Eliminar un registro de auditoría
    delete: async (id) => {
        const [result] = await pool.query(
            "DELETE FROM audit_logs WHERE id = ?",
            [id]
        );
        return result.affectedRows > 0;
    }
};
