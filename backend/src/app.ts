import express from "express";
import cors from "cors";

const app = express();

// Permite recibir datos en formato JSON
app.use(express.json());

// Permite solicitudes desde el frontend
app.use(cors());

// Ruta de prueba
app.get("/api/test", (req, res) => {
    res.status(200).json({
        mensaje: "Backend funcionando correctamente 🚀"
    });
});

export default app;