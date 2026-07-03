import { Router } from "express";

import sobreRoutes from "./SobreRoutes";
import ingresoRoutes from "./IngresosRoutes";
import retirosRoutes from "./RetirosRoutes";

const router = Router();

router.use("/sobres", sobreRoutes);
router.use("/ingresos", ingresoRoutes);
router.use("/retiros", retirosRoutes);

export default router;