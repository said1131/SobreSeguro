"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.obtenerHistorialCompleto = exports.actualizarIngreso = exports.obtenerIngreso = void 0;
const Ingreso_1 = require("../data/Ingreso");
const Retiro_1 = require("../data/Retiro");
const Sobres_1 = require("../data/Sobres");
const Notificacion_1 = require("../data/Notificacion");
const Notificacion_2 = __importDefault(require("../Models/Notificacion"));
const Ingreso_2 = __importDefault(require("../Models/Ingreso"));
// Obtener ingresos del usuario
const obtenerIngreso = (req, res) => {
    const usuarioEmail = req.headers["x-usuario-email"];
    if (!usuarioEmail) {
        res.status(400).json({
            mensaje: "Usuario no autenticado"
        });
        return;
    }
    const ingresosUsuario = Ingreso_1.ingresos.filter(i => i.usuarioEmail === usuarioEmail);
    const totalMonto = ingresosUsuario.reduce((sum, i) => sum + i.monto, 0);
    res.json({
        monto: totalMonto,
        historial: ingresosUsuario
    });
};
exports.obtenerIngreso = obtenerIngreso;
// Actualizar ingreso y distribuir automáticamente
const actualizarIngreso = (req, res) => {
    const usuarioEmail = req.headers["x-usuario-email"];
    const { monto } = req.body;
    if (!usuarioEmail) {
        res.status(400).json({
            mensaje: "Usuario no autenticado"
        });
        return;
    }
    if (monto == null || monto < 0) {
        res.status(400).json({
            mensaje: "Ingrese un monto válido."
        });
        return;
    }
    const sobresUsuario = Sobres_1.sobres.filter(s => s.usuarioEmail === usuarioEmail);
    const ahorro = sobresUsuario.find(s => s.esAhorro);
    if (!ahorro || ahorro.porcentaje === 0) {
        res.status(400).json({
            mensaje: "Debes configurar el ahorro primero."
        });
        return;
    }
    // Registrar el ingreso en el historial
    const nuevoIngreso = new Ingreso_2.default(monto, usuarioEmail, new Date());
    Ingreso_1.ingresos.push(nuevoIngreso);
    // Calcular distribución
    const montoAlAhorro = Number(((monto * ahorro.porcentaje) / 100).toFixed(2));
    ahorro.saldo = Number((ahorro.saldo + montoAlAhorro).toFixed(2));
    // Distribuir entre otros sobres activos
    sobresUsuario.forEach(sobre => {
        if (!sobre.esAhorro && sobre.activo) {
            const montoSobre = Number(((monto * sobre.porcentaje) / 100).toFixed(2));
            sobre.saldo = Number((sobre.saldo + montoSobre).toFixed(2));
        }
    });
    // Crear notificaciones para pagos automáticos si hay saldo insuficiente
    sobresUsuario.forEach(sobre => {
        if (sobre.esAutomatico && sobre.saldo < sobre.montoAutomatico) {
            const notifId = Notificacion_1.notificaciones.length > 0
                ? Math.max(...Notificacion_1.notificaciones.map(n => n.id)) + 1
                : 1;
            const notif = new Notificacion_2.default(notifId, 1, // usuarioId por defecto
            "saldo_insuficiente", `Advertencia: Saldo bajo en '${sobre.nombre}'. Se requieren $${sobre.montoAutomatico} pero tienes $${sobre.saldo}.`);
            Notificacion_1.notificaciones.push(notif);
        }
    });
    res.json({
        mensaje: "Ingreso actualizado correctamente. Distribución realizada.",
        ingreso: {
            monto: monto,
            distribuido: true
        },
        distribucion: {
            alAhorro: montoAlAhorro,
            porcentajeAhorro: ahorro.porcentaje
        },
        sobres: sobresUsuario.filter(s => s.activo).map(s => ({
            id: s.id,
            nombre: s.nombre,
            porcentaje: s.porcentaje,
            saldo: s.saldo,
            esAhorro: s.esAhorro,
            esAutomatico: s.esAutomatico,
            montoAutomatico: s.montoAutomatico
        }))
    });
};
exports.actualizarIngreso = actualizarIngreso;
// Obtener historial completo (ingresos + retiros)
const obtenerHistorialCompleto = (req, res) => {
    const usuarioEmail = req.headers["x-usuario-email"];
    if (!usuarioEmail) {
        res.status(400).json({
            mensaje: "Usuario no autenticado"
        });
        return;
    }
    // Obtener ingresos del usuario
    const ingresosUsuario = Ingreso_1.ingresos.filter(i => i.usuarioEmail === usuarioEmail);
    const movimientosIngresos = ingresosUsuario.map(ingreso => ({
        id: `ingreso-${ingreso.usuarioEmail}-${ingreso.fecha}`,
        tipo: 'ingreso',
        fecha: ingreso.fecha,
        concepto: 'Ingreso general',
        monto: ingreso.monto,
        sobreAsociado: 'Distribución'
    }));
    // Obtener retiros del usuario
    const retirosUsuario = Retiro_1.retiros.filter(r => r.usuarioEmail === usuarioEmail);
    const movimientosRetiros = retirosUsuario.map(retiro => ({
        id: `retiro-${retiro.id}`,
        tipo: 'retiro',
        fecha: retiro.fecha,
        concepto: `Retiro de ${Sobres_1.sobres.find(s => s.id === retiro.sobreId)?.nombre || 'Sobre'}`,
        monto: -retiro.monto, // Negativo para retiros
        sobreAsociado: Sobres_1.sobres.find(s => s.id === retiro.sobreId)?.nombre || 'Desconocido'
    }));
    // Combinar y ordenar por fecha (más reciente primero)
    const historialCompleto = [...movimientosIngresos, ...movimientosRetiros]
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    res.json({
        historial: historialCompleto
    });
};
exports.obtenerHistorialCompleto = obtenerHistorialCompleto;
