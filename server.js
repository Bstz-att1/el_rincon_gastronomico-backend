// ============================================
//   PUNTO DE ENTRADA DE LA APLICACIÓN
// ============================================
//
// Este archivo es el único responsable de arrancar el servidor HTTP.
// Toda la configuración de Express vive en src/app.js.
//
// Manejadores de errores a nivel de proceso:
//   - uncaughtException  : captura errores sincrónicos no controlados.
//   - unhandledRejection : captura promesas rechazadas sin .catch().
//
// En ambos casos se registra el error y se termina el proceso de forma
// controlada (exit code 1) para que el gestor de procesos (PM2, Docker,
// systemd) pueda reiniciarlo automáticamente.
// ============================================

import app from "./src/app.js";

const PORT = process.env.PORT || 3000;
const ENV  = process.env.NODE_ENV || "development";

// ── Arranque del servidor ────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
    console.log("=".repeat(50));
    console.log(`  🚀 Servidor iniciado correctamente`);
    console.log(`  🌐 Entorno  : ${ENV}`);
    console.log(`  📡 Puerto   : ${PORT}`);
    console.log(`  🔗 URL      : http://localhost:${PORT}`);
    console.log("=".repeat(50));
});

// ── Manejo de errores no capturados (proceso) ────────────────────────────────

/**
 * Errores sincrónicos que escapan de todos los try/catch.
 * El proceso DEBE terminar — el estado interno podría ser inconsistente.
 */
process.on("uncaughtException", (err) => {
    console.error("[FATAL] uncaughtException — el proceso será terminado:");
    console.error(err);
    server.close(() => process.exit(1));
});

/**
 * Promesas rechazadas sin handler .catch().
 * El proceso DEBE terminar para evitar comportamientos impredecibles.
 */
process.on("unhandledRejection", (reason) => {
    console.error("[FATAL] unhandledRejection — el proceso será terminado:");
    console.error(reason);
    server.close(() => process.exit(1));
});

/**
 * Señal de terminación limpia (Ctrl+C, Docker stop, PM2 reload).
 * Cierra conexiones abiertas antes de salir.
 */
process.on("SIGTERM", () => {
    console.log("[INFO] Señal SIGTERM recibida. Cerrando servidor...");
    server.close(() => {
        console.log("[INFO] Servidor cerrado correctamente.");
        process.exit(0);
    });
});
