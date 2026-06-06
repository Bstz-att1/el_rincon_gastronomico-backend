import pool from "../config/db.js";

// ============================================
//       MODELO DE ROLES (RBAC)
// ============================================

export const RoleModel = {

    // 1. Obtener todos los roles con sus permisos agregados
    findAll: async () => {
        const [rows] = await pool.query(
            `SELECT
                r.id, r.name, r.description, r.is_system, r.created_at,
                JSON_ARRAYAGG(
                    JSON_OBJECT('id', p.id, 'code', p.code, 'resource', p.resource)
                ) AS permissions
             FROM roles r
             LEFT JOIN role_permissions rp ON r.id = rp.role_id
             LEFT JOIN permissions p       ON p.id = rp.permission_id
             GROUP BY r.id
             ORDER BY r.name ASC`
        );
        return rows;
    },

    // 2. Obtener un rol por ID (con sus permisos)
    findById: async (id) => {
        const [rows] = await pool.query(
            `SELECT
                r.id, r.name, r.description, r.is_system, r.created_at,
                JSON_ARRAYAGG(
                    JSON_OBJECT('id', p.id, 'code', p.code, 'resource', p.resource)
                ) AS permissions
             FROM roles r
             LEFT JOIN role_permissions rp ON r.id = rp.role_id
             LEFT JOIN permissions p       ON p.id = rp.permission_id
             WHERE r.id = ?
             GROUP BY r.id`,
            [id]
        );
        return rows[0];
    },

    // 3. Buscar un rol por nombre
    findByName: async (name) => {
        const [rows] = await pool.query(
            "SELECT * FROM roles WHERE name = ?",
            [name]
        );
        return rows[0];
    },

    // 4. Obtener permisos de un rol especifico
    findPermissionsByRoleId: async (roleId) => {
        const [rows] = await pool.query(
            `SELECT p.id, p.code, p.description, p.resource
             FROM permissions p
             JOIN role_permissions rp ON p.id = rp.permission_id
             WHERE rp.role_id = ?
             ORDER BY p.resource, p.code`,
            [roleId]
        );
        return rows;
    },

    // 5. Buscar permisos por sus codigos (ej: ['users.read', 'products.create'])
    // Usado para validar que los codigos enviados en el body existen en la DB.
    findPermissionsByCodes: async (codes) => {
        if (!codes || codes.length === 0) return [];
        const [rows] = await pool.query(
            "SELECT id, code, resource FROM permissions WHERE code IN (?)",
            [codes]
        );
        return rows;
    },

    // 6. Obtener todos los permisos disponibles en el sistema
    findAllPermissions: async () => {
        const [rows] = await pool.query(
            "SELECT * FROM permissions ORDER BY resource, code"
        );
        return rows;
    },

    // 7. Obtener los codigos de permisos de un usuario (para RBAC por request)
    // Consulta critica: se ejecuta en cada request protegido.
    // El indice idx_user_roles_user garantiza rendimiento optimo.
    getPermissionsByUserId: async (userId) => {
        const [rows] = await pool.query(
            `SELECT DISTINCT p.id, p.code, p.resource, p.description
             FROM permissions p
             JOIN role_permissions rp ON p.id = rp.permission_id
             JOIN user_roles ur       ON rp.role_id = ur.role_id
             WHERE ur.user_id = ?
             ORDER BY p.resource, p.code`,
            [userId]
        );
        return rows;
    },

    // 8. Crear un nuevo rol con permisos (transaccion atomica)
    create: async ({ name, description, permissionIds }) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const [result] = await connection.query(
                "INSERT INTO roles (name, description) VALUES (?, ?)",
                [name, description ?? null]
            );
            const roleId = result.insertId;

            if (permissionIds && permissionIds.length > 0) {
                const values = permissionIds.map((pid) => [roleId, pid]);
                await connection.query(
                    "INSERT INTO role_permissions (role_id, permission_id) VALUES ?",
                    [values]
                );
            }

            await connection.commit();

            const [newRole] = await pool.query(
                `SELECT
                    r.id, r.name, r.description, r.is_system, r.created_at,
                    JSON_ARRAYAGG(
                        JSON_OBJECT('id', p.id, 'code', p.code, 'resource', p.resource)
                    ) AS permissions
                 FROM roles r
                 LEFT JOIN role_permissions rp ON r.id = rp.role_id
                 LEFT JOIN permissions p       ON p.id = rp.permission_id
                 WHERE r.id = ?
                 GROUP BY r.id`,
                [roleId]
            );
            return newRole[0];
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    },

    // 9. Actualizar un rol (PUT o PATCH) con sus permisos
    update: async (id, { name, description, permissionIds }) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Actualizar solo los campos que vienen definidos
            const fields = [];
            const values = [];
            if (name !== undefined)        { fields.push("name = ?");        values.push(name); }
            if (description !== undefined) { fields.push("description = ?"); values.push(description); }

            if (fields.length > 0) {
                values.push(id);
                await connection.query(
                    `UPDATE roles SET ${fields.join(", ")} WHERE id = ?`,
                    values
                );
            }

            // Reemplazar permisos si se envian
            if (permissionIds !== undefined) {
                await connection.query(
                    "DELETE FROM role_permissions WHERE role_id = ?",
                    [id]
                );
                if (permissionIds.length > 0) {
                    const permValues = permissionIds.map((pid) => [id, pid]);
                    await connection.query(
                        "INSERT INTO role_permissions (role_id, permission_id) VALUES ?",
                        [permValues]
                    );
                }
            }

            await connection.commit();

            const [updated] = await pool.query(
                `SELECT
                    r.id, r.name, r.description, r.is_system, r.created_at,
                    JSON_ARRAYAGG(
                        JSON_OBJECT('id', p.id, 'code', p.code, 'resource', p.resource)
                    ) AS permissions
                 FROM roles r
                 LEFT JOIN role_permissions rp ON r.id = rp.role_id
                 LEFT JOIN permissions p       ON p.id = rp.permission_id
                 WHERE r.id = ?
                 GROUP BY r.id`,
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

    // 10. Eliminar un rol (solo si no es de sistema)
    delete: async (id) => {
        const [result] = await pool.query(
            "DELETE FROM roles WHERE id = ? AND is_system = 0",
            [id]
        );
        return result.affectedRows > 0;
    },
};
