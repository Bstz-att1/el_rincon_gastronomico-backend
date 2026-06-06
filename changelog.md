# Changelog

## Resumen general
Se implementó el módulo de **categorías** siguiendo la misma arquitectura y lógica ya usada en el módulo de **usuarios**:
- Capa de **modelo** (`models`)
- Capa de **controlador** (`controllers`)
- Capa de **rutas** (`routes`)
- Registro de rutas en la app principal (`app.js`)

El objetivo fue mantener consistencia en estilo, validaciones, estructura CRUD y formato de respuestas.

---

## Archivos creados

### 1) `src/models/categoria.model.js`
Se creó el modelo `CategoryModel` con operaciones CRUD sobre la tabla `categorias`:

- `findAll()`
  - Consulta: `SELECT * FROM categorias`
- `findById(id)`
  - Consulta por id: `SELECT * FROM categorias WHERE id = ?`
- `findByNombre(nombre)`
  - Validación de duplicados por nombre
- `create({ nombre, descripcion })`
  - Inserta categoría nueva
  - Usa `descripcion || null` si no llega descripción
  - Retorna el registro recién creado
- `updateComplete(id, { nombre, descripcion })`
  - Actualización completa (PUT)
  - Exige ambos campos (`nombre` y `descripcion`)
  - Si no hay filas afectadas retorna `null`
  - Retorna el registro actualizado
- `updatePartial(id, updatedFields)`
  - Actualización parcial (PATCH)
  - Usa `COALESCE` para actualizar solo campos enviados
  - Si no hay filas afectadas retorna `null`
  - Retorna el registro actualizado
- `delete(id)`
  - Elimina por id y retorna booleano (`affectedRows > 0`)

---

### 2) `src/controllers/categoria.controller.js`
Se creó el controlador de categorías con manejo de respuestas estandarizado vía:
- `successResponse`
- `errorResponse`

Funciones implementadas:

- `getAllCategories`
  - Retorna lista completa de categorías
- `getCategoryById`
  - Busca por id y responde 404 si no existe
- `createCategory`
  - Valida `nombre` obligatorio
  - Verifica duplicado con `findByNombre`
  - Crea y retorna categoría nueva
- `updateCategoryComplete`
  - Valida `nombre` y `descripcion` obligatorios
  - Usa `updateComplete`
  - Responde 404 si no existe el id
- `updateCategoryPartial`
  - Exige al menos un campo (`nombre` o `descripcion`)
  - Usa `updatePartial`
  - Responde 404 si no existe el id
- `deleteCategory`
  - Verifica existencia previa con `findById`
  - Elimina y responde éxito o 404 si no existe

Notas:
- Se mantiene el mismo patrón que usuarios en mensajes, estructura try/catch y códigos HTTP usados en el proyecto.

---

### 3) `src/routes/categoria.routes.js`
Se creó el router `categoryRouter` con CRUD completo:

- `GET /` → `getAllCategories`
- `GET /:id` → `getCategoryById`
- `POST /` → `createCategory`
- `PUT /:id` → `updateCategoryComplete`
- `PATCH /:id` → `updateCategoryPartial`
- `DELETE /:id` → `deleteCategory`

---

## Archivos modificados

### 4) `src/app.js`
Se integró el módulo de categorías en la aplicación principal:

Cambios:
- Import agregado:
  - `import categoryRouter from "./routes/categoria.routes.js";`
- Registro de ruta:
  - `app.use("/categorias", categoryRouter);`

Se conservaron intactas:
- Configuración de middlewares JSON/urlencoded
- Ruta raíz `/`
- Ruta de usuarios `/usuarios`

---

## Consistencia con base de datos
La tabla `categorias` ya existe en `sql/database.sql` con estructura compatible:
- `id` (PK autoincremental)
- `nombre` (único, obligatorio)
- `descripcion` (texto)
- `creado_en`, `actualizado_en`

No fue necesario modificar esquema SQL para soportar el módulo nuevo.

---

## Endpoints nuevos disponibles

Base: `/categorias`

1. `GET /categorias`
2. `GET /categorias/:id`
3. `POST /categorias`
   - body mínimo: `{ "nombre": "..." }`
4. `PUT /categorias/:id`
   - body requerido: `{ "nombre": "...", "descripcion": "..." }`
5. `PATCH /categorias/:id`
   - body parcial: `{ "nombre": "..." }` o `{ "descripcion": "..." }`
6. `DELETE /categorias/:id`

---

## Validaciones y comportamiento importante

- Creación:
  - `nombre` obligatorio
  - No permite nombres duplicados (409)
- PUT:
  - Requiere ambos campos (`nombre`, `descripcion`)
- PATCH:
  - Requiere al menos un campo para actualizar
- Operaciones por id:
  - Si el recurso no existe responde 404
- Respuestas:
  - Estandarizadas con utilidades del proyecto (`response.handler.js`)

---

## Actualización reciente: Módulo de Productos

Se implementó el módulo de **productos** manteniendo la misma arquitectura de capas y estilo ya aplicado en usuarios/categorías:
- `models`
- `controllers`
- `routes`
- integración en `app.js`

Objetivo: respetar la lógica existente del proyecto y cumplir los requerimientos de la tabla `productos` definida en la base de datos.

### Archivos creados

#### 1) `src/models/producto.model.js`
Se creó `ProductModel` con CRUD para la tabla `productos`:

- `findAll()`
  - Consulta: `SELECT * FROM productos`
- `findById(id)`
  - Consulta por id: `SELECT * FROM productos WHERE id = ?`
- `create({ nombre, descripcion, categoria_id, cantidad })`
  - Inserta producto nuevo
  - Usa `descripcion || null`
  - Usa `cantidad ?? 0` (alineado con default de DB)
  - Retorna el registro recién creado
- `updateComplete(id, { nombre, descripcion, categoria_id, cantidad })`
  - PUT completo
  - Exige: `nombre`, `categoria_id`, `cantidad`
  - Si no afecta filas retorna `null`
  - Retorna registro actualizado
- `updatePartial(id, updatedFields)`
  - PATCH parcial
  - Usa `COALESCE` en `nombre`, `descripcion`, `categoria_id`, `cantidad`
  - Si no afecta filas retorna `null`
  - Retorna registro actualizado
- `delete(id)`
  - Elimina por id y retorna booleano (`affectedRows > 0`)

#### 2) `src/controllers/producto.controller.js`
Se creó el controlador con respuestas estandarizadas (`successResponse`, `errorResponse`):

- `getAllProducts`
  - Lista completa de productos
- `getProductById`
  - Busca por id, responde 404 si no existe
- `createProduct`
  - Valida obligatorios: `nombre`, `categoria_id`
  - Crea producto y retorna resultado
- `updateProductComplete`
  - Valida obligatorios para PUT: `nombre`, `categoria_id`, `cantidad`
  - Responde 404 si el id no existe
- `updateProductPartial`
  - Exige al menos un campo entre:
    - `nombre`, `descripcion`, `categoria_id`, `cantidad`
  - Responde 404 si el id no existe
- `deleteProduct`
  - Verifica existencia previa con `findById`
  - Elimina y responde éxito o 404

#### 3) `src/routes/producto.routes.js`
Se creó `productRouter` con CRUD completo:

- `GET /` → `getAllProducts`
- `GET /:id` → `getProductById`
- `POST /` → `createProduct`
- `PUT /:id` → `updateProductComplete`
- `PATCH /:id` → `updateProductPartial`
- `DELETE /:id` → `deleteProduct`

### Archivos modificados

#### 4) `src/app.js`
Se integró el módulo de productos:

- Import agregado:
  - `import productRouter from "./routes/producto.routes.js";`
- Registro de ruta:
  - `app.use("/productos", productRouter);`

### Consistencia con base de datos (`productos`)
Compatibilidad con `sql/database.sql`:
- `nombre` (obligatorio)
- `descripcion` (opcional)
- `categoria_id` (obligatorio, FK a `categorias.id`)
- `cantidad` (default 0)

### Endpoints nuevos disponibles

Base: `/productos`

1. `GET /productos`
2. `GET /productos/:id`
3. `POST /productos`
   - body mínimo: `{ "nombre": "...", "categoria_id": 1 }`
4. `PUT /productos/:id`
   - body requerido: `{ "nombre": "...", "descripcion": "...", "categoria_id": 1, "cantidad": 10 }`
5. `PATCH /productos/:id`
   - body parcial con cualquiera de:
     - `nombre`, `descripcion`, `categoria_id`, `cantidad`
6. `DELETE /productos/:id`

---

## Actualización reciente: Módulo de Auditoría

Se implementó el módulo de **auditoría** manteniendo la misma arquitectura de capas y estilo ya aplicado en usuarios/categorías/productos:
- `models`
- `controllers`
- `routes`
- integración en `app.js`

Objetivo: respetar la lógica existente del proyecto y cumplir los requerimientos de la tabla `audit_logs` definida en la base de datos.

### Archivos creados

#### 1) `src/models/auditoria.model.js`
Se creó `AuditModel` con CRUD para la tabla `audit_logs`:

- `findAll()`
  - Consulta: `SELECT * FROM audit_logs`
- `findById(id)`
  - Consulta por id: `SELECT * FROM audit_logs WHERE id = ?`
- `create({ usuario_id, accion, tabla_afectada, registro_id, detalles })`
  - Inserta registro de auditoría nuevo
  - Usa `detalles || null`
  - Retorna el registro recién creado
- `updateComplete(id, { usuario_id, accion, tabla_afectada, registro_id, detalles })`
  - PUT completo
  - Exige: `usuario_id`, `accion`, `tabla_afectada`, `registro_id`
  - Si no afecta filas retorna `null`
  - Retorna registro actualizado
- `updatePartial(id, updatedFields)`
  - PATCH parcial
  - Usa `COALESCE` en `usuario_id`, `accion`, `tabla_afectada`, `registro_id`, `detalles`
  - Si no afecta filas retorna `null`
  - Retorna registro actualizado
- `delete(id)`
  - Elimina por id y retorna booleano (`affectedRows > 0`)

#### 2) `src/controllers/auditoria.controller.js`
Se creó el controlador con respuestas estandarizadas (`successResponse`, `errorResponse`):

- `getAllAuditLogs`
  - Lista completa de registros de auditoría
- `getAuditLogById`
  - Busca por id, responde 404 si no existe
- `createAuditLog`
  - Valida obligatorios: `usuario_id`, `accion`, `tabla_afectada`, `registro_id`
  - Crea registro y retorna resultado
- `updateAuditLogComplete`
  - Valida obligatorios para PUT: `usuario_id`, `accion`, `tabla_afectada`, `registro_id`
  - Responde 404 si el id no existe
- `updateAuditLogPartial`
  - Exige al menos un campo entre:
    - `usuario_id`, `accion`, `tabla_afectada`, `registro_id`, `detalles`
  - Responde 404 si el id no existe
- `deleteAuditLog`
  - Verifica existencia previa con `findById`
  - Elimina y responde éxito o 404

#### 3) `src/routes/auditoria.routes.js`
Se creó `auditRouter` con CRUD completo:

- `GET /` → `getAllAuditLogs`
- `GET /:id` → `getAuditLogById`
- `POST /` → `createAuditLog`
- `PUT /:id` → `updateAuditLogComplete`
- `PATCH /:id` → `updateAuditLogPartial`
- `DELETE /:id` → `deleteAuditLog`

### Archivos modificados

#### 4) `src/app.js`
Se integró el módulo de auditoría:

- Import agregado:
  - `import auditRouter from "./routes/auditoria.routes.js";`
- Registro de ruta:
  - `app.use("/auditoria", auditRouter);`

### Consistencia con base de datos (`audit_logs`)
Compatibilidad con `sql/database.sql`:
- `usuario_id` (obligatorio, FK a `usuarios.id`)
- `accion` (obligatorio)
- `tabla_afectada` (obligatorio)
- `registro_id` (obligatorio)
- `detalles` (opcional)
- `fecha` (timestamp con default `CURRENT_TIMESTAMP`)

No fue necesario modificar esquema SQL para soportar el módulo nuevo.

### Endpoints nuevos disponibles

Base: `/auditoria`

1. `GET /auditoria`
2. `GET /auditoria/:id`
3. `POST /auditoria`
   - body mínimo: `{ "usuario_id": 1, "accion": "INSERT", "tabla_afectada": "productos", "registro_id": 10 }`
4. `PUT /auditoria/:id`
   - body requerido: `{ "usuario_id": 1, "accion": "UPDATE", "tabla_afectada": "productos", "registro_id": 10, "detalles": "Cambio de cantidad" }`
5. `PATCH /auditoria/:id`
   - body parcial con cualquiera de:
     - `usuario_id`, `accion`, `tabla_afectada`, `registro_id`, `detalles`
6. `DELETE /auditoria/:id`

### Validaciones y comportamiento importante

- Creación:
  - Requiere `usuario_id`, `accion`, `tabla_afectada`, `registro_id`
- PUT:
  - Requiere `usuario_id`, `accion`, `tabla_afectada`, `registro_id`
- PATCH:
  - Requiere al menos un campo para actualizar
- Operaciones por id:
  - Si el recurso no existe responde 404
- Respuestas:
  - Estandarizadas con utilidades del proyecto (`response.handler.js`)

---

## Actualización reciente: Integración Frontend ↔ Backend (Vanilla JS + API REST)

Se implementó la integración entre frontend y backend manteniendo la arquitectura establecida en el plan de mejoramiento:

- Backend: habilitación de CORS y mantenimiento del estándar de respuestas JSON.
- Frontend: centralización de llamadas HTTP en módulo API y consumo real desde vistas modulares.
- Documentación: actualización de README con ejemplos de consumo para frontend y curl.

### Backend

#### `src/app.js`
- Se agregó middleware CORS:
  - `import cors from "cors";`
  - `app.use(cors());`
- Se conserva sin cambios la estructura de rutas por módulo:
  - `/usuarios`
  - `/categorias`
  - `/productos`
  - `/auditoria`
- Se mantiene respuesta estandarizada en `/` con `successResponse`.

### Frontend

#### 1) Nuevo módulo `assets/js/api.js`
Se creó un módulo centralizado para llamadas REST con `fetch`, `Content-Type: application/json` y manejo uniforme de errores.

Funciones incluidas:

- Usuarios:
  - `getAllUsers()`
  - `getUserById(id)`
  - `createUser(userData)`
- Categorías:
  - `getAllCategories()`
  - `getCategoryById(id)`
  - `createCategory(categoryData)`
- Productos:
  - `getAllProducts()`
  - `getProductById(id)`
  - `createProduct(productData)`
- Auditoría:
  - `getAllAuditLogs()`
  - `getAuditLogById(id)`
  - `createAuditLog(auditData)`

#### 2) Archivo barril `assets/js/index.js`
- Se centralizaron exportaciones del módulo API junto con los módulos de vista.
- Se mantiene modularización por archivo y consumo limpio desde otros módulos.

#### 3) Integración en vistas

##### `assets/js/usuarios.js`
- Se reemplazó persistencia local como fuente principal por consumo backend:
  - listado dinámico con `getAllUsers()`
  - creación con `createUser()`
- Se envían formularios en JSON (`documento`, `nombre`, `rol`).
- Se mantiene fallback visual de usuarios para continuidad de interfaz si hay error de red.
- Se conserva login local de demostración (`admin/admin123`) para no romper flujo existente.

##### `assets/js/inventario.js`
- Se integró consumo de:
  - categorías (`getAllCategories`, `createCategory`)
  - productos (`getAllProducts`, `createProduct`)
  - usuarios (`getAllUsers`) para contexto de auditoría.
- Se inyectan dinámicamente:
  - listado de categorías
  - selects de categorías para formulario y filtro
  - tabla de inventario con datos backend
- Se envía formulario de producto en JSON:
  - `nombre`
  - `descripcion` (usando campo proveedor actual)
  - `categoria_id`
  - `cantidad`
- Se agregó registro de auditoría posterior a creación de producto (`createAuditLog`) sin bloquear UX si falla.

##### `assets/js/auditoria.js`
- Se migró de lectura local a consumo backend:
  - consulta de auditoría con `getAllAuditLogs`
  - consulta de usuarios con `getAllUsers`
  - creación de registros con `createAuditLog`
- Se renderiza resumen por usuario usando registros de auditoría reales.
- Se renderiza tabla por usuario con:
  - acción
  - tabla afectada
  - detalles
- El formulario envía payload JSON al endpoint `/auditoria`.

### Documentación

#### `README.md`
- Se agregó sección **Consumo desde Frontend (fetch/curl)**:
  - explicación de CORS
  - URL base sugerida
  - ejemplos `fetch` (GET/POST) para usuarios, categorías, productos, auditoría
  - ejemplos `curl` para Windows CMD usando `^`

### Resultado de la integración
- Frontend desacoplado por módulos y conectado al backend vía API central.
- Endpoints principales consumidos con `fetch`.
- Formularios enviando datos en JSON.
- Estructura de capas y estilo arquitectónico preservados.

---

## 🔐 Actualización reciente: Autenticación JWT + Autorización por Rol (admin/user)

Se implementó seguridad de acceso basada en usuarios existentes de base de datos, contraseñas hasheadas y control de permisos por rol.

### Cambios en backend

#### Dependencias (`package.json`)
Se agregaron librerías de seguridad:
- `bcryptjs` (hash/validación de contraseñas)
- `jsonwebtoken` (emisión/verificación de JWT)

#### Nuevos archivos
- `src/controllers/auth.controller.js`
  - Implementa `POST /auth/login`.
  - Valida credenciales contra tabla `usuarios`.
  - Compara contraseña en texto con `password_hash` usando bcrypt.
  - Genera JWT con datos mínimos del usuario (`id`, `nombre`, `username`, `rol`).
- `src/routes/auth.routes.js`
  - Expone ruta de autenticación:
    - `POST /auth/login`
- `src/middlewares/auth.middleware.js`
  - `authMiddleware`: valida `Authorization: Bearer <token>`.
  - `checkRole(...roles)`: permite/deniega acceso por rol.

#### Archivos modificados
- `src/app.js`
  - Se registró módulo de auth:
    - `app.use("/auth", authRouter);`
- `src/models/usuario.model.js`
  - Se añadieron operaciones para autenticación:
    - `findByUsername(username)`
    - búsqueda con contraseña para login.
  - Se reforzó sanitización para no exponer `password_hash` en listados públicos.
  - `create` actualizado para soportar:
    - `username`
    - `password_hash`
- `src/controllers/usuario.controller.js`
  - En creación de usuario:
    - recibe `username` y `password`
    - genera hash bcrypt antes de persistir
    - valida duplicidad por `documento` y `username`
- `src/routes/usuario.routes.js`
- `src/routes/categoria.routes.js`
- `src/routes/producto.routes.js`
- `src/routes/auditoria.routes.js`
  - Se protegieron rutas con:
    - `authMiddleware`
    - `checkRole("admin", "user")` para lecturas.
    - `checkRole("admin")` para creación/edición/eliminación (acciones administrativas).

#### SQL actualizado
- `sql/database.sql`
  - Tabla `usuarios` ampliada con:
    - `username` (UNIQUE, obligatorio)
    - `password_hash` (obligatorio)
  - Roles mantenidos según requerimiento: `admin` y `user`.
- `sql/data.sql`
  - Datos semilla actualizados al nuevo esquema:
    - incluye `username`
    - incluye `password_hash`

### Endpoints impactados

#### Autenticación
- `POST /auth/login`
  - body: `{ "username": "...", "password": "..." }`
  - respuesta exitosa: token JWT + usuario autenticado

#### Endpoints protegidos (requieren Bearer token)
- `/usuarios`
- `/categorias`
- `/productos`
- `/auditoria`

### Reglas de rol aplicadas
- `admin`:
  - acceso completo CRUD en todos los módulos.
- `user`:
  - acceso de consulta (GET) en módulos protegidos.
  - sin permisos administrativos de creación/edición/eliminación en rutas restringidas.

---

## 🧩 Actualización reciente: Estandarización profesional de respuestas y manejo global de errores

Se reorganizó el manejo de respuestas y errores para hacer el backend más mantenible, consistente y profesional, reduciendo duplicación de lógica en controladores.

### Objetivo del cambio
- Centralizar el tratamiento de errores.
- Estandarizar completamente el contrato de respuestas.
- Eliminar `try/catch` repetitivos en controladores asíncronos.
- Mantener compatibilidad con la arquitectura y estilo del proyecto.

### Archivos creados

#### 1) `src/utils/catchAsync.js`
Se agregó utilidad para envolver controladores asíncronos y delegar errores al middleware global:

- `catchAsync(fn)`
  - Retorna función `(req, res, next)`.
  - Ejecuta `Promise.resolve(fn(...)).catch(next)` para capturar errores sin repetir `try/catch`.

#### 2) `src/middlewares/error.middleware.js`
Se creó middleware centralizado de errores:

- `notFoundHandler`
  - Responde 404 para rutas no registradas.
  - Mensaje incluye método y URL solicitada.
- `globalErrorHandler`
  - Toma `statusCode`, `message` y `errors` desde errores controlados.
  - Usa `errorResponse` para mantener formato unificado.

### Archivos modificados

#### 3) `src/utils/response.handler.js`
Se reforzó la utilidad de respuestas:

- `successResponse(res, statusCode, message, data = [])`
  - Incluye ahora `errors: []` para mantener estructura uniforme.
- `errorResponse(res, statusCode, message, errors = [])`
  - Asegura que `errors` siempre sea arreglo.
- `buildError(message, statusCode, details = [])`
  - Crea errores operacionales controlados con:
    - `statusCode`
    - `isOperational`
    - `errors`
- `buildUnauthorizedError(detail?)`
  - Atajo para errores HTTP 401 estandarizados.

#### 4) `src/app.js`
Se integró pipeline global de error al final de rutas:

- Registro de middleware 404:
  - `app.use(notFoundHandler);`
- Registro de middleware global:
  - `app.use(globalErrorHandler);`

#### 5) Controladores refactorizados a patrón `catchAsync + buildError`
Se migró de `try/catch + errorResponse` a `catchAsync` en:

- `src/controllers/auth.controller.js`
- `src/controllers/usuario.controller.js`
- `src/controllers/categoria.controller.js`
- `src/controllers/producto.controller.js`
- `src/controllers/auditoria.controller.js`

Cambios aplicados:
- Validaciones de negocio ahora usan `next(buildError(...))`.
- Errores inesperados se propagan automáticamente al middleware global.
- Respuestas exitosas mantienen `successResponse`.

### Beneficios obtenidos
- Menor código repetido y controladores más limpios.
- Contrato de error unificado en toda la API.
- Mejor separación de responsabilidades:
  - controlador: lógica de negocio
  - middleware: composición final de errores HTTP
- Mayor facilidad para escalar reglas de error futuras (logging, trazabilidad, códigos internos, etc.).

---

## 🌐 Actualización reciente: Renombrado profesional de archivos a inglés (controllers/models/routes)

Se realizó una normalización de nombres de archivos al inglés para facilitar mantenimiento en equipos técnicos.

### Objetivo del cambio
- Estandarizar naming técnico a inglés.
- Evitar mezcla de español/inglés en estructura del backend.
- Mantener funcionalidad intacta actualizando todas las importaciones relacionadas.

### Renombres aplicados

#### Controllers
- `src/controllers/usuario.controller.js` → `src/controllers/users.controller.js`
- `src/controllers/categoria.controller.js` → `src/controllers/categories.controller.js`
- `src/controllers/producto.controller.js` → `src/controllers/products.controller.js`
- `src/controllers/auditoria.controller.js` → `src/controllers/audits.controller.js`

#### Models
- `src/models/usuario.model.js` → `src/models/users.model.js`
- `src/models/categoria.model.js` → `src/models/categories.model.js`
- `src/models/producto.model.js` → `src/models/products.model.js`
- `src/models/auditoria.model.js` → `src/models/audits.model.js`

#### Routes
- `src/routes/usuario.routes.js` → `src/routes/users.routes.js`
- `src/routes/categoria.routes.js` → `src/routes/categories.routes.js`
- `src/routes/producto.routes.js` → `src/routes/products.routes.js`
- `src/routes/auditoria.routes.js` → `src/routes/audits.routes.js`

### Archivos modificados por actualización de imports

#### `src/app.js`
Se actualizaron imports de rutas:
- `./routes/users.routes.js`
- `./routes/categories.routes.js`
- `./routes/products.routes.js`
- `./routes/audits.routes.js`

#### Rutas
- `src/routes/users.routes.js`
  - ahora importa `../controllers/users.controller.js`
- `src/routes/categories.routes.js`
  - ahora importa `../controllers/categories.controller.js`
- `src/routes/products.routes.js`
  - ahora importa `../controllers/products.controller.js`
- `src/routes/audits.routes.js`
  - ahora importa `../controllers/audits.controller.js`

#### Controladores
- `src/controllers/users.controller.js`
  - ahora importa `../models/users.model.js`
- `src/controllers/categories.controller.js`
  - ahora importa `../models/categories.model.js`
- `src/controllers/products.controller.js`
  - ahora importa `../models/products.model.js`
- `src/controllers/audits.controller.js`
  - ahora importa `../models/audits.model.js`
- `src/controllers/auth.controller.js`
  - ahora importa `../models/users.model.js`

---

## 🔒 Actualización reciente: Refuerzo robusto del sistema de autenticación JWT

Se reestructuró y reforzó completamente el sistema de validación JWT para lograr un estándar de seguridad profesional. El objetivo fue eliminar puntos débiles del sistema anterior e implementar múltiples capas de protección sin depender de infraestructura externa (Redis, blacklists, etc.).

### Motivación

El sistema anterior presentaba las siguientes debilidades:
- El `JWT_SECRET` tenía un fallback inseguro en el código (`"dev_jwt_secret_change_me"`).
- El middleware verificaba solo la firma del token, sin validar claims adicionales (issuer, audience, algoritmo).
- No existía diferenciación entre tipos de error JWT (expirado, manipulado, malformado).
- No había mecanismo para invalidar tokens activos al cerrar sesión (logout).
- La lógica de generación del token estaba acoplada al controlador.
- No había endpoint de logout ni de verificación de sesión activa (`/me`).

---

### Archivos creados

#### 1) `src/config/jwt.config.js`
Módulo de configuración JWT centralizado. Define y valida toda la configuración al arranque de la aplicación.

Funcionalidades:
- `validateJWTConfig()`
  - Verifica que `JWT_SECRET` exista y tenga mínimo **32 caracteres**.
  - Verifica que `JWT_EXPIRES_IN` esté definida.
  - Lanza un error fatal si la configuración es insegura — **la app no arranca** si el `.env` no cumple los requisitos.
- `JWT_CONFIG` (objeto `Object.freeze`)
  - `secret`: clave secreta desde variable de entorno.
  - `expiresIn`: tiempo de vida del token.
  - `algorithm`: `"HS256"` (fijo — no alterable en runtime).
  - `issuer`: identificador del emisor de la API.
  - `audience`: identificador del receptor esperado.

#### 2) `src/services/token.service.js`
Servicio dedicado al ciclo de vida de los tokens JWT. Centraliza generación, verificación y extracción.

Funciones implementadas:
- `signToken(user)`
  - Genera JWT con los claims estándar:
    - `sub` (subject): ID del usuario como string.
    - `id`: ID del usuario.
    - `username`, `nombre`, `rol`: datos de identidad.
    - `tokenVersion`: versión del token para invalidación sin blacklist.
    - `iss`, `aud`, `iat`, `exp`: claims de seguridad estándar RFC 7519.
  - Aplica algoritmo, issuer y audience desde `JWT_CONFIG`.
- `verifyToken(token)`
  - Verifica firma, algoritmo (lista blanca: solo `HS256`), issuer, audience y expiración.
  - Diferencia tres tipos de error:
    - `TokenExpiredError` → `401 "Sesión expirada"` con mensaje orientado al usuario.
    - `NotBeforeError` → `401 "Token no activo aún"`.
    - `JsonWebTokenError` → `401 "Token inválido"` sin revelar detalles de implementación.
  - Cualquier error inesperado produce `500` sin exponer información sensible.
- `extractTokenFromHeader(authHeader)`
  - Valida existencia y tipo del header.
  - Verifica prefijo `Bearer ` (con espacio).
  - Valida estructura de JWT: exactamente **3 partes** separadas por puntos, ninguna vacía.
  - Retorna `null` si cualquier condición falla — no lanza excepciones.

#### 3) `sql/migrations/001_add_token_version.sql`
Script de migración para bases de datos existentes.
- Agrega la columna `token_version INT UNSIGNED NOT NULL DEFAULT 0` a la tabla `usuarios` usando `ADD COLUMN IF NOT EXISTS`.
- Reinicia a `0` todos los registros existentes (estado limpio post-migración).
- Incluye `SELECT` de verificación al final.

---

### Archivos modificados

#### 4) `src/middlewares/auth.middleware.js`
Reescritura completa con validación en **5 capas secuenciales**:

| Capa | Qué valida |
|------|------------|
| **1** | Extracción y formato del header (`Bearer` + 3 partes JWT) |
| **2** | Verificación criptográfica: firma, algoritmo, issuer, audience, expiración |
| **3** | Payload mínimo: presencia de `id`, `username`, `rol` |
| **4** | Existencia del usuario en base de datos (detecta cuentas eliminadas post-login) |
| **5** | Versión del token (`tokenVersion` del JWT vs `token_version` en DB) |

Cambios adicionales:
- `req.user` ahora se construye **desde la base de datos** (no desde el token), garantizando datos siempre actualizados.
- Errores operacionales se pasan a `next()` para que el manejador global los procese.
- `checkRole(...allowedRoles)` mejorado con mensaje descriptivo que indica qué roles se requieren.

#### 5) `src/controllers/auth.controller.js`
Se refactorizó el controlador existente y se agregaron dos endpoints nuevos.

Cambios en `login`:
- Usa `signToken(user)` del servicio de tokens (separación de responsabilidades).
- Validación de tipo en `username` y `password` (evita inyección de objetos).
- Sanitización básica: `username.trim()`.
- Mensaje de error genérico intencional: no indica si el usuario existe o no (**evita User Enumeration Attack**).
- La respuesta incluye `expiresIn` para que el cliente sepa cuándo vence el token.

Nuevo endpoint `logout`:
- `POST /auth/logout` (ruta protegida — requiere `authMiddleware`).
- Llama a `UserModel.incrementTokenVersion(userId)`.
- Invalida **todos los tokens previos** del usuario sin blacklist externa.

Nuevo endpoint `getMe`:
- `GET /auth/me` (ruta protegida — requiere `authMiddleware`).
- Devuelve los datos del usuario autenticado desde `req.user` (datos frescos de DB).
- Útil para que el frontend verifique el estado de la sesión activa.

#### 6) `src/routes/auth.routes.js`
Se registraron las dos rutas nuevas:

- `POST /auth/login` — pública, no requiere token.
- `POST /auth/logout` — protegida con `authMiddleware`.
- `GET /auth/me` — protegida con `authMiddleware`.

#### 7) `src/models/users.model.js`
Se introdujo la constante `PUBLIC_FIELDS` para centralizar las columnas seleccionadas en todos los `SELECT` públicos. Ahora incluye `token_version`.

Cambios en métodos existentes:
- `findAll()`, `findById()`, `findByDocumento()`, `create()`, `updateComplete()`, `updatePartial()`: actualizados para seleccionar `token_version` junto con el resto de campos públicos.
- `findByUsername()`: mantiene `SELECT *` — se usa exclusivamente en login para obtener `password_hash`.
- `updatePartial()`: se corrigió el uso de `?? null` en lugar de variables sin definir para campos opcionales.

Nuevo método:
- `incrementTokenVersion(id)`
  - Ejecuta: `UPDATE usuarios SET token_version = token_version + 1 WHERE id = ?`
  - Retorna `boolean` (`affectedRows > 0`).
  - Se usa en `POST /auth/logout` para invalidar todas las sesiones previas del usuario.

Método agregado:
- `findByUsernamePublic(username)`
  - Búsqueda por username **sin** `password_hash` para validaciones de duplicados en creación de usuario.

#### 8) `sql/database.sql`
Se actualizó la definición de la tabla `usuarios`:

```sql
token_version INT UNSIGNED NOT NULL DEFAULT 0,
```

Se incluyó comentario explicativo del mecanismo de invalidación en la definición de la columna.

#### 9) `src/app.js`
Cambios aplicados:
- Se agregó `import "dotenv/config"` al inicio para garantizar carga de variables de entorno antes de cualquier otro módulo.
- Se importa y ejecuta `validateJWTConfig()` antes de la inicialización de Express.
  - Si la configuración JWT es insegura o incompleta, la aplicación **no arranca** y muestra los errores específicos de configuración.

#### 10) `.env.example`
Se agregaron las variables de entorno requeridas para JWT con documentación inline:

```env
JWT_SECRET=CAMBIA_ESTO_POR_UN_SECRETO_SEGURO_DE_AL_MENOS_32_CARACTERES
JWT_EXPIRES_IN=8h
JWT_ISSUER=rincon-gastronomico-api
JWT_AUDIENCE=rincon-gastronomico-app
```

Se incluyó instrucción para generar un secreto seguro con Node.js:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

### Mecanismo de invalidación de sesiones (logout sin blacklist)

```
Login  → JWT emitido con claim:  tokenVersion = user.token_version  (ej: 0)
Logout → DB ejecuta:             token_version = token_version + 1  (ahora: 1)
Request siguiente →              decoded.tokenVersion (0) ≠ DB (1)
                   →             401 "Sesión cerrada"
```

Este mecanismo garantiza que cualquier token emitido antes del logout queda inválido automáticamente, sin necesidad de almacenar tokens en memoria o en una blacklist.

---

### Endpoints impactados

#### Nuevos
- `POST /auth/logout` — cierra la sesión invalidando tokens anteriores.
- `GET /auth/me` — devuelve datos del usuario autenticado actualmente.

#### Modificados
- `POST /auth/login` — respuesta ampliada con `expiresIn`; token generado con claims de seguridad completos.

#### Sin cambios funcionales (solo seguridad reforzada)
- Todos los endpoints protegidos (`/usuarios`, `/categorias`, `/productos`, `/auditoria`) ahora pasan por la validación de 5 capas.

---

### Instrucción de migración para base de datos existente

Si la base de datos ya está creada, ejecutar:

```sql
-- sql/migrations/001_add_token_version.sql
ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS token_version INT UNSIGNED NOT NULL DEFAULT 0 AFTER rol;
```

Para bases de datos nuevas, el script `sql/database.sql` ya incluye la columna.

---

### Resumen de archivos por tipo de cambio

| Tipo | Archivo |
|------|---------|
| ✅ Creado | `src/config/jwt.config.js` |
| ✅ Creado | `src/services/token.service.js` |
| ✅ Creado | `sql/migrations/001_add_token_version.sql` |
| 🔄 Modificado | `src/middlewares/auth.middleware.js` |
| 🔄 Modificado | `src/controllers/auth.controller.js` |
| 🔄 Modificado | `src/routes/auth.routes.js` |
| 🔄 Modificado | `src/models/users.model.js` |
| 🔄 Modificado | `sql/database.sql` |
| 🔄 Modificado | `src/app.js` |
| 🔄 Modificado | `.env.example` |
