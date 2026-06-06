import { pool } from "../config/index.js";

// ============================================
//   MODELO DE AUDITORÍA
// ============================================
//
// Los registros de auditoría son INMUTABLES por diseño:
//   - Solo se pueden CREAR y CONSULTAR.
//   - No existe update() ni delete() — garantiza trazabilidad e integridad histórica.
//
// Cada registro incluye el username del autor del cambio (JOIN con users)
// para facilitar la lectura humana sin necesidad de una segunda consulta.
// ============================================

export const AuditModel = {

    // 1. Obtener todos los registros de auditoría ordenados del más reciente al más antiguo
    findAll: async () => {
        const [rows] = await pool.query(
            `SELECT al.*, u.username AS user_name
             FROM audit_logs al
             JOIN users u ON u.id = al.user_id
             ORDER BY al.created_at DESC`
        );
        return rows;
    },

    // 2. Obtener un registro de auditoría por ID
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

    // 3. Crear un nuevo registro de auditoría.
    // Los logs son inmutables -- solo INSERT, nunca UPDATE ni DELETE.
    // @param {number} user_id        - ID del usuario que realizó la acción.
    // @param {string} action         - Código de acción (CREATE, UPDATE, DELETE, LOGIN, etc.).
    // @param {string} affected_table - Tabla afectada (users, products, categories, etc.).
    // @param {number} record_id      - ID del registro afectado dentro de la tabla.
    // @param {string} [details]      - Información adicional opcional (JSON string u otro).
    create: async ({ user_id, action, affected_table, record_id, details }) => {
        const [result] = await pool.query(
            "INSERT INTO audit_logs (user_id, action, affected_table, record_id, details) VALUES (?, ?, ?, ?, ?)",
            [user_id, action, affected_table, record_id, details ?? null]
        );

        // Retornar el log creado con el username incluido
        const [newLog] = await pool.query(
            `SELECT al.*, u.username AS user_name
             FROM audit_logs al
             JOIN users u ON u.id = al.user_id
             WHERE al.id = ?`,
            [result.insertId]
        );
        return newLog[0];
    },
};
