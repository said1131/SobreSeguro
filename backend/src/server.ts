import app from "./app";
import { conectarDB } from "./config/Database";

const PORT = 3000;

const iniciarServidor = async () => {
    try {
        await conectarDB();
        app.listen(PORT, () => {
            console.log(`Servidor en http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Error al iniciar el servidor:", error);
        process.exit(1);
    }
};

void iniciarServidor();