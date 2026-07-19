"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.obtenerRetirosSobre = exports.realizarRetiro = exports.obtenerRetiros = void 0;
const sqlStore_1 = require("../services/sqlStore");
// Obtener todos los retiros del usuario actual
const obtenerRetiros = async (req, res) => {
    const usuarioEmail = req.headers["x-usuario-email"];
    if (!usuarioEmail) {
        res.status(400).json({ mensaje: "Usuario no autenticado" });
        return;
    }
    try {
        const usuario = await (0, sqlStore_1.obtenerUsuarioPorEmail)(usuarioEmail);
        if (!usuario) {
            res.status(404).json({ mensaje: "Usuario no encontrado." });
            return;
        }
        const retiros = await (0, sqlStore_1.obtenerMovimientosUsuario)(usuario.id, "Retiro");
        const retirosUsuario = retiros.map(r => ({
            id: Number(r.idMovimiento),
            usuarioEmail: usuario.email,
            sobreId: r.idSobre ? Number(r.idSobre) : (r.idAhorro ? Number(r.idAhorro) : 0),
            monto: Number(r.monto),
            fecha: r.fechaMovimiento,
            estado: "completado"
        }));
        res.json(retirosUsuario);
    }
    catch (error) {
        console.error("Error al obtener retiros:", error);
        res.status(500).json({ mensaje: "Error interno al obtener retiros." });
    }
};
exports.obtenerRetiros = obtenerRetiros;
// Realizar retiro
const realizarRetiro = async (req, res) => {
    const usuarioEmail = req.headers["x-usuario-email"];
    const { sobreId, monto } = req.body;
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
        const usuario = await (0, sqlStore_1.obtenerUsuarioPorEmail)(usuarioEmail);
        if (!usuario) {
            res.status(404).json({ mensaje: "Usuario no encontrado." });
            return;
        }
        const sobres = await (0, sqlStore_1.obtenerSobresUsuario)(usuario.id, usuario.email);
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
            await (0, sqlStore_1.actualizarSaldoAhorro)(sobre.id, nuevoSaldo);
        }
        else {
            await (0, sqlStore_1.actualizarSaldoSobre)(sobre.id, nuevoSaldo);
        }
        const movimiento = await (0, sqlStore_1.registrarMovimiento)(usuario.id, "Retiro", monto, `Retiro de ${sobre.nombre}`, sobre.esAhorro ? null : sobre.id, sobre.esAhorro ? sobre.id : null);
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
    }
    catch (error) {
        console.error("Error al realizar retiro:", error);
        res.status(500).json({ mensaje: "Error interno al realizar retiro." });
    }
};
exports.realizarRetiro = realizarRetiro;
// Obtener historial de retiros de un sobre
const obtenerRetirosSobre = async (req, res) => {
    const usuarioEmail = req.headers["x-usuario-email"];
    const sobreId = Number(req.params.sobreId);
    if (!usuarioEmail) {
        res.status(400).json({ mensaje: "Usuario no autenticado" });
        return;
    }
    try {
        const usuario = await (0, sqlStore_1.obtenerUsuarioPorEmail)(usuarioEmail);
        if (!usuario) {
            res.status(404).json({ mensaje: "Usuario no encontrado." });
            return;
        }
        const retiros = await (0, sqlStore_1.obtenerMovimientosUsuario)(usuario.id, "Retiro");
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
    }
    catch (error) {
        console.error("Error al obtener retiros por sobre:", error);
        res.status(500).json({ mensaje: "Error interno al obtener retiros por sobre." });
    }
};
exports.obtenerRetirosSobre = obtenerRetirosSobre;
