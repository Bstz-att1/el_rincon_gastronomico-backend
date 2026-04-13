// Importamos la versión de promesas de mysql2
import mysql from "mysql2/promise";
// Cargamos las variables de entorno
import "dotenv/config";

//  ============================================
//  CREACION DE POOL DE CONEXIONES
//  ============================================
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 20, // Permitimos un amplio numeo de conexiones simultaneas
    queueLimit: 0,
});

//  ============================================
//  PRUEBA DE CONEXION
//  ============================================
pool
    .getConnection()
    .then((connection) => {
        console.log("Conexión a la base de datos MySQL establecida con éxito");
        // Liberamos la conexión de vuelta al pool
        connection.release();
    })
    .catch((error) => {
        console.error("Error al conectar con la base de datos:", error.message);
    });

export default pool;
