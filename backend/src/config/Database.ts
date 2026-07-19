import sql from "mssql";
import dotenv from "dotenv";

dotenv.config();

const config: sql.config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER!,
    database: process.env.DB_DATABASE,
    port: Number(process.env.DB_PORT),
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

let poolPromise: Promise<sql.ConnectionPool> | null = null;

export const getPool = async (): Promise<sql.ConnectionPool> => {
    if (!poolPromise) {
        poolPromise = sql.connect(config);
    }

    return poolPromise;
};

export async function conectarDB() {
    try {
        const pool = await getPool();
        console.log("Conectado a SQL Server");
        return pool;
    } catch (error) {
        console.error("Error al conectar:", error);
        throw error;
    }
}