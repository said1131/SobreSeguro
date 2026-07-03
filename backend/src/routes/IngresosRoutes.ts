import { Router } from "express";

import {
    obtenerIngreso,
    actualizarIngreso,
    obtenerHistorialCompleto
} from "../controllers/IngresosController";

const router = Router();

router.get("/", obtenerIngreso);

router.get("/historial/completo", obtenerHistorialCompleto);

router.put("/", actualizarIngreso);

export default router;