import pool from "../config/db.js";

// ============================================
//       MODELO DE AUDITORIA
// ============================================

export const AuditModel = {

    // 1. Obtener todos los registros de auditoria (con nombre de usuario)
    findAll: async () => {
        const [rows] = await pool.query(
            `SELECT al.*, u.username AS user_name
             FROM audit_logs al
             JOIN users u ON u.id = al.user_id
             ORDER BY al.created_at DESC`
        );
        return rows;
    },

    // 2. Obtener un registro de auditoria por ID
    findById: async (id) => {
        const [rows] = await pool.query(
            `SELECT al.*, u.username AS user_name
             FROM audit_logs al
             JOIN users u ON u.id = al.user_id
             WHERE al.id = ?`,
            [id]
        );
        return rows[0];
    },

    // 3. Crear un nuevo registro de auditoria
    // Los logs de auditoria son inmutables por diseno â€” solo se crean, no se editan.
    create: async ({ user_id, action, affected_table, record_id, details }) => {
        const [result] = await pool.query(
            "INSERT INTO audit_logs (user_id, action, affected_table, record_id, details) VALUES (?, ?, ?, ?, ?)",
            [user_id, action, affected_table, record_id, details ?? null]
        );
        const [newLog] = await pool.query(
            `SELECT al.*, u.username AS user_name
             FROM audit_logs al JOIN users u ON u.id = al.user_id
             WHERE al.id = ?`,
            [result.insertId]
        );
        return newLog[0];
    },
};
