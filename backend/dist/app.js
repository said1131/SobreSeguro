"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const authRouters_1 = __importDefault(require("./routes/authRouters"));
const SobreRoutes_1 = __importDefault(require("./routes/SobreRoutes"));
const IngresosRoutes_1 = __importDefault(require("./routes/IngresosRoutes"));
const RetirosRoutes_1 = __importDefault(require("./routes/RetirosRoutes"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use("/api/auth", authRouters_1.default);
app.use("/api/sobres", SobreRoutes_1.default);
app.use("/api/ingresos", IngresosRoutes_1.default);
app.use("/api/retiros", RetirosRoutes_1.default);
exports.default = app;
