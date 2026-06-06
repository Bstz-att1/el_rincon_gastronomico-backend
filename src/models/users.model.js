import pool from "../config/db.js";

// ============================================
//   MODELO DE USUARIOS
// ============================================
//
// Gestiona todas las operaciones de base de datos relacionadas con usuarios.
//
// Principio de mínima exposición:
//   - PUBLIC_FIELDS excluye password_hash — nunca se expone al cliente.
//   - findByUsername es la ÚNICA función que incluye password_hash,
//     y solo se usa internamente en el proceso de login.
//
// Transacciones atómicas:
//   - create, update y patch usan transacciones para garantizar
//     consistencia entre la tabla users y user_roles.
// ============================================

// Campos públicos del usuario (sin password_hash)
const PUBLIC_FIELDS = "u.id, u.document, u.name, u.username, u.token_version, u.created_at, u.updated_at";

// Query base para obtener usuario(s) con sus roles en un solo JOIN.
// Se completa con WHERE y GROUP BY según el método que lo use.
const FIND_WITH_ROLES = `
    SELECT
        u.id, u.document, u.name, u.username,
        u.token_version, u.created_at, u.updated_at,
        JSON_ARRAYAGG(r.name) AS roles
    FROM users u
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN roles r       ON r.id = ur.role_id`;

export const UserModel = {

    // 1. Obtener todos los usuarios con sus roles asignados
    findAll: async () => {
        const [rows] = await pool.query(`${FIND_WITH_ROLES} GROUP BY u.id ORDER BY u.id ASC`);
        return rows;
    },

    // 2. Obtener un usuario por ID (con sus roles)
    // No devuelve password_hash — principio de mínima exposición.
    findById: async (id) => {
        const [rows] = await pool.query(
            `${FIND_WITH_ROLES} WHERE u.id = ? GROUP BY u.id`,
            [id]
        );
        return rows[0];
    },

    // 3. Obtener usuario con password_hash -- SOLO para autenticación en login.
    // Esta función NO debe usarse en ningún otro contexto.
    findByUsername: async (username) => {
        const [rows] = await pool.query(
            "SELECT * FROM users WHERE username = ?",
            [username]
        );
        return rows[0];
    },

    // 4. Buscar por documento (para validación de duplicados en registro)
    findByDocument: async (document) => {
        const [rows] = await pool.query(
            `SELECT ${PUBLIC_FIELDS} FROM users u WHERE u.document = ?`,
            [document]
        );
        return rows[0];
    },

    // 5. Buscar por username sin exponer datos sensibles (para validación de duplicados)
    findByUsernamePublic: async (username) => {
        const [rows] = await pool.query(
            `SELECT ${PUBLIC_FIELDS} FROM users u WHERE u.username = ?`,
            [username]
        );
        return rows[0];
    },

    // 6. Crear un nuevo usuario y asignar sus roles (transacción atómica)
    // Si la asignación de roles falla, el usuario NO queda creado (rollback).
    create: async ({ document, name, username, password_hash, roleIds }) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const [result] = await connection.query(
                "INSERT INTO users (document, name, username, password_hash) VALUES (?, ?, ?, ?)",
                [document, name, username, password_hash]
            );
            const userId = result.insertId;

            if (roleIds && roleIds.length > 0) {
                const roleValues = roleIds.map((roleId) => [userId, roleId]);
                await connection.query(
                    "INSERT INTO user_roles (user_id, role_id) VALUES ?",
                    [roleValues]
                );
            }

            await connection.commit();

            // Retornar el usuario completo (con roles) desde el pool principal
            const [newUser] = await pool.query(
                `${FIND_WITH_ROLES} WHERE u.id = ? GROUP BY u.id`,
                [userId]
            );
            return newUser[0];
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    },

    // 7. Actualizar nombre y roles del usuario -- PUT (reemplazo total de roles)
    // Elimina todos los roles actuales y asigna los nuevos en una sola transacción.
    update: async (id, { name, roleIds }) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            await connection.query("UPDATE users SET name = ? WHERE id = ?", [name, id]);

            // Reemplazar roles completamente (DELETE + INSERT)
            await connection.query("DELETE FROM user_roles WHERE user_id = ?", [id]);
            if (roleIds && roleIds.length > 0) {
                const roleValues = roleIds.map((roleId) => [id, roleId]);
                await connection.query(
                    "INSERT INTO user_roles (user_id, role_id) VALUES ?",
                    [roleValues]
                );
            }

            await connection.commit();

            const [updated] = await pool.query(
                `${FIND_WITH_ROLES} WHERE u.id = ? GROUP BY u.id`,
                [id]
            );
            return updated[0];
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    },

    // 8. Actualizar campos de forma parcial -- PATCH
    // Solo modifica los campos que vienen definidos (undefined = no tocar).
    patch: async (id, { name, roleIds }) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            if (name !== undefined) {
                await connection.query("UPDATE users SET name = ? WHERE id = ?", [name, id]);
            }

            if (roleIds !== undefined) {
                // Reemplazar roles solo si se envió el campo roles
                await connection.query("DELETE FROM user_roles WHERE user_id = ?", [id]);
                if (roleIds.length > 0) {
                    const roleValues = roleIds.map((roleId) => [id, roleId]);
                    await connection.query(
                        "INSERT INTO user_roles (user_id, role_id) VALUES ?",
                        [roleValues]
                    );
                }
            }

            await connection.commit();

            const [patched] = await pool.query(
                `${FIND_WITH_ROLES} WHERE u.id = ? GROUP BY u.id`,
                [id]
            );
            return patched[0];
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    },

    // 9. Eliminar un usuario del sistema
    // La FK en user_roles tiene ON DELETE CASCADE, por lo que los roles se eliminan solos.
    delete: async (id) => {
        const [result] = await pool.query("DELETE FROM users WHERE id = ?", [id]);
        return result.affectedRows > 0;
    },

    // 10. Incrementar token_version -- invalida TODOS los JWT previos del usuario.
    // Se invoca en POST /auth/logout para cerrar sesión de forma segura sin blacklist externa.
    incrementTokenVersion: async (id) => {
        const [result] = await pool.query(
            "UPDATE users SET token_version = token_version + 1 WHERE id = ?",
            [id]
        );
        return result.affectedRows > 0;
    },

    // 11. Obtener nombres de roles del usuario (para incluirlos en el payload del JWT al login)
    getRoleNamesByUserId: async (userId) => {
        const [rows] = await pool.query(
            `SELECT r.name
             FROM roles r
             JOIN user_roles ur ON r.id = ur.role_id
             WHERE ur.user_id = ?
             ORDER BY r.name ASC`,
            [userId]
        );
        return rows.map((r) => r.name);
    },
};
