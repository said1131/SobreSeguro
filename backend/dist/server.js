"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const Database_1 = require("./config/Database");
const PORT = 3000;
const iniciarServidor = async () => {
    try {
        await (0, Database_1.conectarDB)();
        app_1.default.listen(PORT, () => {
            console.log(`Servidor en http://localhost:${PORT}`);
        });
    }
    catch (error) {
        console.error("Error al iniciar el servidor:", error);
        process.exit(1);
    }
};
void iniciarServidor();
