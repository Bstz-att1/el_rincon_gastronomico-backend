-- ============================================
-- MIGRACION 002: RBAC COMPLETO + RENOMBRADO A INGLES
-- ============================================
-- Esta migracion transforma el esquema existente para:
-- 1. Renombrar tablas y columnas al estandar en ingles
-- 2. Agregar el sistema RBAC completo (roles, permissions, user_roles, role_permissions)
-- ADVERTENCIA: Ejecutar en un entorno de prueba antes de produccion.
-- ============================================

USE rincon_gastronomico;

-- ============================================
-- PASO 1: RENOMBRAR TABLAS EXISTENTES
-- ============================================

-- Renombrar tabla de usuarios
RENAME TABLE usuarios TO users;

-- Renombrar tabla de categorias
RENAME TABLE categorias TO categories;

-- Renombrar tabla de productos
RENAME TABLE productos TO products;

-- ============================================
-- PASO 2: RENOMBRAR COLUMNAS DE LA TABLA users
-- ============================================

ALTER TABLE users
    CHANGE COLUMN documento     document     VARCHAR(50)  NOT NULL,
    CHANGE COLUMN nombre        name         VARCHAR(100) NOT NULL,
    CHANGE COLUMN creado_en     created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    CHANGE COLUMN actualizado_en updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Eliminar columna rol (reemplazada por RBAC)
ALTER TABLE users DROP COLUMN IF EXISTS rol;

-- ============================================
-- PASO 3: RENOMBRAR COLUMNAS DE categories
-- ============================================

ALTER TABLE categories
    CHANGE COLUMN nombre        name         VARCHAR(100) NOT NULL,
    CHANGE COLUMN descripcion   description  TEXT,
    CHANGE COLUMN creado_en     created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHANGE COLUMN actualizado_en updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- ============================================
-- PASO 4: RENOMBRAR COLUMNAS DE products
-- ============================================

ALTER TABLE products
    CHANGE COLUMN nombre        name         VARCHAR(150) NOT NULL,
    CHANGE COLUMN descripcion   description  TEXT,
    CHANGE COLUMN categoria_id  category_id  INT NOT NULL,
    CHANGE COLUMN cantidad      quantity     INT DEFAULT 0,
    CHANGE COLUMN creado_en     created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHANGE COLUMN actualizado_en updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Actualizar la FK renombrada
ALTER TABLE products DROP FOREIGN KEY fk_producto_categoria;
ALTER TABLE products ADD CONSTRAINT fk_product_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT;

-- ============================================
-- PASO 5: RENOMBRAR COLUMNAS DE audit_logs
-- ============================================

ALTER TABLE audit_logs
    CHANGE COLUMN usuario_id    user_id        INT NOT NULL,
    CHANGE COLUMN accion        action         VARCHAR(50) NOT NULL,
    CHANGE COLUMN tabla_afectada affected_table VARCHAR(50) NOT NULL,
    CHANGE COLUMN registro_id   record_id      INT NOT NULL,
    CHANGE COLUMN detalles      details        TEXT,
    CHANGE COLUMN fecha         created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Actualizar FK de audit_logs
ALTER TABLE audit_logs DROP FOREIGN KEY audit_logs_ibfk_1;
ALTER TABLE audit_logs ADD CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT;

-- ============================================
-- PASO 6: CREAR TABLAS RBAC
-- ============================================

CREATE TABLE IF NOT EXISTS roles (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(50)  NOT NULL UNIQUE,
    description VARCHAR(255),
    is_system   TINYINT(1)   NOT NULL DEFAULT 0,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    code        VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    resource    VARCHAR(50)  NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id     INT NOT NULL,
    role_id     INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
    FOREIGN KEY (role_id)  REFERENCES roles(id)  ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id       INT NOT NULL,
    permission_id INT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id)       REFERENCES roles(id)       ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- Indices de rendimiento para consultas RBAC frecuentes
CREATE INDEX idx_user_roles_user        ON user_roles(user_id);
CREATE INDEX idx_role_permissions_role  ON role_permissions(role_id);
CREATE INDEX idx_permissions_code       ON permissions(code);
CREATE INDEX idx_permissions_resource   ON permissions(resource);
