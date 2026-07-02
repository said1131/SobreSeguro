import { Router } from "express";

import {
    obtenerSobres,
    crearSobre,
    configurarAhorro,
    actualizarPorcentajes,
    eliminarSobre
} from "../controllers/SobresController";

const router = Router();

router.get("/", obtenerSobres);

router.post("/", crearSobre);

router.put("/ahorro", configurarAhorro);

router.put("/porcentajes", actualizarPorcentajes);

router.delete("/:id", eliminarSobre);

export default router;