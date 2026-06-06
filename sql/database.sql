-- ============================================
-- PARTE 1: SEGURIDAD Y BASE DE DATOS
-- ============================================

CREATE USER IF NOT EXISTS 'app_user_dario'@'localhost' IDENTIFIED BY '#ADSO_node';

CREATE DATABASE IF NOT EXISTS rincon_gastronomico;

GRANT ALL PRIVILEGES ON rincon_gastronomico.* TO 'app_user_dario'@'localhost';
FLUSH PRIVILEGES;

USE rincon_gastronomico;

-- ============================================
-- PARTE 2: TABLAS BASE DEL SISTEMA
-- ============================================

-- 1. Usuarios del sistema
-- El campo 'role' fue eliminado — el control de acceso se maneja
-- integramente a traves de las tablas RBAC (roles, permissions, user_roles).
CREATE TABLE IF NOT EXISTS users (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    document      VARCHAR(50)  NOT NULL UNIQUE,
    name          VARCHAR(100) NOT NULL,
    username      VARCHAR(50)  NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    -- token_version: mecanismo de invalidacion de sesiones sin blacklist externa.
    -- Se incrementa en cada logout. authMiddleware compara este valor con
    -- el claim tokenVersion del JWT; si no coinciden, el token es rechazado.
    token_version INT UNSIGNED NOT NULL DEFAULT 0,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Categorias de productos
CREATE TABLE IF NOT EXISTS categories (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. Productos del restaurante
CREATE TABLE IF NOT EXISTS products (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(150) NOT NULL,
    description TEXT,
    category_id INT NOT NULL,
    quantity    INT DEFAULT 0,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_product_category
        FOREIGN KEY (category_id)
        REFERENCES categories(id)
        ON DELETE RESTRICT
);

-- ============================================
-- PARTE 3: AUDITORIA
-- ============================================

-- 4. Registro de auditoria de acciones en el sistema
CREATE TABLE IF NOT EXISTS audit_logs (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    user_id        INT NOT NULL,
    action         VARCHAR(50) NOT NULL,
    affected_table VARCHAR(50) NOT NULL,
    record_id      INT NOT NULL,
    details        TEXT,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- ============================================
-- PARTE 4: TABLAS RBAC (Control de Acceso Basado en Roles)
-- ============================================

-- 5. Roles — Agrupaciones de permisos (ej: 'admin', 'supervisor', 'user')
CREATE TABLE IF NOT EXISTS roles (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(50)  NOT NULL UNIQUE,
    description VARCHAR(255),
    -- is_system = 1: rol protegido del sistema, no se puede eliminar via API
    is_system   TINYINT(1)   NOT NULL DEFAULT 0,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Permisos — Acciones atomicas sobre un recurso
-- El codigo sigue el patron: resource.action  (ej: 'users.delete', 'products.create')
CREATE TABLE IF NOT EXISTS permissions (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    code        VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    resource    VARCHAR(50)  NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Relacion Usuarios <-> Roles (muchos a muchos)
CREATE TABLE IF NOT EXISTS user_roles (
    user_id     INT NOT NULL,
    role_id     INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
    FOREIGN KEY (role_id)  REFERENCES roles(id)  ON DELETE CASCADE
);

-- 8. Relacion Roles <-> Permisos (muchos a muchos)
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id       INT NOT NULL,
    permission_id INT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id)       REFERENCES roles(id)       ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- ============================================
-- PARTE 5: INDICES DE RENDIMIENTO
-- ============================================

-- Acelera busquedas de permisos por usuario (consulta frecuente en cada request autenticado)
CREATE INDEX idx_user_roles_user         ON user_roles(user_id);
CREATE INDEX idx_role_permissions_role   ON role_permissions(role_id);
CREATE INDEX idx_permissions_code        ON permissions(code);
CREATE INDEX idx_permissions_resource    ON permissions(resource);
