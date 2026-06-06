// ============================================
//   BARRIL — CONTROLADORES
// ============================================
//
// Punto de entrada único para todos los controladores de la API.
//
//   import { login, createProduct, getAllRoles } from "../controllers/index.js";
//
// ============================================

// ── Autenticación ────────────────────────────────────────────────────────────
export { login, logout, getMe } from "./auth.controller.js";

// ── Auditoría ────────────────────────────────────────────────────────────────
export {
    getAllAuditLogs,
    getAuditLogById,
    createAuditLog,
} from "./audits.controller.js";

// ── Categorías ───────────────────────────────────────────────────────────────
export {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategoryComplete,
    updateCategoryPartial,
    deleteCategory,
} from "./categories.controller.js";

// ── Productos ────────────────────────────────────────────────────────────────
export {
    getAllProducts,
    getProductById,
    createProduct,
    updateProductComplete,
    updateProductPartial,
    deleteProduct,
} from "./products.controller.js";

// ── Roles ────────────────────────────────────────────────────────────────────
export {
    getAllRoles,
    getAllPermissions,
    getRoleById,
    getRolePermissions,
    createRole,
    updateRoleComplete,
    updateRolePartial,
    deleteRole,
} from "./roles.controller.js";

// ── Usuarios ─────────────────────────────────────────────────────────────────
export {
    getAllUsers,
    getUserById,
    createUser,
    updateUserComplete,
    updateUserPartial,
    deleteUser,
} from "./users.controller.js";
