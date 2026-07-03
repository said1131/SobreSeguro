import { Router } from "express";

import {
    obtenerSobres,
    crearSobre,
    configurarAhorro,
    actualizarPorcentajesSobres,
    actualizarPorcentajeSobre,
    eliminarSobre
} from "../controllers/SobresController";

const router = Router();

router.get("/", obtenerSobres);

router.post("/", crearSobre);

router.put("/ahorro", configurarAhorro);

router.put("/porcentajes", actualizarPorcentajesSobres);

router.put("/:id/porcentaje", actualizarPorcentajeSobre);

router.delete("/:id", eliminarSobre);

export default router;