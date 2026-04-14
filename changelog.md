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
