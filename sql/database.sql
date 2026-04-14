-- ============================================
-- PARTE 1: SEGURIDAD Y BASE DE DATOS
-- ============================================

-- Crear usuario específico para la aplicación 
CREATE USER IF NOT EXISTS 'app_user_dario'@'localhost' IDENTIFIED BY '#ADSO_node';

CREATE DATABASE IF NOT EXISTS rincon_gastronomico;

-- Asignar permisos limitados a la base de datos del proyecto
GRANT ALL PRIVILEGES ON rincon_gastronomico.* TO 'app_user_dario'@'localhost';
FLUSH PRIVILEGES;

USE rincon_gastronomico;

-- ============================================
-- PARTE 2: CREACION DE TABLAS
-- ============================================

-- 1. Usuarios (Requerimiento: Gestión de Usuarios)
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    documento VARCHAR(50) NOT NULL UNIQUE, -- String para preservar ceros a la izquierda
    nombre VARCHAR(100) NOT NULL,
    rol ENUM('admin', 'user') DEFAULT 'user',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Categorías (Requerimiento: Gestión de Categorías)
CREATE TABLE IF NOT EXISTS categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. Productos (Requerimiento: Módulo de Productos)
CREATE TABLE IF NOT EXISTS productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    categoria_id INT NOT NULL,
    cantidad INT DEFAULT 0,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_producto_categoria FOREIGN KEY (categoria_id) 
        REFERENCES categorias(id) ON DELETE RESTRICT
);

-- ============================================
-- PARTE 3: AUDITORÍA Y RENDIMIENTO
-- ============================================

-- 4. Audit Logs (Auditoría)
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    accion VARCHAR(50) NOT NULL, 
    tabla_afectada VARCHAR(50) NOT NULL,
    registro_id INT NOT NULL, 
    detalles TEXT, 
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT
);