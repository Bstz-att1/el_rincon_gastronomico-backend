// ============================================
//   BARRIL — ESQUEMAS ZOD
// ============================================
//
// Punto de entrada único para todos los esquemas de validación.
//
//   import { createProductSchema, loginSchema } from "../schemas/index.js";
//
// ============================================

// ── Autenticación ────────────────────────────────────────────────────────────
export { loginSchema } from "./auth.schema.js";

// ── Auditoría ────────────────────────────────────────────────────────────────
export { createAuditLogSchema } from "./audits.schema.js";

// ── Categorías ───────────────────────────────────────────────────────────────
export {
    createCategorySchema,
    updateCategorySchema,
    patchCategorySchema,
} from "./categories.schema.js";

// ── Productos ────────────────────────────────────────────────────────────────
export {
    createProductSchema,
    updateProductSchema,
    patchProductSchema,
} from "./products.schema.js";

// ── Roles ────────────────────────────────────────────────────────────────────
export {
    createRoleSchema,
    updateRoleSchema,
    patchRoleSchema,
} from "./roles.schema.js";

// ── Usuarios ─────────────────────────────────────────────────────────────────
export {
    createUserSchema,
    updateUserSchema,
    patchUserSchema,
} from "./users.schema.js";
