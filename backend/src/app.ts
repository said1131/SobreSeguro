import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRouters";
import sobreRoutes from "./routes/SobreRoutes";
import ingresoRoutes from "./routes/IngresosRoutes";
import retiroRoutes from "./routes/RetirosRoutes";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/sobres", sobreRoutes);
app.use("/api/ingresos", ingresoRoutes);
app.use("/api/retiros", retiroRoutes);

export default app;