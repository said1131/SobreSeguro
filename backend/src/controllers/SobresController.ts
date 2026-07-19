import { Request, Response } from "express";
import {
    SobreDTO,
    actualizarAhorroUsuario,
    actualizarPorcentajeSobreUsuario,
    actualizarSobreUsuario,
    actualizarSaldoSobre,
    crearSobreUsuario,
    desactivarSobreUsuario,
    obtenerSobresUsuario,
    obtenerUsuarioPorEmail
} from "../services/sqlStore";

const esSobreResidual = (sobre: { nombre: string; activo?: boolean }) => {
    return sobre.nombre.toLowerCase() === "residuo" && sobre.activo !== false;
};

const getContextoUsuario = async (usuarioEmail: string): Promise<{ usuarioId: number; sobres: SobreDTO[] } | null> => {
    const usuario = await obtenerUsuarioPorEmail(usuarioEmail);
    if (!usuario) {
        return null;
    }

    const sobres = await obtenerSobresUsuario(usuario.id, usuario.email);
    return { usuarioId: usuario.id, sobres };
};

// Obtener todos los sobres del usuario
export const obtenerSobres = async (req: Request, res: Response): Promise<void> => {
    const usuarioEmail = req.headers["x-usuario-email"] as string;

    if (!usuarioEmail) {
        res.status(400).json({ mensaje: "Usuario no autenticado" });
        return;
    }

    try {
        const contexto = await getContextoUsuario(usuarioEmail);
        if (!contexto) {
            res.status(404).json({ mensaje: "Usuario no encontrado." });
            return;
        }

        res.json(contexto.sobres);
    } catch (error) {
        console.error("Error al obtener sobres:", error);
        res.status(500).json({ mensaje: "Error interno al obtener sobres." });
    }
};

// Crear un nuevo sobre (no ahorro)
export const crearSobre = async (req: Request, res: Response): Promise<void> => {
    const usuarioEmail = req.headers["x-usuario-email"] as string;
    const { nombre, porcentaje } = req.body as { nombre?: string; porcentaje?: number };

    if (!usuarioEmail) {
        res.status(400).json({ mensaje: "Usuario no autenticado" });
        return;
    }

    if (!nombre || porcentaje == null) {
        res.status(400).json({ mensaje: "Nombre y porcentaje son obligatorios." });
        return;
    }

    if (porcentaje <= 0) {
        res.status(400).json({ mensaje: "El porcentaje debe ser mayor a 0." });
        return;
    }

    try {
        const contexto = await getContextoUsuario(usuarioEmail);
        if (!contexto) {
            res.status(404).json({ mensaje: "Usuario no encontrado." });
            return;
        }

        const { usuarioId, sobres } = contexto;

        const existe = sobres.find(s => s.nombre.toLowerCase() === nombre.toLowerCase() && s.activo);
        if (existe) {
            res.status(400).json({ mensaje: "Ya existe un sobre con ese nombre." });
            return;
        }

        const ahorro = sobres.find(s => s.esAhorro);
        if (!ahorro) {
            res.status(400).json({ mensaje: "Debes configurar el ahorro primero." });
            return;
        }

        const porcentajeDisponible = 100 - ahorro.porcentaje;
        const sumaActual = sobres
            .filter(s => !s.esAhorro && s.activo && !esSobreResidual(s))
            .reduce((total, s) => total + s.porcentaje, 0);

        if (sumaActual + porcentaje > porcentajeDisponible) {
            res.status(400).json({
                mensaje: `Has excedido el limite. Disponible: ${porcentajeDisponible}% (Usado: ${sumaActual}%). Intenta agregar: ${porcentaje}%. Necesitas liberar ${sumaActual + porcentaje - porcentajeDisponible}% ajustando otros sobres.`,
                error: true,
                disponible: porcentajeDisponible,
                usado: sumaActual,
                intento: porcentaje
            });
            return;
        }

        const sobreResidual = sobres.find(s => s.activo && esSobreResidual(s) && !s.esAhorro);
        await crearSobreUsuario(usuarioId, nombre, porcentaje, 0);

        const sobresActualizados = await obtenerSobresUsuario(usuarioId, usuarioEmail);
        const nuevoSobre = sobresActualizados
            .filter(s => !s.esAhorro && s.nombre.toLowerCase() === nombre.toLowerCase())
            .sort((a, b) => b.id - a.id)[0];

        if (sobreResidual && nuevoSobre) {
            const nuevoSaldo = Number((nuevoSobre.saldo + sobreResidual.saldo).toFixed(2));
            await actualizarSaldoSobre(nuevoSobre.id, nuevoSaldo);
            await actualizarSaldoSobre(sobreResidual.id, 0);
            await desactivarSobreUsuario(usuarioId, sobreResidual.id);
            nuevoSobre.saldo = nuevoSaldo;
        }

        res.status(201).json({
            mensaje: "Sobre creado correctamente.",
            sobre: nuevoSobre
        });
    } catch (error) {
        console.error("Error al crear sobre:", error);
        res.status(500).json({ mensaje: "Error interno al crear sobre." });
    }
};

// Configurar porcentaje del ahorro (solo una vez)
export const configurarAhorro = async (req: Request, res: Response): Promise<void> => {
    const usuarioEmail = req.headers["x-usuario-email"] as string;
    const { porcentaje, tiempoBloqueoMeses } = req.body as { porcentaje?: number; tiempoBloqueoMeses?: number };

    if (!usuarioEmail) {
        res.status(400).json({ mensaje: "Usuario no autenticado" });
        return;
    }

    if (!porcentaje || !tiempoBloqueoMeses) {
        res.status(400).json({ mensaje: "Porcentaje y tiempo de bloqueo son obligatorios." });
        return;
    }

    if (tiempoBloqueoMeses <= 0 || tiempoBloqueoMeses > 60) {
        res.status(400).json({ mensaje: "El tiempo de bloqueo debe estar entre 1 y 60 meses." });
        return;
    }

    if (porcentaje <= 0 || porcentaje >= 100) {
        res.status(400).json({ mensaje: "El porcentaje debe estar entre 1 y 99." });
        return;
    }

    try {
        const contexto = await getContextoUsuario(usuarioEmail);
        if (!contexto) {
            res.status(404).json({ mensaje: "Usuario no encontrado." });
            return;
        }

        const ahorro = contexto.sobres.find(s => s.esAhorro);
        if (!ahorro) {
            res.status(400).json({ mensaje: "No existe sobre de ahorro para este usuario." });
            return;
        }

        if (ahorro.porcentaje > 0) {
            res.status(400).json({ mensaje: "El porcentaje del ahorro ya fue configurado y no se puede cambiar." });
            return;
        }

        await actualizarAhorroUsuario(contexto.usuarioId, porcentaje, tiempoBloqueoMeses);
        const sobresActualizados = await obtenerSobresUsuario(contexto.usuarioId, usuarioEmail);
        const ahorroActualizado = sobresActualizados.find(s => s.esAhorro);

        res.json({
            mensaje: `Porcentaje de ahorro configurado con bloqueo de ${tiempoBloqueoMeses} meses.`,
            ahorro: ahorroActualizado,
            disponibleParaOtrosSobres: 100 - porcentaje
        });
    } catch (error) {
        console.error("Error al configurar ahorro:", error);
        res.status(500).json({ mensaje: "Error interno al configurar ahorro." });
    }
};

// Actualizar porcentajes de sobres no ahorro
export const actualizarPorcentajesSobres = async (req: Request, res: Response): Promise<void> => {
    const usuarioEmail = req.headers["x-usuario-email"] as string;
    const nuevosSobres = req.body as Array<{ id: number; porcentaje: number }>;

    if (!usuarioEmail) {
        res.status(400).json({ mensaje: "Usuario no autenticado" });
        return;
    }

    try {
        const contexto = await getContextoUsuario(usuarioEmail);
        if (!contexto) {
            res.status(404).json({ mensaje: "Usuario no encontrado." });
            return;
        }

        const ahorro = contexto.sobres.find(s => s.esAhorro);
        if (!ahorro || ahorro.porcentaje === 0) {
            res.status(400).json({ mensaje: "El ahorro no esta configurado." });
            return;
        }

        const porcentajeDisponible = 100 - ahorro.porcentaje;
        const suma = nuevosSobres.reduce((total, s) => total + s.porcentaje, 0);

        if (suma !== porcentajeDisponible) {
            res.status(400).json({
                mensaje: `Los porcentajes deben sumar exactamente ${porcentajeDisponible}%.`,
                sumaActual: suma,
                esperada: porcentajeDisponible
            });
            return;
        }

        for (const sobre of nuevosSobres) {
            await actualizarPorcentajeSobreUsuario(contexto.usuarioId, sobre.id, sobre.porcentaje);
        }

        const sobresActualizados = await obtenerSobresUsuario(contexto.usuarioId, usuarioEmail);
        res.json({
            mensaje: "Porcentajes actualizados correctamente.",
            sobres: sobresActualizados.filter(s => !s.esAhorro)
        });
    } catch (error) {
        console.error("Error al actualizar porcentajes:", error);
        res.status(500).json({ mensaje: "Error interno al actualizar porcentajes." });
    }
};

// Eliminar sobre (no se puede eliminar ahorro)
export const eliminarSobre = async (req: Request, res: Response): Promise<void> => {
    const usuarioEmail = req.headers["x-usuario-email"] as string;
    const id = Number(req.params.id);

    if (!usuarioEmail) {
        res.status(400).json({ mensaje: "Usuario no autenticado" });
        return;
    }

    try {
        const contexto = await getContextoUsuario(usuarioEmail);
        if (!contexto) {
            res.status(404).json({ mensaje: "Usuario no encontrado." });
            return;
        }

        const sobre = contexto.sobres.find(s => s.id === id && !s.esAhorro && s.activo);
        if (!sobre) {
            res.status(404).json({ mensaje: "Sobre no encontrado." });
            return;
        }

        if (sobre.saldo > 0) {
            res.status(400).json({ mensaje: "No puedes eliminar un sobre que todavia tiene saldo." });
            return;
        }

        await desactivarSobreUsuario(contexto.usuarioId, id);

        res.json({
            mensaje: `Sobre '${sobre.nombre}' desactivado correctamente.`
        });
    } catch (error) {
        console.error("Error al eliminar sobre:", error);
        res.status(500).json({ mensaje: "Error interno al eliminar sobre." });
    }
};

// Actualizar porcentaje de un sobre individual
export const actualizarPorcentajeSobre = async (req: Request, res: Response): Promise<void> => {
    const usuarioEmail = req.headers["x-usuario-email"] as string;
    const id = Number(req.params.id);
    const { porcentaje } = req.body as { porcentaje?: number };

    if (!usuarioEmail) {
        res.status(400).json({ mensaje: "Usuario no autenticado" });
        return;
    }

    if (porcentaje == null || porcentaje < 0) {
        res.status(400).json({ mensaje: "Porcentaje invalido" });
        return;
    }

    try {
        const contexto = await getContextoUsuario(usuarioEmail);
        if (!contexto) {
            res.status(404).json({ mensaje: "Usuario no encontrado." });
            return;
        }

        const sobre = contexto.sobres.find(s => s.id === id && !s.esAhorro && s.activo);
        if (!sobre) {
            res.status(404).json({ mensaje: "Sobre no encontrado." });
            return;
        }

        const ahorro = contexto.sobres.find(s => s.esAhorro);
        const porcentajeDisponible = 100 - (ahorro?.porcentaje ?? 0);
        const sumaOtros = contexto.sobres
            .filter(s => !s.esAhorro && s.id !== id && s.activo)
            .reduce((total, s) => total + s.porcentaje, 0);

        if (sumaOtros + porcentaje > porcentajeDisponible) {
            res.status(400).json({
                mensaje: `Has excedido el limite. Disponible: ${porcentajeDisponible}%. Otros sobres usan: ${sumaOtros}%. Intentas usar: ${porcentaje}%. Total: ${sumaOtros + porcentaje}%.`
            });
            return;
        }

        await actualizarPorcentajeSobreUsuario(contexto.usuarioId, id, porcentaje);

        const sobresActualizados = await obtenerSobresUsuario(contexto.usuarioId, usuarioEmail);
        const sobreActualizado = sobresActualizados.find(s => s.id === id && !s.esAhorro);

        res.json({
            mensaje: `Porcentaje de '${sobre.nombre}' actualizado de ${sobre.porcentaje}% a ${porcentaje}%.`,
            sobre: sobreActualizado
        });
    } catch (error) {
        console.error("Error al actualizar porcentaje:", error);
        res.status(500).json({ mensaje: "Error interno al actualizar porcentaje." });
    }
};

// Actualizar nombre y/o porcentaje de un sobre creado por el usuario
export const actualizarSobre = async (req: Request, res: Response): Promise<void> => {
    const usuarioEmail = req.headers["x-usuario-email"] as string;
    const id = Number(req.params.id);
    const { nombre, porcentaje } = req.body as { nombre?: string; porcentaje?: number };

    if (!usuarioEmail) {
        res.status(400).json({ mensaje: "Usuario no autenticado" });
        return;
    }

    if (nombre == null && porcentaje == null) {
        res.status(400).json({ mensaje: "Debes enviar al menos nombre o porcentaje para actualizar." });
        return;
    }

    const nombreLimpio = nombre?.trim();
    if (nombre != null && !nombreLimpio) {
        res.status(400).json({ mensaje: "Nombre invalido." });
        return;
    }

    if (porcentaje != null && porcentaje < 0) {
        res.status(400).json({ mensaje: "Porcentaje invalido" });
        return;
    }

    try {
        const contexto = await getContextoUsuario(usuarioEmail);
        if (!contexto) {
            res.status(404).json({ mensaje: "Usuario no encontrado." });
            return;
        }

        const sobre = contexto.sobres.find(s => s.id === id && !s.esAhorro && s.activo);
        if (!sobre) {
            res.status(404).json({ mensaje: "Sobre no encontrado." });
            return;
        }

        if (nombreLimpio) {
            const existeNombre = contexto.sobres.find(
                s => !s.esAhorro && s.activo && s.id !== id && s.nombre.toLowerCase() === nombreLimpio.toLowerCase()
            );
            if (existeNombre) {
                res.status(400).json({ mensaje: "Ya existe un sobre con ese nombre." });
                return;
            }
        }

        if (porcentaje != null) {
            const ahorro = contexto.sobres.find(s => s.esAhorro);
            const porcentajeDisponible = 100 - (ahorro?.porcentaje ?? 0);
            const sumaOtros = contexto.sobres
                .filter(s => !s.esAhorro && s.id !== id && s.activo)
                .reduce((total, s) => total + s.porcentaje, 0);

            if (sumaOtros + porcentaje > porcentajeDisponible) {
                res.status(400).json({
                    mensaje: `Has excedido el limite. Disponible: ${porcentajeDisponible}%. Otros sobres usan: ${sumaOtros}%. Intentas usar: ${porcentaje}%. Total: ${sumaOtros + porcentaje}%.`
                });
                return;
            }
        }

        await actualizarSobreUsuario(contexto.usuarioId, id, {
            nombre: nombreLimpio,
            porcentaje
        });

        const sobresActualizados = await obtenerSobresUsuario(contexto.usuarioId, usuarioEmail);
        const sobreActualizado = sobresActualizados.find(s => s.id === id && !s.esAhorro);

        res.json({
            mensaje: "Sobre actualizado correctamente.",
            sobre: sobreActualizado
        });
    } catch (error) {
        console.error("Error al actualizar sobre:", error);
        res.status(500).json({ mensaje: "Error interno al actualizar sobre." });
    }
};