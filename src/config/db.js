// ============================================
//   CONFIGURACIÓN DEL POOL DE CONEXIONES MySQL
// ============================================
//
// Se usa mysql2/promise para soporte nativo de async/await.
// dotenv/config ya fue cargado en app.js, pero se incluye aquí
// por si este módulo se usa de forma independiente en scripts o tests.
//
// IMPORTANTE: Si la conexión inicial falla, el proceso termina
// con exit(1) — la aplicación NO puede funcionar sin base de datos.
// ============================================

import mysql from "mysql2/promise";
import "dotenv/config";

// ── Creación del pool ────────────────────────────────────────────────────────
// Un pool reutiliza conexiones en vez de abrir una nueva por cada query,
// lo que reduce latencia y consumo de recursos.
const pool = mysql.createPool({
    host:              process.env.DB_HOST     || "localhost",
    user:              process.env.DB_USER,
    password:          process.env.DB_PASSWORD,
    database:          process.env.DB_NAME,
    port:              Number(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit:   20,    // Máximo de conexiones simultáneas permitidas
    queueLimit:        0,     // 0 = cola ilimitada cuando todas las conexiones están ocupadas
    timezone:          "Z",   // UTC — evita discrepancias de zona horaria entre Node y MySQL
    charset:           "utf8mb4", // Soporte completo Unicode (emojis, caracteres especiales)
});

// ── Prueba de conexión al arrancar ──────────────────────────────────────────
// Verifica que la BD sea alcanzable ANTES de que el servidor empiece a
// aceptar peticiones. Un fallo aquí es fatal — se termina el proceso.
pool
    .getConnection()
    .then((connection) => {
        console.log("[DB] Conexión al pool MySQL establecida correctamente.");
        connection.release(); // Devolver la conexión al pool tras la prueba
    })
    .catch((error) => {
        console.error("[DB] Error crítico al conectar con la base de datos:", error.message);
        console.error("[DB] Verifique las variables DB_HOST, DB_USER, DB_PASSWORD, DB_NAME y DB_PORT en el .env");
        // Terminar el proceso — la app no puede operar sin BD
        process.exit(1);
    });

export default pool;
