"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const SobreRoutes_1 = __importDefault(require("./SobreRoutes"));
const IngresosRoutes_1 = __importDefault(require("./IngresosRoutes"));
const RetirosRoutes_1 = __importDefault(require("./RetirosRoutes"));
const router = (0, express_1.Router)();
router.use("/sobres", SobreRoutes_1.default);
router.use("/ingresos", IngresosRoutes_1.default);
router.use("/retiros", RetirosRoutes_1.default);
exports.default = router;
