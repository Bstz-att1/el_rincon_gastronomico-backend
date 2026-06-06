
---

## 🛡️ Actualización reciente: RBAC completo + esquema en inglés + validación con Zod

Se implementó un sistema completo de **Control de Acceso Basado en Roles (RBAC)** con permisos granulares, validación de entradas con Zod y renombrado total del esquema de base de datos al inglés. Esta actualización reemplaza el sistema anterior de `checkRole` por una arquitectura de permisos por código (`resource.action`), haciendo el sistema más flexible, escalable y seguro.

### Motivación

El sistema anterior presentaba las siguientes limitaciones:
- El control de acceso era por rol genérico (`admin`/`user`) sin granularidad de permisos.
- No existía tabla de permisos — las reglas estaban hardcodeadas en el código.
- Las tablas y columnas de la base de datos mezclaban español e inglés (`usuarios`, `nombre`, `categorias`, `usuario_id`).
- No había validación de esquemas de entrada (Zod o similar) — la validación era manual en cada controlador.
- No existía módulo CRUD para roles y permisos.

---

### Base de datos

#### `sql/database.sql` — Reescritura completa al inglés + tablas RBAC

Todas las tablas y columnas fueron renombradas al inglés. Se agregaron cuatro tablas nuevas para el sistema RBAC.

**Tablas renombradas:**

| Antes | Después |
|-------|---------|
| `usuarios` | `users` |
| `categorias` | `categories` |
| `productos` | `products` |
| `audit_logs` | `audit_logs` (sin cambio de nombre) |

**Columnas renombradas en `users`:**

| Antes | Después |
|-------|---------|
| `documento` | `document` |
| `nombre` | `name` |
| `rol ENUM(...)` | eliminada — reemplazada por tabla `user_roles` |
| `creado_en` | `created_at` |
| `actualizado_en` | `updated_at` |

**Columnas renombradas en `categories`:**

| Antes | Después |
|-------|---------|
| `nombre` | `name` |
| `descripcion` | `description` |
| `creado_en` | `created_at` |
| `actualizado_en` | `updated_at` |

**Columnas renombradas en `products`:**

| Antes | Después |
|-------|---------|
| `nombre` | `name` |
| `descripcion` | `description` |
| `categoria_id` | `category_id` |
| `cantidad` | `quantity` |

**Columnas renombradas en `audit_logs`:**

| Antes | Después |
|-------|---------|
| `usuario_id` | `user_id` |
| `accion` | `action` |
| `tabla_afectada` | `affected_table` |
| `registro_id` | `record_id` |
| `detalles` | `details` |
| `fecha` | `created_at` |

**Tablas RBAC nuevas:**

```sql
-- Roles del sistema
CREATE TABLE roles (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(50)  NOT NULL UNIQUE,
    description VARCHAR(255),
    is_system   TINYINT(1)   NOT NULL DEFAULT 0,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Permisos atómicos con patrón resource.action
CREATE TABLE permissions (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code        VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    resource    VARCHAR(50)  NOT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Relación muchos-a-muchos usuarios ↔ roles
CREATE TABLE user_roles (
    user_id     INT UNSIGNED NOT NULL,
    role_id     INT UNSIGNED NOT NULL,
    assigned_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);

-- Relación muchos-a-muchos roles ↔ permisos
CREATE TABLE role_permissions (
    role_id       INT UNSIGNED NOT NULL,
    permission_id INT UNSIGNED NOT NULL,
    PRIMARY KEY (role_id, permission_id)
);
```

**Índices de rendimiento agregados:**
- `idx_user_roles_user` en `user_roles(user_id)`
- `idx_role_permissions_role` en `role_permissions(role_id)`
- `idx_permissions_code` en `permissions(code)`
- `idx_permissions_resource` en `permissions(resource)`

#### `sql/data.sql` — Reescritura completa al inglés + datos RBAC

- Todos los `INSERT` actualizados a columnas en inglés (`document`, `name`, `username`, etc.).
- 3 roles de sistema: `admin`, `supervisor`, `user` (con `is_system = 1`).
- 17 permisos con patrón `resource.action`:
  - `users.read`, `users.create`, `users.update`, `users.delete`
  - `categories.read`, `categories.create`, `categories.update`, `categories.delete`
  - `products.read`, `products.create`, `products.update`, `products.delete`
  - `roles.read`, `roles.create`, `roles.update`, `roles.delete`
  - `audit.read`, `audit.create`
- Asignación de permisos por rol:
  - `admin`: los 17 permisos.
  - `supervisor`: 9 permisos (lectura y creación en todos los módulos, sin delete).
  - `user`: 2 permisos (`users.read`, `products.read`).
- Usuarios semilla con columnas en inglés y roles asignados vía `user_roles`.

#### `sql/migrations/002_rbac_english_schema.sql` — Migración para bases existentes

Script de migración para bases de datos que ya tenían el esquema anterior:
- `RENAME TABLE usuarios TO users`, `categorias TO categories`, `productos TO products`.
- `ALTER TABLE` para renombrar columnas a inglés en cada tabla.
- `DROP COLUMN rol` de `users`.
- Creación de las 4 tablas RBAC (`roles`, `permissions`, `user_roles`, `role_permissions`).
- Inserción de roles, permisos y asignaciones semilla.

---

### Archivos creados

#### 1) `src/schemas/auth.schema.js`
Schema Zod para la ruta de autenticación:
- `loginSchema`: `username` (string, trim, mínimo 1 carácter), `password` (string, mínimo 1 carácter).

#### 2) `src/schemas/users.schema.js`
Schemas Zod para el módulo de usuarios:
- `createUserSchema`:
  - `document`: solo dígitos, 5–50 caracteres.
  - `name`: string, 2–100 caracteres.
  - `username`: alfanumérico y guion bajo, 3–50 caracteres.
  - `password`: mínimo 8 caracteres, requiere mayúscula, minúscula, número y carácter especial.
  - `roles`: arreglo de strings no vacíos, mínimo 1 rol.
- `updateUserSchema`: `name` + `roles[]` (ambos requeridos para PUT).
- `patchUserSchema`: `name` y `roles[]` opcionales, con `.refine()` que exige al menos uno.

#### 3) `src/schemas/roles.schema.js`
Schemas Zod para el módulo de roles:
- `createRoleSchema`: `name` (alfanumérico, 2–50 chars), `description` (opcional), `permissions[]` (códigos `resource.action`).
- `updateRoleSchema`: nombre + permisos (ambos requeridos para PUT).
- `patchRoleSchema`: nombre y/o permisos opcionales, al menos uno requerido.

#### 4) `src/schemas/categories.schema.js`
Schemas Zod para el módulo de categorías:
- `createCategorySchema`: `name` (2–100 chars), `description` (opcional).
- `updateCategorySchema`: `name` + `description` (ambos para PUT).
- `patchCategorySchema`: `name` y/o `description` opcionales, al menos uno requerido.

#### 5) `src/schemas/products.schema.js`
Schemas Zod para el módulo de productos:
- `createProductSchema`: `name`, `description` (opcional), `category_id` (entero positivo), `quantity` (≥0, default 0).
- `updateProductSchema`: todos los campos requeridos para PUT.
- `patchProductSchema`: campos opcionales, al menos uno requerido.

#### 6) `src/middlewares/validator.middleware.js`
Middleware genérico de validación con Zod:
- `validate(schema)`: envuelve `schema.parse(req.body)`.
  - Si la validación pasa, reemplaza `req.body` con los datos parseados y limpiados.
  - Si falla, llama a `next(buildError("Error de validacion", 400, errors))` con los errores formateados como `[field]: message`.
  - Intercepta `ZodError` para producir respuestas 400 estructuradas antes de llegar al controlador.

#### 7) `src/middlewares/rbac.middleware.js`
Middleware de autorización por permiso:
- `checkPermission(requiredPermission)`:
  - Obtiene el `userId` desde `req.user.id` (establecido por `authMiddleware`).
  - Consulta `RoleModel.getPermissionsByUserId(userId)` — join de `permissions → role_permissions → user_roles`.
  - Almacena los permisos en `req.user.permissions` para trazabilidad.
  - Si el código requerido no está en la lista del usuario, llama a `next(buildError("Acceso denegado", 403, [...]))`.
  - Si el permiso existe, llama a `next()`.

#### 8) `src/models/roles.model.js`
Modelo para la gestión de roles y permisos del sistema:

- `findAll()`: lista todos los roles con sus permisos en arreglo JSON (`JSON_ARRAYAGG`).
- `findById(id)`: busca rol por id, incluye permisos asignados.
- `findByName(name)`: busca por nombre único.
- `findAllPermissions()`: lista completa de permisos disponibles en el sistema.
- `findPermissionsByRoleId(roleId)`: permisos asignados a un rol específico.
- `findPermissionsByCodes(codes)`: resuelve códigos de permiso a sus IDs de DB.
- `getPermissionsByUserId(userId)`: **consulta crítica del RBAC** — join `permissions → role_permissions → user_roles → users`, retorna todos los permisos del usuario a través de sus roles.
- `create({ name, description, permissions })`: crea rol con transacción atómica — inserta rol e inserta en `role_permissions` en una sola operación.
- `update(id, { name, description, permissions })`: actualización completa con transacción — reemplaza todos los permisos del rol.
- `patch(id, { name, description, permissions })`: actualización parcial — solo modifica campos enviados.
- `delete(id)`: elimina el rol únicamente si `is_system = 0`; retorna error 403 para roles de sistema.

#### 9) `src/controllers/roles.controller.js`
Controlador para CRUD de roles y consulta de permisos:

- `getAllRoles`: lista todos los roles con sus permisos.
- `getAllPermissions`: lista todos los permisos definidos en el sistema.
- `getRoleById`: busca rol por id, responde 404 si no existe.
- `getRolePermissions`: permisos asignados a un rol específico.
- `resolvePermissionIds(codes, next)`: helper interno que resuelve códigos de permiso a IDs, retorna `null` y llama a `next(buildError(...))` si algún código no existe.
- `createRole`: valida unicidad de nombre, resuelve permisos, crea rol con transacción.
- `updateRoleComplete` (PUT): valida existencia, protege roles de sistema (`is_system = 1` → 403), actualiza nombre y permisos.
- `updateRolePartial` (PATCH): igual que PUT pero solo campos enviados.
- `deleteRole`: verifica existencia y que `is_system = 0` antes de eliminar.

#### 10) `src/routes/roles.routes.js`
Router para el módulo de roles con autenticación y permisos:

- `GET /roles/permissions` — lista todos los permisos del sistema.
- `GET /roles` — lista todos los roles.
- `GET /roles/:id` — obtiene rol por id.
- `GET /roles/:id/permissions` — permisos de un rol específico.
- `POST /roles` — crea nuevo rol (con validación Zod).
- `PUT /roles/:id` — actualización completa de rol.
- `PATCH /roles/:id` — actualización parcial de rol.
- `DELETE /roles/:id` — elimina rol (solo si no es de sistema).

Todos los endpoints requieren `authMiddleware` + `checkPermission("roles.*")`.

---

### Archivos modificados

#### 11) `src/services/token.service.js`
- `signToken(user, roleNames = [])`:
  - El payload ahora incluye `name` (antes `nombre`) y `roles` como arreglo de strings (antes `rol` como string único).
  - Los nombres de roles se obtienen de DB en login y se pasan como segundo argumento.
  - `tokenVersion` permanece en el payload para el mecanismo de invalidación de sesiones.
- `verifyToken` y `extractTokenFromHeader` sin cambios funcionales.

#### 12) `src/middlewares/auth.middleware.js`
- Se eliminó la exportación `checkRole()` — reemplazada por `checkPermission()` en `rbac.middleware.js`.
- La validación de 5 capas se mantiene completa.
- `req.user` se sigue construyendo desde DB con datos frescos: `{ id, username, name }`.
- Capa 3 actualizada: verifica `id` y `username` (ya no verifica `rol` — los roles se consultan por separado en RBAC).

#### 13) `src/controllers/auth.controller.js`
- `login`:
  - Consulta `roleNames = await UserModel.getRoleNamesByUserId(user.id)` tras autenticar.
  - Llama a `signToken(user, roleNames)` — el token ahora incluye `roles[]`.
  - La respuesta exitosa incluye `roles` del usuario autenticado.
  - Validación de login ahora delegada al schema: `validate(loginSchema)` se aplica en la ruta.
- `logout` y `getMe` sin cambios funcionales.

#### 14) `src/models/users.model.js`
- Todas las queries migradas a columnas en inglés (`document`, `name`, `username`, `password_hash`, `token_version`, `created_at`, `updated_at`).
- `FIND_WITH_ROLES`: nueva constante con JOIN a `user_roles` y `roles`, retorna `JSON_ARRAYAGG(r.name) AS roles`.
- `create()`, `update()`, `patch()`: usan `getConnection()` + `beginTransaction()` para asignar roles de forma atómica.
- Nuevo método `getRoleNamesByUserId(userId)`: retorna array de nombres de roles — usado en login para incluirlos en el JWT.
- `findByDocument()` reemplaza `findByDocumento()`.
- `findByUsernamePublic()` sin cambios.

#### 15) `src/models/categories.model.js`
- Todas las queries migradas a inglés: tabla `categories`, columnas `name`, `description`, `created_at`, `updated_at`.
- Métodos: `findAll`, `findById`, `findByName`, `create`, `update`, `patch`, `delete`.
- `findByName()` reemplaza `findByNombre()`.

#### 16) `src/models/products.model.js`
- Tabla renombrada a `products`, columnas a inglés: `name`, `description`, `category_id`, `quantity`.
- JOIN con `categories` para incluir `category_name` en las consultas de listado y búsqueda por id.
- Métodos: `findAll`, `findById`, `create`, `update`, `patch`, `delete`.

#### 17) `src/models/audits.model.js`
- Tabla `audit_logs` actualizada a columnas en inglés: `user_id`, `action`, `affected_table`, `record_id`, `details`, `created_at`.
- JOIN con `users` para incluir `user_name` en los resultados.
- Métodos disponibles: solo `findAll`, `findById`, `create` — **no hay update ni delete** (logs inmutables por diseño).

#### 18) `src/controllers/users.controller.js`
- Campos actualizados a inglés: `document`, `name`, `username`, `password`, `roles`.
- `resolveRoleIds(roleNames, next)`: helper que resuelve nombres de roles a IDs de DB; retorna `null` y propaga error si algún rol no existe.
- Protección de auto-eliminación: `if (id === req.user.id)` → 403.
- Validación de entrada delegada a `validate(schema)` en la ruta.

#### 19) `src/controllers/categories.controller.js`
- Campos actualizados a inglés: `name`, `description`.
- Verificación de nombre duplicado en PUT y PATCH.
- Validación de entrada delegada a `validate(schema)` en la ruta.

#### 20) `src/controllers/products.controller.js`
- Campos actualizados a inglés: `name`, `description`, `category_id`, `quantity`.
- Verifica existencia de `category_id` antes de crear o actualizar.
- Validación de entrada delegada a `validate(schema)` en la ruta.

#### 21) `src/controllers/audits.controller.js`
- Campos actualizados a inglés: `user_id`, `action`, `affected_table`, `record_id`, `details`.
- Solo expone: `getAllAuditLogs`, `getAuditLogById`, `createAuditLog` — sin update ni delete.

#### 22) `src/routes/auth.routes.js`
- Validación de login movida a la capa de ruta:
  - `POST /auth/login` → aplica `validate(loginSchema)` antes del controlador.
- `POST /auth/logout` y `GET /auth/me` sin cambios.

#### 23) `src/routes/users.routes.js`
- `checkRole(...)` reemplazado por `checkPermission("users.read/create/update/delete")`.
- `validate(schema)` aplicado en cada ruta con su schema correspondiente.

#### 24) `src/routes/categories.routes.js`
- `checkRole(...)` reemplazado por `checkPermission("categories.*")`.
- `validate(schema)` aplicado por método HTTP.

#### 25) `src/routes/products.routes.js`
- `checkRole(...)` reemplazado por `checkPermission("products.*")`.
- `validate(schema)` aplicado por método HTTP.

#### 26) `src/routes/audits.routes.js`
- Solo expone `GET /`, `GET /:id` y `POST /` — sin PUT, PATCH ni DELETE.
- `POST /` también requiere `checkPermission("audit.read")` (solo roles administrativos pueden registrar eventos).

#### 27) `src/app.js`
- URLs de rutas actualizadas al inglés:
  - `/usuarios` → `/users`
  - `/categorias` → `/categories`
  - `/productos` → `/products`
  - `/auditoria` → `/audit`
- Nueva ruta registrada: `app.use("/roles", roleRouter)`.
- Import de `roleRouter` desde `./routes/roles.routes.js`.

---

### Permisos del sistema

| Código | Recurso | Descripción |
|--------|---------|-------------|
| `users.read` | users | Ver usuarios |
| `users.create` | users | Crear usuarios |
| `users.update` | users | Editar usuarios |
| `users.delete` | users | Eliminar usuarios |
| `categories.read` | categories | Ver categorías |
| `categories.create` | categories | Crear categorías |
| `categories.update` | categories | Editar categorías |
| `categories.delete` | categories | Eliminar categorías |
| `products.read` | products | Ver productos |
| `products.create` | products | Crear productos |
| `products.update` | products | Editar productos |
| `products.delete` | products | Eliminar productos |
| `roles.read` | roles | Ver roles y permisos |
| `roles.create` | roles | Crear roles |
| `roles.update` | roles | Editar roles |
| `roles.delete` | roles | Eliminar roles |
| `audit.read` | audit | Ver y registrar auditoría |
| `audit.create` | audit | Crear registros de auditoría |

### Roles de sistema predefinidos

| Rol | Permisos | Protegido |
|-----|----------|-----------|
| `admin` | Todos los 17 permisos | ✅ Sí (`is_system = 1`) |
| `supervisor` | Lectura + creación en todos los módulos | ✅ Sí (`is_system = 1`) |
| `user` | `users.read`, `products.read` | ✅ Sí (`is_system = 1`) |

---

### Endpoints nuevos disponibles

Base: `/roles`

1. `GET /roles` — lista todos los roles con sus permisos
2. `GET /roles/permissions` — lista todos los permisos del sistema
3. `GET /roles/:id` — obtiene un rol por id
4. `GET /roles/:id/permissions` — permisos asignados a un rol
5. `POST /roles` — crea un rol nuevo
   - body: `{ "name": "...", "description": "...", "permissions": ["users.read", "products.read"] }`
6. `PUT /roles/:id` — actualización completa de rol
   - body: `{ "name": "...", "permissions": ["users.read"] }`
7. `PATCH /roles/:id` — actualización parcial de rol
   - body parcial: `{ "name": "..." }` o `{ "permissions": [...] }`
8. `DELETE /roles/:id` — elimina un rol (solo si no es de sistema)

### Rutas renombradas

| Antes | Después |
|-------|---------|
| `POST /auth/login` | sin cambio (payload ampliado con `roles[]`) |
| `GET /usuarios` | `GET /users` |
| `POST /usuarios` | `POST /users` |
| `GET /categorias` | `GET /categories` |
| `POST /categorias` | `POST /categories` |
| `GET /productos` | `GET /products` |
| `POST /productos` | `POST /products` |
| `GET /auditoria` | `GET /audit` |
| `POST /auditoria` | `POST /audit` |

---

### Instrucción de migración para base de datos existente

Para bases de datos que ya tienen el esquema anterior, ejecutar:

```sql
-- sql/migrations/002_rbac_english_schema.sql
-- 1. Renombrar tablas
RENAME TABLE usuarios TO users;
RENAME TABLE categorias TO categories;
RENAME TABLE productos TO products;

-- 2. Renombrar columnas (ver archivo completo para detalles)
-- 3. Crear tablas RBAC (roles, permissions, user_roles, role_permissions)
-- 4. Insertar roles y permisos semilla
```

Para bases de datos nuevas, el script `sql/database.sql` ya incluye todo el esquema actualizado.

---

### Resumen de archivos por tipo de cambio

| Tipo | Archivo |
|------|---------|
| ✅ Creado | `src/schemas/auth.schema.js` |
| ✅ Creado | `src/schemas/users.schema.js` |
| ✅ Creado | `src/schemas/roles.schema.js` |
| ✅ Creado | `src/schemas/categories.schema.js` |
| ✅ Creado | `src/schemas/products.schema.js` |
| ✅ Creado | `src/middlewares/validator.middleware.js` |
| ✅ Creado | `src/middlewares/rbac.middleware.js` |
| ✅ Creado | `src/models/roles.model.js` |
| ✅ Creado | `src/controllers/roles.controller.js` |
| ✅ Creado | `src/routes/roles.routes.js` |
| ✅ Creado | `sql/migrations/002_rbac_english_schema.sql` |
| 🔄 Modificado | `sql/database.sql` |
| 🔄 Modificado | `sql/data.sql` |
| 🔄 Modificado | `src/services/token.service.js` |
| 🔄 Modificado | `src/middlewares/auth.middleware.js` |
| 🔄 Modificado | `src/controllers/auth.controller.js` |
| 🔄 Modificado | `src/controllers/users.controller.js` |
| 🔄 Modificado | `src/controllers/categories.controller.js` |
| 🔄 Modificado | `src/controllers/products.controller.js` |
| 🔄 Modificado | `src/controllers/audits.controller.js` |
| 🔄 Modificado | `src/models/users.model.js` |
| 🔄 Modificado | `src/models/categories.model.js` |
| 🔄 Modificado | `src/models/products.model.js` |
| 🔄 Modificado | `src/models/audits.model.js` |
| 🔄 Modificado | `src/routes/auth.routes.js` |
| 🔄 Modificado | `src/routes/users.routes.js` |
| 🔄 Modificado | `src/routes/categories.routes.js` |
| 🔄 Modificado | `src/routes/products.routes.js` |
| 🔄 Modificado | `src/routes/audits.routes.js` |
| 🔄 Modificado | `src/app.js` |
