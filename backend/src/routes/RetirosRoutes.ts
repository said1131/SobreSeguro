import { Router } from "express";
import {
    obtenerRetiros,
    realizarRetiro,
    obtenerRetirosSobre
} from "../controllers/RetirosController";

const router = Router();

router.get("/", obtenerRetiros);

router.post("/", realizarRetiro);

router.get("/sobre/:sobreId", obtenerRetirosSobre);

export default router;
