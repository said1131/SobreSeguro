import express from "express";
import cors from "cors";

import sobreRoutes from "./routes/sobreRoutes";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/sobres", sobreRoutes);

export default app;