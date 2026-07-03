"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const IngresosController_1 = require("../controllers/IngresosController");
const router = (0, express_1.Router)();
router.get("/", IngresosController_1.obtenerIngreso);
router.get("/historial/completo", IngresosController_1.obtenerHistorialCompleto);
router.put("/", IngresosController_1.actualizarIngreso);
exports.default = router;
