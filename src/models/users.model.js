import pool from "../config/db.js";

// ============================================
//          MODELO DE USUARIOS
// ============================================

const PUBLIC_FIELDS = "u.id, u.document, u.name, u.username, u.token_version, u.created_at, u.updated_at";

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
        const [rows] = await pool.query(`${FIND_WITH_ROLES} GROUP BY u.id`);
        return rows;
    },

    // 2. Obtener un usuario por ID (con sus roles)
    findById: async (id) => {
        const [rows] = await pool.query(
            `${FIND_WITH_ROLES} WHERE u.id = ? GROUP BY u.id`,
            [id]
        );
        return rows[0];
    },

    // 3. Obtener usuario con password_hash â€” SOLO para autenticacion, no exponer
    findByUsername: async (username) => {
        const [rows] = await pool.query(
            "SELECT * FROM users WHERE username = ?",
            [username]
        );
        return rows[0];
    },

    // 4. Buscar por documento (para validacion de duplicados)
    findByDocument: async (document) => {
        const [rows] = await pool.query(
            `SELECT ${PUBLIC_FIELDS} FROM users u WHERE u.document = ?`,
            [document]
        );
        return rows[0];
    },

    // 5. Buscar por username publico (para validacion de duplicados)
    findByUsernamePublic: async (username) => {
        const [rows] = await pool.query(
            `SELECT ${PUBLIC_FIELDS} FROM users u WHERE u.username = ?`,
            [username]
        );
        return rows[0];
    },

    // 6. Crear un nuevo usuario y asignar sus roles (transaccion atomica)
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
                await connection.query("INSERT INTO user_roles (user_id, role_id) VALUES ?", [roleValues]);
            }

            await connection.commit();

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

    // 7. Actualizar nombre y roles del usuario â€” PUT (reemplazo total de roles)
    update: async (id, { name, roleIds }) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            await connection.query("UPDATE users SET name = ? WHERE id = ?", [name, id]);
            await connection.query("DELETE FROM user_roles WHERE user_id = ?", [id]);

            if (roleIds && roleIds.length > 0) {
                const roleValues = roleIds.map((roleId) => [id, roleId]);
                await connection.query("INSERT INTO user_roles (user_id, role_id) VALUES ?", [roleValues]);
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

    // 8. Actualizar campos de forma parcial â€” PATCH
    patch: async (id, { name, roleIds }) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            if (name !== undefined) {
                await connection.query("UPDATE users SET name = ? WHERE id = ?", [name, id]);
            }
            if (roleIds !== undefined) {
                await connection.query("DELETE FROM user_roles WHERE user_id = ?", [id]);
                if (roleIds.length > 0) {
                    const roleValues = roleIds.map((roleId) => [id, roleId]);
                    await connection.query("INSERT INTO user_roles (user_id, role_id) VALUES ?", [roleValues]);
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
    delete: async (id) => {
        const [result] = await pool.query("DELETE FROM users WHERE id = ?", [id]);
        return result.affectedRows > 0;
    },

    // 10. Incrementar token_version â€” invalida todos los JWT previos del usuario
    // Se invoca en POST /auth/logout para cerrar sesion de forma segura.
    incrementTokenVersion: async (id) => {
        const [result] = await pool.query(
            "UPDATE users SET token_version = token_version + 1 WHERE id = ?",
            [id]
        );
        return result.affectedRows > 0;
    },

    // 11. Obtener nombres de roles del usuario (para el payload del JWT en login)
    getRoleNamesByUserId: async (userId) => {
        const [rows] = await pool.query(
            `SELECT r.name
             FROM roles r
             JOIN user_roles ur ON r.id = ur.role_id
             WHERE ur.user_id = ?`,
            [userId]
        );
        return rows.map((r) => r.name);
    },
};
