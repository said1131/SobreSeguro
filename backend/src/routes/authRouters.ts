import { Router } from "express";
import {
    registrar,
    login,
    obtenerPerfil,
    actualizarPerfil,
    solicitarRecuperacion,
    cambiarContraseña,
    logout
} from "../controllers/AuthController";

const router = Router();

router.post("/registro", registrar);

router.post("/login", login);

router.get("/perfil/:id", obtenerPerfil);

router.put("/perfil/update", actualizarPerfil);

router.put("/perfil/:id", actualizarPerfil);

router.post("/recuperar", solicitarRecuperacion);

router.post("/cambiar-contrasena", cambiarContraseña);

router.post("/logout", logout);

export default router;

