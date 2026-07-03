"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.obtenerRetirosSobre = exports.realizarRetiro = exports.obtenerRetiros = void 0;
const Retiro_1 = require("../data/Retiro");
const Sobres_1 = require("../data/Sobres");
const Notificacion_1 = require("../data/Notificacion");
const Retiro_2 = __importDefault(require("../Models/Retiro"));
const Notificacion_2 = __importDefault(require("../Models/Notificacion"));
// Obtener todos los retiros del usuario actual
const obtenerRetiros = (req, res) => {
    const usuarioEmail = req.headers["x-usuario-email"];
    if (!usuarioEmail) {
        res.status(400).json({
            mensaje: "Usuario no autenticado"
        });
        return;
    }
    const retirosUsuario = Retiro_1.retiros.filter(r => r.usuarioEmail === usuarioEmail);
    res.json(retirosUsuario);
};
exports.obtenerRetiros = obtenerRetiros;
// Realizar retiro
const realizarRetiro = (req, res) => {
    const usuarioEmail = req.headers["x-usuario-email"];
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
    const sobre = Sobres_1.sobres.find(s => s.id === sobreId && s.usuarioEmail === usuarioEmail);
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
    const nuevoId = Retiro_1.retiros.length > 0
        ? Math.max(...Retiro_1.retiros.map(r => r.id)) + 1
        : 1;
    const nuevoRetiro = new Retiro_2.default(nuevoId, usuarioEmail, sobreId, monto);
    Retiro_1.retiros.push(nuevoRetiro);
    // Crear notificación si el saldo queda bajo
    if (sobre.esAutomatico && sobre.saldo < sobre.montoAutomatico) {
        const notifId = Notificacion_1.notificaciones.length > 0
            ? Math.max(...Notificacion_1.notificaciones.map(n => n.id)) + 1
            : 1;
        const notif = new Notificacion_2.default(notifId, 1, "saldo_insuficiente", `Saldo insuficiente en ${sobre.nombre} para el pago automático. Saldo actual: $${sobre.saldo}`);
        Notificacion_1.notificaciones.push(notif);
    }
    res.status(201).json({
        mensaje: "Retiro realizado exitosamente.",
        retiro: nuevoRetiro,
        nuevoSaldo: sobre.saldo
    });
};
exports.realizarRetiro = realizarRetiro;
// Obtener historial de retiros de un sobre
const obtenerRetirosSobre = (req, res) => {
    const usuarioEmail = req.headers["x-usuario-email"];
    const sobreId = Number(req.params.sobreId);
    if (!usuarioEmail) {
        res.status(400).json({
            mensaje: "Usuario no autenticado"
        });
        return;
    }
    const retirosSobre = Retiro_1.retiros.filter(r => r.sobreId === sobreId && r.usuarioEmail === usuarioEmail);
    res.json(retirosSobre);
};
exports.obtenerRetirosSobre = obtenerRetirosSobre;
