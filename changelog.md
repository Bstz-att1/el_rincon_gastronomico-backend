
---

## 📦 Arquitectura de barriles (barrel pattern) + mejoras de schemas

Se implementó el **patrón barril** (*barrel pattern*) en todos los módulos del proyecto: cada carpeta de `src/` cuenta ahora con un `index.js` que centraliza y re-exporta todo lo que el módulo expone. Esto elimina rutas de importación largas y frágiles, unifica el punto de acceso a cada capa y simplifica futuros refactors. En paralelo se realizaron mejoras de validación en los seis schemas Zod existentes.

---

### Nuevos archivos — archivos barril (`index.js`)

#### `src/utils/index.js`
Punto de entrada único para las utilidades globales del proyecto.

**Exports:**
- `catchAsync` — wrapper para handlers async de Express.
- `successResponse`, `errorResponse`, `buildError`, `buildUnauthorizedError` — estandarización de respuestas HTTP.

#### `src/config/index.js`
Punto de entrada único para la configuración de la aplicación.

**Exports:**
- `pool` (named export) — pool de conexiones MySQL, re-exportado como named desde `db.js`.
- `JWT_CONFIG`, `validateJWTConfig` — configuración y validación de JWT.

> **Efecto secundario importante:** re-exportar `pool` desde `db.js` significa que cualquier módulo que importe desde `config/index.js` activa automáticamente el side-effect de verificación de conexión a MySQL, exactamente una vez (caché de módulos ES). El `import "./config/db.js"` explícito en `app.js` fue eliminado porque ahora es redundante.

#### `src/models/index.js`
Punto de entrada único para todos los modelos de la aplicación.

**Exports:**
- `AuditModel`, `CategoryModel`, `ProductModel`, `RoleModel`, `UserModel`.

#### `src/schemas/index.js`
Punto de entrada único para todos los schemas de validación Zod.

**Exports por módulo:**
- Auth: `loginSchema`
- Auditoría: `createAuditLogSchema`
- Categorías: `createCategorySchema`, `updateCategorySchema`, `patchCategorySchema`
- Productos: `createProductSchema`, `updateProductSchema`, `patchProductSchema`
- Roles: `createRoleSchema`, `updateRoleSchema`, `patchRoleSchema`
- Usuarios: `createUserSchema`, `updateUserSchema`, `patchUserSchema`

#### `src/controllers/index.js`
Punto de entrada único para todos los controladores (18 funciones exportadas).

**Exports por módulo:**
- Auth: `login`, `logout`, `getMe`
- Auditoría: `getAllAuditLogs`, `getAuditLogById`, `createAuditLog`
- Categorías: `getAllCategories`, `getCategoryById`, `createCategory`, `updateCategoryComplete`, `updateCategoryPartial`, `deleteCategory`
- Productos: `getAllProducts`, `getProductById`, `createProduct`, `updateProductComplete`, `updateProductPartial`, `deleteProduct`
- Roles: `getAllRoles`, `getAllPermissions`, `getRoleById`, `getRolePermissions`, `createRole`, `updateRoleComplete`, `updateRolePartial`, `deleteRole`
- Usuarios: `getAllUsers`, `getUserById`, `createUser`, `updateUserComplete`, `updateUserPartial`, `deleteUser`

#### `src/middlewares/index.js`
Punto de entrada único para todos los middlewares de la aplicación.

**Exports:**
- `authMiddleware` — verificación JWT y carga de `req.user`.
- `checkPermission` — control de acceso RBAC por código de permiso.
- `validate` — validación de body con schemas Zod.
- `notFoundHandler`, `globalErrorHandler` — manejadores globales de error (registrar al final en `app.js`).

#### `src/services/index.js`
Punto de entrada único para los servicios de la aplicación.

**Exports:**
- `signToken`, `verifyToken`, `extractTokenFromHeader` — operaciones JWT del servicio de tokens.

#### `src/routes/index.js`
Punto de entrada único para todos los routers de Express.

**Exports (re-exportados como named desde sus archivos):**
- `authRouter`, `userRouter`, `categoryRouter`, `productRouter`, `auditRouter`, `roleRouter`.

---

### Mejoras en schemas Zod

#### `src/schemas/auth.schema.js`
- `username`: añadido `max(50)` — alineado con el límite de la columna en base de datos.
- `password`: añadido `max(128)` — previene payloads excesivamente grandes sin exponer el límite real de bcrypt.

#### `src/schemas/audits.schema.js`
Refactor completo con campos reutilizables y validaciones más estrictas:

- **`action`** (nuevo): se define la constante `VALID_ACTIONS` con la lista cerrada de acciones permitidas: `CREATE`, `UPDATE`, `DELETE`, `LOGIN`, `LOGOUT`, `READ`, `RESTORE`, `ASSIGN`, `REVOKE`. El campo aplica `.toUpperCase()` para normalizar y `.refine()` para validar contra la lista. Antes solo había límites de longitud.
- **`affected_table`** (nuevo): aplica `.toLowerCase()` + regex `/^[a-z][a-z0-9_]*$/` para garantizar formato `snake_case`. Antes solo había límites de longitud.
- Todos los campos extraídos como constantes reutilizables: `userIdField`, `actionField`, `affectedTableField`, `recordIdField`, `detailsField`.
- Comentario de permiso requerido corregido de `audit.read` a `audit.create`.

#### `src/schemas/categories.schema.js`
- `updateCategorySchema` (PUT): se introduce `descriptionPutField` que acepta `string | null | undefined`, permitiendo limpiar explícitamente la descripción enviando `null`. Antes se requería un string obligatorio.
- Campos reutilizables documentados con JSDoc.

#### `src/schemas/products.schema.js`
- **`quantityField`**: cambiado de `.min(0, ...)` a `.nonnegative(...)` — semántica más precisa y descriptiva.
- **`descriptionField`**: añadido `.nullable()` en todos los schemas para permitir limpiar el campo enviando `null` en operaciones PUT/PATCH.
- JSDoc añadido a cada campo y schema de endpoint.

#### `src/schemas/roles.schema.js`
- **`permissionsField`**: añadida regex `/^[a-z_]+\.[a-z_]+$/` a cada elemento del array, forzando el formato `recurso.accion` (ej: `products.read`, `categories.create`). Antes solo se validaba que fuera un string no vacío, sin estructura.
- Mensaje de error en `.refine()` del schema PATCH mejorado para listar los campos actualizables.

#### `src/schemas/users.schema.js`
- **`passwordField`**: límite cambiado de `max(100)` a `max(72)` — alineado con el límite real de bcrypt (72 bytes), que silenciosamente ignora los caracteres adicionales; dejar pasar contraseñas más largas puede dar una falsa sensación de seguridad.
- **`passwordField`**: cadena de `.regex()` reemplazada por un único `.superRefine()` que acumula **todos** los errores de las cuatro reglas simultáneamente en lugar de detenerse en el primero. El cliente recibe todos los requisitos incumplidos en una sola respuesta.
- Campos reutilizables documentados con JSDoc.

---

### Archivos modificados — actualización de imports

Todos los archivos del proyecto actualizaron sus rutas de importación para consumir los barriles correspondientes en lugar de archivos individuales. Se detallan solo los cambios estructuralmente relevantes.

#### `src/models/*.model.js` (5 archivos)
- `import pool from "../config/db.js"` → `import { pool } from "../config/index.js"`.
- El import pasa de default a named (el barril re-exporta `pool` como named export).

#### `src/services/token.service.js`
- `../config/jwt.config.js` → `../config/index.js`
- `../utils/response.handler.js` → `../utils/index.js`

#### `src/middlewares/auth.middleware.js`
- `../models/users.model.js` → `../models/index.js`
- `../utils/response.handler.js` → `../utils/index.js`
- `../services/token.service.js` → `../services/index.js`

#### `src/middlewares/error.middleware.js`
- `../utils/response.handler.js` → `../utils/index.js`

#### `src/middlewares/rbac.middleware.js`
- `../models/roles.model.js` → `../models/index.js`
- `../utils/response.handler.js` y `../utils/catchAsync.js` → consolidados en `../utils/index.js`

#### `src/middlewares/validator.middleware.js`
- `../utils/response.handler.js` → `../utils/index.js`

#### `src/controllers/auth.controller.js`
- Cuatro imports individuales → `../models/index.js`, `../utils/index.js`, `../services/index.js`, `../config/index.js`.

#### `src/controllers/audits.controller.js`, `categories.controller.js`, `roles.controller.js`
- Imports de model y utils → `../models/index.js` y `../utils/index.js`.

#### `src/controllers/products.controller.js`
- **Consolidación:** `ProductModel` y `CategoryModel` se importan desde un único `import { ProductModel, CategoryModel } from "../models/index.js"` en lugar de dos imports separados.

#### `src/controllers/users.controller.js`
- **Consolidación:** `UserModel` y `RoleModel` se importan desde un único `import { UserModel, RoleModel } from "../models/index.js"`.

#### `src/routes/*.routes.js` (6 archivos)
Cada ruta reemplaza tres grupos de imports individuales por tres imports de barril:
- Controllers individuales → `../controllers/index.js`
- Middlewares individuales (`authMiddleware`, `checkPermission`, `validate`) → `../middlewares/index.js` (único import)
- Schemas individuales → `../schemas/index.js`

#### `src/app.js`
- `import "./config/db.js"` **eliminado** — el side-effect se activa automáticamente a través del barril de config.
- `../config/jwt.config.js` → `./config/index.js`
- Seis imports individuales de routers → un único import destructurado desde `./routes/index.js`.
- `./utils/response.handler.js` → `./utils/index.js`
- `./middlewares/error.middleware.js` → `./middlewares/index.js`

---

### Resumen de archivos por tipo de cambio

| Tipo | Archivo |
|------|---------|
| ✅ Creado | `src/utils/index.js` — barril de utilidades |
| ✅ Creado | `src/config/index.js` — barril de configuración |
| ✅ Creado | `src/models/index.js` — barril de modelos |
| ✅ Creado | `src/schemas/index.js` — barril de schemas |
| ✅ Creado | `src/controllers/index.js` — barril de controladores |
| ✅ Creado | `src/middlewares/index.js` — barril de middlewares |
| ✅ Creado | `src/services/index.js` — barril de servicios |
| ✅ Creado | `src/routes/index.js` — barril de rutas |
| 🔧 Mejorado | `src/schemas/auth.schema.js` (max en username y password) |
| 🔧 Mejorado | `src/schemas/audits.schema.js` (VALID_ACTIONS + regex affected_table) |
| 🔧 Mejorado | `src/schemas/categories.schema.js` (description nullable en PUT) |
| 🔧 Mejorado | `src/schemas/products.schema.js` (nonnegative + description nullable) |
| 🔧 Mejorado | `src/schemas/roles.schema.js` (regex formato recurso.accion) |
| 🔧 Mejorado | `src/schemas/users.schema.js` (max 72 bcrypt + superRefine) |
| 🔄 Modificado | `src/models/audits.model.js` (import pool desde barril) |
| 🔄 Modificado | `src/models/categories.model.js` (import pool desde barril) |
| 🔄 Modificado | `src/models/products.model.js` (import pool desde barril) |
| 🔄 Modificado | `src/models/roles.model.js` (import pool desde barril) |
| 🔄 Modificado | `src/models/users.model.js` (import pool desde barril) |
| 🔄 Modificado | `src/services/token.service.js` (imports a barriles) |
| 🔄 Modificado | `src/middlewares/auth.middleware.js` (imports a barriles) |
| 🔄 Modificado | `src/middlewares/error.middleware.js` (imports a barriles) |
| 🔄 Modificado | `src/middlewares/rbac.middleware.js` (imports a barriles) |
| 🔄 Modificado | `src/middlewares/validator.middleware.js` (imports a barriles) |
| 🔄 Modificado | `src/controllers/auth.controller.js` (imports a barriles) |
| 🔄 Modificado | `src/controllers/audits.controller.js` (imports a barriles) |
| 🔄 Modificado | `src/controllers/categories.controller.js` (imports a barriles) |
| 🔄 Modificado | `src/controllers/products.controller.js` (imports consolidados + barriles) |
| 🔄 Modificado | `src/controllers/roles.controller.js` (imports a barriles) |
| 🔄 Modificado | `src/controllers/users.controller.js` (imports consolidados + barriles) |
| 🔄 Modificado | `src/routes/auth.routes.js` (imports a barriles) |
| 🔄 Modificado | `src/routes/audits.routes.js` (imports a barriles) |
| 🔄 Modificado | `src/routes/categories.routes.js` (imports a barriles) |
| 🔄 Modificado | `src/routes/products.routes.js` (imports a barriles) |
| 🔄 Modificado | `src/routes/roles.routes.js` (imports a barriles) |
| 🔄 Modificado | `src/routes/users.routes.js` (imports a barriles) |
| 🔄 Modificado | `src/app.js` (import db eliminado + todos los imports a barriles) |

---

## 🔧 Revisión técnica final: documentación, robustez y seguridad

Revisión integral del backend orientada a calidad de código, robustez operacional y preparación para el desarrollo del frontend. No se modificó la lógica de negocio existente; todos los cambios son mejoras estructurales, correcciones de bugs menores y documentación completa.

### Correcciones de bugs

#### `package.json`
- **Bug crítico corregido:** el script `dev` apuntaba a `nodemon app.js` (archivo inexistente como entrypoint). Corregido a `nodemon server.js`.
- **Script añadido:** `"start": "node server.js"` para entornos de producción.
- Actualizado `description` y `keywords`.

#### `src/schemas/products.schema.js`
- **Bug lógico eliminado:** `updateProductSchema.quantity` tenía `.refine(v => v !== undefined, { message: "..." })`. Este refine es inalcanzable — Zod ya rechaza `undefined` antes de ejecutarlo cuando el campo no es `.optional()`. Se eliminó el refine redundante; el campo queda correctamente requerido sin él.

#### `sql/data.sql`
- **Permiso faltante añadido:** `audit.create` estaba documentado en el changelog anterior pero ausente del SQL. Se insertó la fila correspondiente en la tabla `permissions`. Total de permisos: 18 (antes 17).

#### `src/routes/audits.routes.js`
- **Permiso incorrecto corregido:** `POST /audit` usaba `checkPermission("audit.read")` (semánticamente erróneo para una operación de escritura). Corregido a `checkPermission("audit.create")`.
- Se añadió el middleware `validate(createAuditLogSchema)` al endpoint POST (antes carecía de validación Zod).

#### `src/controllers/audits.controller.js`
- **Validación manual eliminada:** `createAuditLog` tenía validación manual de campos (`if (!user_id || !action...)`) que quedó obsoleta al delegar la validación a `validate(createAuditLogSchema)` en la ruta. Se eliminó el bloque redundante.

---

### Nuevos archivos

#### `src/config/jwt.config.js` — Configuración y validación centralizadas de JWT

Nuevo módulo que centraliza toda la configuración JWT y añade validación obligatoria al arranque. Antes, los valores JWT estaban directamente en `token.service.js` sin validación de seguridad.

**Función `validateJWTConfig()`:**
- Se llama UNA SOLA VEZ en `app.js`, antes de inicializar Express.
- Valida que `JWT_SECRET` esté definida y tenga **mínimo 32 caracteres**.
- Valida que `JWT_EXPIRES_IN` esté definida.
- Si alguna validación falla, **lanza un `Error` que detiene la app** — no hay JWT inseguro por defecto.

**Objeto `JWT_CONFIG`** (exportado como `Object.freeze` — inmutable en runtime):
- `secret`:    `process.env.JWT_SECRET`
- `expiresIn`: `process.env.JWT_EXPIRES_IN` (default: `"8h"`)
- `algorithm`: `"HS256"` (fijo — lista blanca de algoritmos, evita ataque por sustitución de `alg`)
- `issuer`:    `process.env.JWT_ISSUER`   (default: `"rincon-gastronomico-api"`)
- `audience`:  `process.env.JWT_AUDIENCE` (default: `"rincon-gastronomico-app"`)

Consumido por `src/services/token.service.js` (firmar/verificar tokens) y `src/controllers/auth.controller.js` (exponer `expires_in` en la respuesta del login).

#### `src/schemas/audits.schema.js`
Schema Zod para la ruta `POST /audit`:
- `user_id`: entero positivo.
- `action`: string 1–50 chars, normalizado a MAYÚSCULAS (`.toUpperCase()`).
- `affected_table`: string 1–100 chars, normalizado a minúsculas (`.toLowerCase()`).
- `record_id`: entero positivo.
- `details`: string opcional, máximo 1000 chars.

---

### Mejoras de robustez y seguridad

#### `server.js`
- Almacena referencia del servidor: `const server = app.listen(...)`.
- `process.on("uncaughtException")`: loguea el error y cierra el servidor antes de `process.exit(1)`.
- `process.on("unhandledRejection")`: igual manejo para promesas rechazadas sin capturar.
- `process.on("SIGTERM")`: cierre graceful sin código de error (`process.exit(0)`).
- Mejora de logs de inicio con emojis y URL del servidor.

#### `src/app.js`
- **Validación JWT al arranque:** importa y llama a `validateJWTConfig()` desde `./config/jwt.config.js` antes de inicializar Express — la app no arranca con configuración JWT insegura.
- **CORS endurecido:** reemplazado `cors()` (todos los orígenes) por opciones configurables vía `CORS_ORIGIN` en `.env`. Incluye `methods`, `allowedHeaders` y `credentials`.
- **Límite de body:** añadido `limit: "10kb"` a `express.json()` y `express.urlencoded()` para mitigar ataques de payload masivo.
- Respuesta del endpoint de salud (`GET /`) enriquecida con objeto `data` (versión y entorno).
- Comentarios de sección numerados explicando el orden de los middlewares.

#### `src/config/db.js`
- **Fallo fatal:** añadido `process.exit(1)` en el `.catch()` de la verificación de conexión. La app no puede operar sin base de datos.
- `timezone: "Z"` (UTC) para consistencia de timestamps entre servidor y DB.
- `charset: "utf8mb4"` para soporte completo de Unicode (emojis, caracteres especiales).
- Prefijo de log `[DB]` para mejor trazabilidad en consola.

#### `.env.example` — Plantilla de entorno completamente documentada

Archivo de plantilla de variables de entorno reescrito para reflejar todas las variables requeridas, con comentarios explicativos en cada sección.

**Variables añadidas:**
- `NODE_ENV`: entorno de ejecución. Valores válidos: `development` | `production` | `test`.
- `CORS_ORIGIN`: origen del frontend permitido por la API. Ejemplos documentados:
  - Desarrollo con Vite/React: `http://localhost:5173`
  - Producción: `https://tudominio.com`
  - Sin restricción (solo dev): `*`

**Estructura de secciones resultante:**
```
── Servidor          → PORT, NODE_ENV
── Base de datos     → DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
── JWT               → JWT_SECRET, JWT_EXPIRES_IN, JWT_ISSUER, JWT_AUDIENCE
── CORS              → CORS_ORIGIN
```

**Mejoras de comentarios:**
- Cabecera con instrucciones paso a paso: copiar archivo → rellenar valores → no subir `.env` al repositorio.
- Comando de generación segura de `JWT_SECRET` (Node.js nativo, sin dependencias externas):
  ```
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```
- Descripción del propósito de `JWT_ISSUER` y `JWT_AUDIENCE` (validación multi-servicio).
- Valor de `JWT_SECRET` en el ejemplo claramente marcado como placeholder obligatorio.

---

### Documentación y calidad de código

#### `src/middlewares/error.middleware.js`
- JSDoc completo para `notFoundHandler` y `globalErrorHandler`.
- `globalErrorHandler` ahora loguea a consola solo los errores 500+ (los 4xx son flujo normal y no se loguean).
- Parámetros no utilizados renombrados: `next` → `_next` (convención explícita de intención).
- Comentario de sección explicando que ambos handlers deben registrarse al final de `app.js`.

#### `src/utils/catchAsync.js`
- JSDoc completo con `@param`, `@returns` y `@example`.

#### `src/utils/response.handler.js`
- JSDoc completo (`@param`, `@returns`) para las cuatro funciones exportadas: `successResponse`, `errorResponse`, `buildError`, `buildUnauthorizedError`.
- Cabecera de archivo documenta la estructura del sobre de respuesta JSON: `{ success, message, data, errors }`.

#### `src/middlewares/validator.middleware.js`
- JSDoc actualizado con `@example` mejorado.
- Parámetro no utilizado `res` renombrado a `_res`.
- Comentario aclarando por qué errores no-Zod se propagan con `next(err)`.

#### `src/middlewares/rbac.middleware.js`
- Lista de permisos en JSDoc actualizada para incluir `audit.create` bajo `audit.*`.

#### Controladores (JSDoc + mejoras menores)
- `src/controllers/audits.controller.js`: JSDoc para los tres handlers; `_req` para parámetros no utilizados.
- `src/controllers/categories.controller.js`: JSDoc completo; mensajes de error con template literals y comillas para los valores.
- `src/controllers/products.controller.js`: JSDoc completo; `parseId` expandido a forma multilínea; `_req` donde corresponde.
- `src/controllers/roles.controller.js`: JSDoc completo (handlers + helper `resolvePermissionIds`); `parseId` multilínea; mensajes de error mejorados.

#### Modelos (cabeceras y comentarios)
- `src/models/users.model.js`: corregidos artefactos de encoding UTF-8 (`â€"` → texto correcto); cabecera de archivo con principio `PUBLIC_FIELDS` y estrategia de transacciones; `ORDER BY u.id ASC` en `findAll()`; `ORDER BY r.name ASC` en `getRoleNamesByUserId()`.
- `src/models/audits.model.js`: corregido artefacto de encoding; cabecera documentando inmutabilidad por diseño.
- `src/models/categories.model.js`: cabecera con nota de constraint FK; comentarios mejorados; `patch()` reformateado.
- `src/models/products.model.js`: cabecera explicando estrategia de JOIN para `category_name`.
- `src/models/roles.model.js`: cabecera documentando estructura RBAC, restricciones `is_system` y notas de rendimiento.

#### Rutas (cabeceras y reformateo)
- `src/routes/auth.routes.js`: cabecera explicando todos los endpoints y sus requisitos de auth.
- `src/routes/users.routes.js`: tabla de permisos por ruta; comentarios por endpoint.
- `src/routes/categories.routes.js`: tabla de permisos; comentarios por endpoint.
- `src/routes/products.routes.js`: tabla de permisos; comentarios por endpoint.
- `src/routes/roles.routes.js`: tabla de permisos completa; nota crítica sobre el orden de registro de `GET /permissions` vs `GET /:id`.
- `src/routes/audits.routes.js`: cabecera explicando la inmutabilidad de los registros de auditoría.

---

### Resumen de archivos por tipo de cambio

| Tipo | Archivo |
|------|---------|
| ✅ Creado | `src/config/jwt.config.js` (validación obligatoria al arranque + configuración centralizada de JWT) |
| ✅ Creado | `src/schemas/audits.schema.js` |
| 🐛 Bug corregido | `package.json` (script `dev` apuntaba al archivo incorrecto) |
| 🐛 Bug corregido | `src/schemas/products.schema.js` (`.refine()` inalcanzable eliminado) |
| 🐛 Bug corregido | `sql/data.sql` (permiso `audit.create` faltante añadido) |
| 🐛 Bug corregido | `src/routes/audits.routes.js` (permiso POST corregido a `audit.create`) |
| 🐛 Bug corregido | `src/controllers/audits.controller.js` (validación manual redundante eliminada) |
| 🔒 Seguridad | `src/app.js` (CORS configurable + límite de body 10kb) |
| 💪 Robustez | `server.js` (manejadores de proceso + cierre graceful) |
| 💪 Robustez | `src/config/db.js` (process.exit(1) en fallo de conexión + UTC + utf8mb4) |
| 📝 Documentación | `src/middlewares/error.middleware.js` |
| 📝 Documentación | `src/middlewares/rbac.middleware.js` (audit.create en JSDoc) |
| 📝 Documentación | `src/middlewares/validator.middleware.js` |
| 📝 Documentación | `src/utils/catchAsync.js` |
| 📝 Documentación | `src/utils/response.handler.js` |
| 📝 Documentación | `src/controllers/audits.controller.js` |
| 📝 Documentación | `src/controllers/categories.controller.js` |
| 📝 Documentación | `src/controllers/products.controller.js` |
| 📝 Documentación | `src/controllers/roles.controller.js` |
| 📝 Documentación | `src/models/users.model.js` |
| 📝 Documentación | `src/models/audits.model.js` |
| 📝 Documentación | `src/models/categories.model.js` |
| 📝 Documentación | `src/models/products.model.js` |
| 📝 Documentación | `src/models/roles.model.js` |
| 📝 Documentación | `src/routes/auth.routes.js` |
| 📝 Documentación | `src/routes/users.routes.js` |
| 📝 Documentación | `src/routes/categories.routes.js` |
| 📝 Documentación | `src/routes/products.routes.js` |
| 📝 Documentación | `src/routes/roles.routes.js` |
| 📝 Documentación | `src/routes/audits.routes.js` |
| ⚙️ Configuración | `.env.example` (NODE_ENV + CORS_ORIGIN añadidos) |

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

---

## [Unreleased] — 2026-06-06

### Corregido

- **`sql/data.sql`** — Los 4 hashes bcrypt del seed no correspondían a sus contraseñas documentadas. Causa: los hashes fueron generados con una herramienta diferente o se corrompieron. Se regeneraron y verificaron localmente con `bcryptjs` (cost 10) mediante el comando:
  ```
  node --input-type=module -e "import bcrypt from 'bcryptjs'; console.log(await bcrypt.hash('PASS', 10))"
  ```
  Hashes corregidos:
  - `admin` → `Admin123!` → `$2a$10$koLIjddENG.yQNgD/WOL3.8RDKkZm5Wpua52EpRqyMVInwm3sDOTu`
  - `maria` → `User123!`  → `$2a$10$u2noMHjJN2utpEF9QH90Wuk8w961Xo9oUh9Rnk4/DAHn1yfZpaPzK`
  - `carlos` → `User123!` → `$2a$10$GwnSSCtJevFLuVYKF9WjhOGiwrgRDC0JI6tJLbq9NBoBJEKYAlOsO`
  - `ana` → `Super123!`   → `$2a$10$yrnNHXCuI6dPpAWsLBfV7OvUEA61XZP3sh8lQnhmzYijajzHWvuYu`

- **`sql/data.sql`** — Los nombres de usuario tenían el rol incrustado en el campo `name`, mezclando dato e identidad. Actualizados a nombres reales:
  - `"Dario Admin"` → `"Dario Herrera"`
  - `"Maria Usuario"` → `"Maria García"`
  - `"Carlos Cocinero"` → `"Carlos Ramírez"`
  - `"Ana Supervisora"` → `"Ana Martínez"`

### SQL de aplicación en base de datos activa

Para aplicar estos cambios sobre una base de datos ya inicializada sin re-ejecutar el seed completo:

```sql
USE rincon_gastronomico;

-- Corregir hashes de contraseña
UPDATE users SET password_hash = '$2a$10$koLIjddENG.yQNgD/WOL3.8RDKkZm5Wpua52EpRqyMVInwm3sDOTu' WHERE username = 'admin';
UPDATE users SET password_hash = '$2a$10$u2noMHjJN2utpEF9QH90Wuk8w961Xo9oUh9Rnk4/DAHn1yfZpaPzK' WHERE username = 'maria';
UPDATE users SET password_hash = '$2a$10$GwnSSCtJevFLuVYKF9WjhOGiwrgRDC0JI6tJLbq9NBoBJEKYAlOsO' WHERE username = 'carlos';
UPDATE users SET password_hash = '$2a$10$yrnNHXCuI6dPpAWsLBfV7OvUEA61XZP3sh8lQnhmzYijajzHWvuYu' WHERE username = 'ana';

-- Corregir nombres de usuario
UPDATE users SET name = 'Dario Herrera'  WHERE username = 'admin';
UPDATE users SET name = 'Maria García'   WHERE username = 'maria';
UPDATE users SET name = 'Carlos Ramírez' WHERE username = 'carlos';
UPDATE users SET name = 'Ana Martínez'   WHERE username = 'ana';
```
