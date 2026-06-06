-- ============================================
-- DATOS SEMILLA — RINCON GASTRONOMICO
-- ============================================

USE rincon_gastronomico;

-- ── 1. ROLES DEL SISTEMA ─────────────────────────────────────────────────────
-- is_system = 1 → protegidos, no eliminables ni modificables via API
INSERT INTO roles (name, description, is_system) VALUES
('admin',      'Acceso total al sistema. Gestiona usuarios, roles, productos, categorias y auditoria.', 1),
('supervisor', 'Gestiona productos y categorias, consulta auditoria y usuarios, sin eliminar.',          1),
('user',       'Usuario basico. Solo puede consultar productos y categorias.',                           1);

-- ── 2. PERMISOS DEL SISTEMA (patrón: resource.action) ────────────────────────
INSERT INTO permissions (code, description, resource) VALUES
('users.read',        'Consultar la lista y detalle de usuarios',              'users'),
('users.create',      'Registrar nuevos usuarios en el sistema',               'users'),
('users.update',      'Actualizar datos de usuarios existentes',               'users'),
('users.delete',      'Eliminar usuarios del sistema',                         'users'),
('roles.read',        'Consultar roles y sus permisos asignados',              'roles'),
('roles.create',      'Crear nuevos roles con sus permisos',                   'roles'),
('roles.update',      'Actualizar nombre, descripcion y permisos de un rol',   'roles'),
('roles.delete',      'Eliminar roles del sistema',                            'roles'),
('categories.read',   'Consultar lista y detalle de categorias',               'categories'),
('categories.create', 'Registrar nuevas categorias',                           'categories'),
('categories.update', 'Actualizar datos de categorias existentes',             'categories'),
('categories.delete', 'Eliminar categorias del sistema',                       'categories'),
('products.read',     'Consultar lista y detalle de productos',                'products'),
('products.create',   'Registrar nuevos productos',                            'products'),
('products.update',   'Actualizar datos de productos existentes',              'products'),
('products.delete',   'Eliminar productos del sistema',                        'products'),
('audit.read',        'Consultar registros de auditoria del sistema',          'audit'),
('audit.create',      'Crear registros de auditoria manualmente',              'audit');

-- ── 3. ASIGNACIÓN DE PERMISOS A ROLES ────────────────────────────────────────

-- Admin → TODOS los permisos (incluye audit.create)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = 'admin';

-- Supervisor → gestión de productos/categorías + lectura (sin audit.create ni deletes)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
    'users.read',
    'roles.read',
    'categories.read', 'categories.create', 'categories.update',
    'products.read',   'products.create',   'products.update',
    'audit.read'
)
WHERE r.name = 'supervisor';

-- User → solo consulta de productos y categorías
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN ('categories.read', 'products.read')
WHERE r.name = 'user';

-- ── 4. USUARIOS DE PRUEBA ─────────────────────────────────────────────────────
-- Contraseñas hasheadas con bcrypt (cost 10):
--   admin  → Admin123!   |  ana    → Super123!
--   maria  → User123!    |  carlos → User123!
INSERT INTO users (document, name, username, password_hash) VALUES
('0012345678', 'Dario Herrera',   'admin',  '$2a$10$koLIjddENG.yQNgD/WOL3.8RDKkZm5Wpua52EpRqyMVInwm3sDOTu'),
('0098765432', 'Maria García',    'maria',  '$2a$10$u2noMHjJN2utpEF9QH90Wuk8w961Xo9oUh9Rnk4/DAHn1yfZpaPzK'),
('0055555555', 'Carlos Ramírez',  'carlos', '$2a$10$GwnSSCtJevFLuVYKF9WjhOGiwrgRDC0JI6tJLbq9NBoBJEKYAlOsO'),
('0033333333', 'Ana Martínez',    'ana',    '$2a$10$yrnNHXCuI6dPpAWsLBfV7OvUEA61XZP3sh8lQnhmzYijajzHWvuYu');

-- ── 5. ASIGNACIÓN DE ROLES A USUARIOS ────────────────────────────────────────
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'admin'  AND r.name = 'admin';

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'maria'  AND r.name = 'user';

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'carlos' AND r.name = 'user';

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'ana'    AND r.name = 'supervisor';

-- ── 6. CATEGORÍAS ─────────────────────────────────────────────────────────────
INSERT INTO categories (name, description) VALUES
('Beverages',    'Bebidas calientes, frias y refrescos'),
('Starters',     'Aperitivos y entradas para comenzar la comida'),
('Main Courses', 'Platos principales con proteinas y acompañamientos'),
('Desserts',     'Dulces y postres para finalizar la comida'),
('Breakfasts',   'Opciones de desayuno tradicional y continental');

-- ── 7. PRODUCTOS ──────────────────────────────────────────────────────────────
INSERT INTO products (name, description, category_id, quantity) VALUES
('Americano Coffee', 'Cafe negro tradicional',                         1, 50),
('Orange Juice',     'Jugo natural exprimido',                         1, 30),
('Lemonade',         'Limonada con azucar y hierbabuena',              1, 40),
('Caesar Salad',     'Lechuga, crutones, aderezo cesar y parmesano',   2, 20),
('Tomato Soup',      'Sopa cremosa de tomate con albahaca',            2, 15),
('Alfredo Pasta',    'Fettuccine en salsa alfredo con pollo',          3, 20),
('Classic Burger',   'Carne 200gr, queso cheddar, lechuga y tomate',   3, 30),
('Cheesecake',       'Tarta de queso con frutos rojos',                4, 15),
('Pancakes',         'Panqueques con miel y frutas',                   5, 18);

-- ── 8. AUDITORÍA INICIAL ──────────────────────────────────────────────────────
INSERT INTO audit_logs (user_id, action, affected_table, record_id, details) VALUES
(1, 'CREATE',         'categories', 1, 'Creacion de categoria: Beverages'),
(1, 'CREATE',         'categories', 2, 'Creacion de categoria: Starters'),
(1, 'CREATE',         'categories', 3, 'Creacion de categoria: Main Courses'),
(1, 'CREATE',         'products',   1, 'Creacion de producto: Americano Coffee'),
(1, 'CREATE',         'products',   6, 'Creacion de producto: Alfredo Pasta'),
(1, 'UPDATE',         'products',   1, 'Actualizacion stock: Americano Coffee -> 50 unidades'),
(4, 'CREATE',         'products',   4, 'Creacion de producto: Caesar Salad'),
(4, 'PARTIAL UPDATE', 'products',   3, 'Cambio de nombre: Lemonade Natural');
