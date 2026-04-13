-- ============================================
-- PARTE 4: INSERTAR DATOS DE PRUEBA
-- ============================================

-- --------------------------------------------
-- USUARIOS
-- --------------------------------------------

INSERT INTO usuarios (documento, nombre, rol) VALUES
('0012345678', 'Dario Admin', 'admin'),
('0098765432', 'Maria Usuario', 'user'),
('0055555555', 'Carlos Cocinero', 'user'),
('0033333333', 'Ana Recepcionista', 'user');

-- --------------------------------------------
-- CATEGORIAS
-- --------------------------------------------

INSERT INTO categorias (nombre, descripcion) VALUES
('Bebidas', 'Bebidas calientes, frías y refrescos'),
('Entradas', 'Aperitivos y entradas para comenzar la comida'),
('Platos Fuertes', 'Platos principales con proteínas y acompañamientos'),
('Postres', 'Dulces y postres para finalizar la comida'),
('Desayunos', 'Opciones de desayuno tradicional y continental');

-- --------------------------------------------
-- PRODUCTOS
-- --------------------------------------------

INSERT INTO productos (nombre, descripcion, categoria_id, cantidad) VALUES
-- Bebidas
('Cafe Americano', 'Cafe negro tradicional', 1, 50),
('Jugo de Naranja', 'Jugo natural exprimido', 1, 30),
('Limonada Natural', 'Limonada con azucar y hierbabuena', 1, 40),

-- Entradas
('Ensalada Cesar', 'Lechuga, crutones, aderezo cesar y parmesano', 2, 20),
('Sopa de Tomate', 'Sopa cremosa de tomate con albahaca', 2, 15),

-- Platos Fuertes
('Pasta Alfredo', 'Fettuccine en salsa alfredo con pollo', 3, 20),
('Hamburguesa Clasica', 'Carne 200gr, queso cheddar, lechuga y tomate', 3, 30),

-- Postres
('Cheesecake', 'Tarta de queso con frutos rojos', 4, 15),

-- Desayunos
('Panqueques', 'Panqueques con miel y frutas', 5, 18);

-- --------------------------------------------
-- AUDIT_LOGS - Acciones CRUD del sistema
-- --------------------------------------------

INSERT INTO audit_logs (usuario_id, accion, tabla_afectada, registro_id, detalles) VALUES

-- CREAR: Categorias
(1, 'CREAR', 'categorias', 1, 'Creacion de categoria: Bebidas'),
(1, 'CREAR', 'categorias', 2, 'Creacion de categoria: Entradas'),
(1, 'CREAR', 'categorias', 3, 'Creacion de categoria: Platos Fuertes'),
(1, 'CREAR', 'categorias', 4, 'Creacion de categoria: Postres'),
(1, 'CREAR', 'categorias', 5, 'Creacion de categoria: Desayunos'),

-- CREAR: Productos
(1, 'CREAR', 'productos', 1, 'Creacion de producto: Cafe Americano'),
(1, 'CREAR', 'productos', 2, 'Creacion de producto: Jugo de Naranja'),
(2, 'CREAR', 'productos', 3, 'Creacion de producto: Limonada Natural'),
(3, 'CREAR', 'productos', 4, 'Creacion de producto: Ensalada Cesar'),
(3, 'CREAR', 'productos', 5, 'Creacion de producto: Sopa de Tomate'),
(2, 'CREAR', 'productos', 6, 'Creacion de producto: Pasta Alfredo'),
(3, 'CREAR', 'productos', 7, 'Creacion de producto: Hamburguesa Clasica'),
(2, 'CREAR', 'productos', 8, 'Creacion de producto: Cheesecake'),
(3, 'CREAR', 'productos', 9, 'Creacion de producto: Panqueques'),

-- ACTUALIZAR: Modificaciones completas
(1, 'ACTUALIZAR', 'productos', 1, 'Actualizacion completa: Cafe Americano - stock 40, descripcion modificada'),
(2, 'ACTUALIZAR', 'productos', 3, 'Actualizacion completa: Limonada Natural - nombre cambiado a Limonada Hierbabuena'),

-- ACTUALIZAR PARCIALMENTE: Cambios específicos
(1, 'ACTUALIZAR PARCIALMENTE', 'productos', 1, 'Cambio de stock: 40 -> 55 unidades'),
(3, 'ACTUALIZAR PARCIALMENTE', 'productos', 7, 'Cambio de categoria: 3 -> 2'),
(2, 'ACTUALIZAR PARCIALMENTE', 'productos', 6, 'Cambio de descripcion: agregado ingrediente parmesano'),

-- ELIMINAR: Eliminaciones de registros
(2, 'ELIMINAR', 'productos', 2, 'Eliminacion de producto: Jugo de Naranja - descontinuado'),
(1, 'ELIMINAR', 'categorias', 5, 'Eliminacion de categoria: Desayunos - fusionada con Platos Fuertes');