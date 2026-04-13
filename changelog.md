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
