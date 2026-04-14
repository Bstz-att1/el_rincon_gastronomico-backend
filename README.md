# Rincón Gastronómico - Backend API

Backend REST para la gestión del sistema **Rincón Gastronómico**.  
Esta API permite administrar los módulos de:

- Usuarios
- Categorías
- Productos
- Auditoría

Release objetivo: **v1.0.0**

---

## Tabla de contenido

- [1. Tecnologías](#1-tecnologías)
- [2. Estructura del proyecto](#2-estructura-del-proyecto)
- [3. Requisitos previos](#3-requisitos-previos)
- [4. Instalación](#4-instalación)
- [5. Configuración de variables de entorno](#5-configuración-de-variables-de-entorno)
- [6. Configuración de base de datos](#6-configuración-de-base-de-datos)
- [7. Ejecución del proyecto](#7-ejecución-del-proyecto)
- [8. Endpoints de la API](#8-endpoints-de-la-api)
  - [8.1 Usuarios](#81-usuarios)
  - [8.2 Categorías](#82-categorías)
  - [8.3 Productos](#83-productos)
  - [8.4 Auditoría](#84-auditoría)
- [9. Formato de respuestas](#9-formato-de-respuestas)
- [10. Modelo de datos (resumen)](#10-modelo-de-datos-resumen)
- [11. Scripts disponibles](#11-scripts-disponibles)
- [12. Estado del release v1.0.0](#12-estado-del-release-v100)
- [13. Changelog](#13-changelog)

---

## 1. Tecnologías

- **Node.js** (ES Modules)
- **Express** `^5.2.1`
- **MySQL** (conector `mysql2/promise`)
- **dotenv** para variables de entorno
- **nodemon** para desarrollo

---

## 2. Estructura del proyecto

```bash
Backend/
├── server.js
├── package.json
├── changelog.md
├── sql/
│   ├── database.sql
│   └── data.sql
└── src/
    ├── app.js
    ├── config/
    │   └── db.js
    ├── controllers/
    │   ├── usuario.controller.js
    │   ├── categoria.controller.js
    │   ├── producto.controller.js
    │   └── auditoria.controller.js
    ├── models/
    │   ├── usuario.model.js
    │   ├── categoria.model.js
    │   ├── producto.model.js
    │   └── auditoria.model.js
    ├── routes/
    │   ├── usuario.routes.js
    │   ├── categoria.routes.js
    │   ├── producto.routes.js
    │   └── auditoria.routes.js
    └── utils/
        └── response.handler.js
```

### Arquitectura aplicada

Se usa una arquitectura por capas:

- **Routes**: define endpoints y mapea controladores.
- **Controllers**: valida entradas y estructura respuestas.
- **Models**: acceso a datos SQL (CRUD).
- **Config**: conexión a base de datos.
- **Utils**: helpers compartidos (respuestas estándar).

---

## 3. Requisitos previos

- Node.js 18+ (recomendado)
- npm
- MySQL 8+ (o compatible)

---

## 4. Instalación

1. Clonar repositorio
2. Entrar a la carpeta backend
3. Instalar dependencias

```bash
npm install
```

---

## 5. Configuración de variables de entorno

Crear un archivo `.env` en la raíz del backend con:

```env
DB_HOST=localhost
DB_USER=app_user_dario
DB_PASSWORD=#ADSO_node
DB_NAME=rincon_gastronomico
DB_PORT=3306
PORT=3000
```

> Nota: los valores de ejemplo están alineados con `sql/database.sql`.

---

## 6. Configuración de base de datos

### 6.1 Crear base, usuario y tablas

Ejecutar:

- `sql/database.sql`

Este script crea:

- Usuario MySQL `app_user_dario`
- Base de datos `rincon_gastronomico`
- Tablas:
  - `usuarios`
  - `categorias`
  - `productos`
  - `audit_logs`

### 6.2 Insertar datos semilla

Ejecutar:

- `sql/data.sql`

Incluye datos de ejemplo para:

- usuarios
- categorías
- productos
- audit logs

---

## 7. Ejecución del proyecto

### Modo desarrollo

```bash
npm run dev
```

Servidor levantado en:

- `http://localhost:3000` (por defecto)

Ruta base:

- `GET /` → mensaje de bienvenida de la API

---

## 8. Endpoints de la API

## 8.1 Usuarios

Base: `/usuarios`

- `GET /usuarios`
- `GET /usuarios/:id`
- `POST /usuarios`
- `PUT /usuarios/:id`
- `PATCH /usuarios/:id`
- `DELETE /usuarios/:id`

### Campos relevantes (usuarios)

- `documento` (requerido en creación)
- `nombre` (requerido en creación)
- `rol` (`admin` | `user`, opcional en creación)

---

## 8.2 Categorías

Base: `/categorias`

- `GET /categorias`
- `GET /categorias/:id`
- `POST /categorias`
- `PUT /categorias/:id`
- `PATCH /categorias/:id`
- `DELETE /categorias/:id`

### Campos relevantes (categorías)

- `nombre` (requerido en creación)
- `descripcion` (opcional)

---

## 8.3 Productos

Base: `/productos`

- `GET /productos`
- `GET /productos/:id`
- `POST /productos`
- `PUT /productos/:id`
- `PATCH /productos/:id`
- `DELETE /productos/:id`

### Campos relevantes (productos)

- `nombre` (requerido en creación)
- `descripcion` (opcional)
- `categoria_id` (requerido, FK)
- `cantidad` (opcional en creación, default `0`)

---

## 8.4 Auditoría

Base: `/auditoria`

- `GET /auditoria`
- `GET /auditoria/:id`
- `POST /auditoria`
- `PUT /auditoria/:id`
- `PATCH /auditoria/:id`
- `DELETE /auditoria/:id`

### Campos relevantes (audit_logs)

- `usuario_id` (requerido, FK)
- `accion` (requerido)
- `tabla_afectada` (requerido)
- `registro_id` (requerido)
- `detalles` (opcional)

---

## 9. Formato de respuestas

La API estandariza respuestas con `src/utils/response.handler.js`.

### Respuesta exitosa

```json
{
  "success": true,
  "message": "Mensaje descriptivo",
  "data": []
}
```

### Respuesta con error

```json
{
  "success": false,
  "message": "Mensaje de error",
  "data": [],
  "errors": []
}
```

---

## 10. Modelo de datos (resumen)

### `usuarios`
- `id` (PK)
- `documento` (unique)
- `nombre`
- `rol` (`admin` / `user`)
- `creado_en`, `actualizado_en`

### `categorias`
- `id` (PK)
- `nombre` (unique)
- `descripcion`
- `creado_en`, `actualizado_en`

### `productos`
- `id` (PK)
- `nombre`
- `descripcion`
- `categoria_id` (FK → `categorias.id`)
- `cantidad`
- `creado_en`, `actualizado_en`

### `audit_logs`
- `id` (PK)
- `usuario_id` (FK → `usuarios.id`)
- `accion`
- `tabla_afectada`
- `registro_id`
- `detalles`
- `fecha`

---

## 11. Scripts disponibles

Según `package.json`:

```json
"scripts": {
  "dev": "nodemon app.js"
}
```

Comando:

```bash
npm run dev
```

> Recomendación para consistencia: usar `nodemon server.js` si se desea alinear explícitamente con el entrypoint actual (`server.js`).

---

## 12. Estado del release v1.0.0

Para esta versión se encuentra implementado y funcional:

- CRUD completo de usuarios
- CRUD completo de categorías
- CRUD completo de productos
- CRUD completo de auditoría
- Conexión MySQL por pool
- SQL de creación de esquema y datos de prueba
- Respuestas API estandarizadas

---

## 13. Changelog

Revisar historial funcional detallado en:

- [`changelog.md`](./changelog.md)

Incluye evolución de:
- módulo de categorías
- módulo de productos
- módulo de auditoría
- integración progresiva en la app principal

---

## 14. Consumo desde Frontend (fetch/curl)

### 14.1 CORS
El backend tiene CORS habilitado para permitir consumo desde frontend (por ejemplo, `http://localhost` o servidores estáticos locales).

### 14.2 URL base sugerida
```text
http://localhost:3000
```

### 14.3 Ejemplos con fetch (Frontend Vanilla JS)

#### Usuarios
```js
// GET /usuarios
const usersRes = await fetch("http://localhost:3000/usuarios");
const usersJson = await usersRes.json();

// POST /usuarios
const createUserRes = await fetch("http://localhost:3000/usuarios", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    documento: "1020304050",
    nombre: "Laura Méndez",
    rol: "admin"
  })
});
const createUserJson = await createUserRes.json();
```

#### Categorías
```js
// GET /categorias
const categoriesRes = await fetch("http://localhost:3000/categorias");
const categoriesJson = await categoriesRes.json();

// POST /categorias
const createCategoryRes = await fetch("http://localhost:3000/categorias", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    nombre: "cocina",
    descripcion: "Insumos de cocina"
  })
});
const createCategoryJson = await createCategoryRes.json();
```

#### Productos
```js
// GET /productos
const productsRes = await fetch("http://localhost:3000/productos");
const productsJson = await productsRes.json();

// POST /productos
const createProductRes = await fetch("http://localhost:3000/productos", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    nombre: "Tomate",
    descripcion: "Proveedor local",
    categoria_id: 1,
    cantidad: 20
  })
});
const createProductJson = await createProductRes.json();
```

#### Auditoría
```js
// GET /auditoria
const auditRes = await fetch("http://localhost:3000/auditoria");
const auditJson = await auditRes.json();

// POST /auditoria
const createAuditRes = await fetch("http://localhost:3000/auditoria", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    usuario_id: 1,
    accion: "INSERT",
    tabla_afectada: "productos",
    registro_id: 10,
    detalles: "Creación inicial de producto"
  })
});
const createAuditJson = await createAuditRes.json();
```

### 14.4 Ejemplos con cURL

#### Usuarios
```bash
curl -X GET http://localhost:3000/usuarios

curl -X POST http://localhost:3000/usuarios ^
  -H "Content-Type: application/json" ^
  -d "{\"documento\":\"1020304050\",\"nombre\":\"Laura Méndez\",\"rol\":\"admin\"}"
```

#### Categorías
```bash
curl -X GET http://localhost:3000/categorias

curl -X POST http://localhost:3000/categorias ^
  -H "Content-Type: application/json" ^
  -d "{\"nombre\":\"cocina\",\"descripcion\":\"Insumos de cocina\"}"
```

#### Productos
```bash
curl -X GET http://localhost:3000/productos

curl -X POST http://localhost:3000/productos ^
  -H "Content-Type: application/json" ^
  -d "{\"nombre\":\"Tomate\",\"descripcion\":\"Proveedor local\",\"categoria_id\":1,\"cantidad\":20}"
```

#### Auditoría
```bash
curl -X GET http://localhost:3000/auditoria

curl -X POST http://localhost:3000/auditoria ^
  -H "Content-Type: application/json" ^
  -d "{\"usuario_id\":1,\"accion\":\"INSERT\",\"tabla_afectada\":\"productos\",\"registro_id\":10,\"detalles\":\"Creación inicial de producto\"}"
```
