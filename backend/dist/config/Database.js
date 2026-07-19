"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPool = void 0;
exports.conectarDB = conectarDB;
const mssql_1 = __importDefault(require("mssql"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    port: Number(process.env.DB_PORT),
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};
let poolPromise = null;
const getPool = async () => {
    if (!poolPromise) {
        poolPromise = mssql_1.default.connect(config);
    }
    return poolPromise;
};
exports.getPool = getPool;
async function conectarDB() {
    try {
        const pool = await (0, exports.getPool)();
        console.log("Conectado a SQL Server");
        return pool;
    }
    catch (error) {
        console.error("Error al conectar:", error);
        throw error;
    }
}
