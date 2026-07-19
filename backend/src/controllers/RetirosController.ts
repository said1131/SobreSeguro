import { Request, Response } from "express";
import {
    actualizarSaldoAhorro,
    actualizarSaldoSobre,
    obtenerMovimientosUsuario,
    obtenerSobresUsuario,
    obtenerUsuarioPorEmail,
    registrarMovimiento
} from "../services/sqlStore";

// Obtener todos los retiros del usuario actual
export const obtenerRetiros = async (req: Request, res: Response): Promise<void> => {
    const usuarioEmail = req.headers["x-usuario-email"] as string;

    if (!usuarioEmail) {
        res.status(400).json({ mensaje: "Usuario no autenticado" });
        return;
    }

    try {
        const usuario = await obtenerUsuarioPorEmail(usuarioEmail);
        if (!usuario) {
            res.status(404).json({ mensaje: "Usuario no encontrado." });
            return;
        }

        const retiros = await obtenerMovimientosUsuario(usuario.id, "Retiro");
        const retirosUsuario = retiros.map(r => ({
            id: Number(r.idMovimiento),
            usuarioEmail: usuario.email,
            sobreId: r.idSobre ? Number(r.idSobre) : (r.idAhorro ? Number(r.idAhorro) : 0),
            monto: Number(r.monto),
            fecha: r.fechaMovimiento,
            estado: "completado"
        }));

        res.json(retirosUsuario);
    } catch (error) {
        console.error("Error al obtener retiros:", error);
        res.status(500).json({ mensaje: "Error interno al obtener retiros." });
    }
};

// Realizar retiro
export const realizarRetiro = async (req: Request, res: Response): Promise<void> => {
    const usuarioEmail = req.headers["x-usuario-email"] as string;
    const { sobreId, monto } = req.body as { sobreId?: number; monto?: number };

    if (!usuarioEmail) {
        res.status(400).json({ mensaje: "Usuario no autenticado" });
        return;
    }

    if (!sobreId || !monto) {
        res.status(400).json({ mensaje: "sobreId y monto son obligatorios." });
        return;
    }

    if (monto <= 0) {
        res.status(400).json({ mensaje: "El monto debe ser mayor a 0." });
        return;
    }

    try {
        const usuario = await obtenerUsuarioPorEmail(usuarioEmail);
        if (!usuario) {
            res.status(404).json({ mensaje: "Usuario no encontrado." });
            return;
        }

        const sobres = await obtenerSobresUsuario(usuario.id, usuario.email);
        const sobre = sobres.find(s => s.id === sobreId && s.activo);

        if (!sobre) {
            res.status(404).json({ mensaje: "Sobre no encontrado." });
            return;
        }

        if (sobre.esAhorro) {
            if (!sobre.fechaBloqueo) {
                res.status(400).json({ mensaje: "El sobre de ahorro no tiene fecha de bloqueo configurada." });
                return;
            }

            const ahora = new Date();
            if (ahora < sobre.fechaBloqueo) {
                const tiempoRestante = Math.ceil((sobre.fechaBloqueo.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24));
                res.status(400).json({
                    mensaje: `El sobre de ahorro esta bloqueado. Faltan ${tiempoRestante} dias para poder retirar.`,
                    bloqueado: true,
                    diasRestantes: tiempoRestante,
                    fechaDesbloqueo: sobre.fechaBloqueo
                });
                return;
            }
        }

        if (sobre.saldo < monto) {
            res.status(400).json({
                mensaje: `Saldo insuficiente. Disponible: $${sobre.saldo}`,
                saldoDisponible: sobre.saldo
            });
            return;
        }

        const nuevoSaldo = Number((sobre.saldo - monto).toFixed(2));

        if (sobre.esAhorro) {
            await actualizarSaldoAhorro(sobre.id, nuevoSaldo);
        } else {
            await actualizarSaldoSobre(sobre.id, nuevoSaldo);
        }

        const movimiento = await registrarMovimiento(
            usuario.id,
            "Retiro",
            monto,
            `Retiro de ${sobre.nombre}`,
            sobre.esAhorro ? null : sobre.id,
            sobre.esAhorro ? sobre.id : null
        );

        res.status(201).json({
            mensaje: "Retiro realizado exitosamente.",
            retiro: {
                id: movimiento.idMovimiento,
                usuarioEmail: usuario.email,
                sobreId,
                monto,
                fecha: movimiento.fechaMovimiento,
                estado: "completado"
            },
            nuevoSaldo
        });
    } catch (error) {
        console.error("Error al realizar retiro:", error);
        res.status(500).json({ mensaje: "Error interno al realizar retiro." });
    }
};

// Obtener historial de retiros de un sobre
export const obtenerRetirosSobre = async (req: Request, res: Response): Promise<void> => {
    const usuarioEmail = req.headers["x-usuario-email"] as string;
    const sobreId = Number(req.params.sobreId);

    if (!usuarioEmail) {
        res.status(400).json({ mensaje: "Usuario no autenticado" });
        return;
    }

    try {
        const usuario = await obtenerUsuarioPorEmail(usuarioEmail);
        if (!usuario) {
            res.status(404).json({ mensaje: "Usuario no encontrado." });
            return;
        }

        const retiros = await obtenerMovimientosUsuario(usuario.id, "Retiro");
        const retirosSobre = retiros
            .filter(r => (r.idSobre ? Number(r.idSobre) : Number(r.idAhorro ?? 0)) === sobreId)
            .map(r => ({
                id: Number(r.idMovimiento),
                usuarioEmail: usuario.email,
                sobreId,
                monto: Number(r.monto),
                fecha: r.fechaMovimiento,
                estado: "completado"
            }));

        res.json(retirosSobre);
    } catch (error) {
        console.error("Error al obtener retiros por sobre:", error);
        res.status(500).json({ mensaje: "Error interno al obtener retiros por sobre." });
    }
};