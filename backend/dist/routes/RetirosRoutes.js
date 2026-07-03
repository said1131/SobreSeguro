"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const RetirosController_1 = require("../controllers/RetirosController");
const router = (0, express_1.Router)();
router.get("/", RetirosController_1.obtenerRetiros);
router.post("/", RetirosController_1.realizarRetiro);
router.get("/sobre/:sobreId", RetirosController_1.obtenerRetirosSobre);
exports.default = router;
