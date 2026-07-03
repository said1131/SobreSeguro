import { Request, Response } from "express";
import { retiros } from "../data/Retiro";
import { sobres } from "../data/Sobres";
import { notificaciones } from "../data/Notificacion";
import Retiro from "../Models/Retiro";
import Notificacion from "../Models/Notificacion";

// Obtener todos los retiros del usuario actual
export const obtenerRetiros = (req: Request, res: Response): void => {
    const usuarioEmail = req.headers["x-usuario-email"] as string;

    if (!usuarioEmail) {
        res.status(400).json({
            mensaje: "Usuario no autenticado"
        });
        return;
    }

    const retirosUsuario = retiros.filter(r => r.usuarioEmail === usuarioEmail);

    res.json(retirosUsuario);
};

// Realizar retiro
export const realizarRetiro = (req: Request, res: Response): void => {
    const usuarioEmail = req.headers["x-usuario-email"] as string;
    const { sobreId, monto } = req.body;

    if (!usuarioEmail) {
        res.status(400).json({
            mensaje: "Usuario no autenticado"
        });
        return;
    }

    // Validaciones
    if (!sobreId || !monto) {
        res.status(400).json({
            mensaje: "sobreId y monto son obligatorios."
        });
        return;
    }

    if (monto <= 0) {
        res.status(400).json({
            mensaje: "El monto debe ser mayor a 0."
        });
        return;
    }

    // Verificar que el sobre existe y pertenece al usuario
    const sobre = sobres.find(s => s.id === sobreId && s.usuarioEmail === usuarioEmail);

    if (!sobre) {
        res.status(404).json({
            mensaje: "Sobre no encontrado."
        });
        return;
    }

    // Verificar si es retiro del ahorro y validar bloqueo
    if (sobre.esAhorro) {
        if (!sobre.fechaBloqueo) {
            res.status(400).json({
                mensaje: "El sobre de ahorro no tiene fecha de bloqueo configurada."
            });
            return;
        }

        const ahora = new Date();
        if (ahora < sobre.fechaBloqueo) {
            const tiempoRestante = Math.ceil((sobre.fechaBloqueo.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24));
            res.status(400).json({
                mensaje: `El sobre de ahorro está bloqueado. Faltan ${tiempoRestante} días para poder retirar.`,
                bloqueado: true,
                diasRestantes: tiempoRestante,
                fechaDesbloqueo: sobre.fechaBloqueo
            });
            return;
        }
    }

    // Validar saldo suficiente
    if (sobre.saldo < monto) {
        res.status(400).json({
            mensaje: `Saldo insuficiente. Disponible: $${sobre.saldo}`,
            saldoDisponible: sobre.saldo
        });
        return;
    }

    // Realizar retiro
    sobre.saldo = Number((sobre.saldo - monto).toFixed(2));

    // Crear registro de retiro
    const nuevoId = retiros.length > 0 
        ? Math.max(...retiros.map(r => r.id)) + 1 
        : 1;

    const nuevoRetiro = new Retiro(
        nuevoId,
        usuarioEmail,
        sobreId,
        monto
    );

    retiros.push(nuevoRetiro);

    // Crear notificación si el saldo queda bajo
    if (sobre.esAutomatico && sobre.saldo < sobre.montoAutomatico) {
        const notifId = notificaciones.length > 0 
            ? Math.max(...notificaciones.map(n => n.id)) + 1 
            : 1;

        const notif = new Notificacion(
            notifId,
            1,
            "saldo_insuficiente",
            `Saldo insuficiente en ${sobre.nombre} para el pago automático. Saldo actual: $${sobre.saldo}`
        );

        notificaciones.push(notif);
    }

    res.status(201).json({
        mensaje: "Retiro realizado exitosamente.",
        retiro: nuevoRetiro,
        nuevoSaldo: sobre.saldo
    });
};

// Obtener historial de retiros de un sobre
export const obtenerRetirosSobre = (req: Request, res: Response): void => {
    const usuarioEmail = req.headers["x-usuario-email"] as string;
    const sobreId = Number(req.params.sobreId);

    if (!usuarioEmail) {
        res.status(400).json({
            mensaje: "Usuario no autenticado"
        });
        return;
    }

    const retirosSobre = retiros.filter(r => r.sobreId === sobreId && r.usuarioEmail === usuarioEmail);

    res.json(retirosSobre);
};
