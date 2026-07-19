"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.obtenerHistorialCompleto = exports.actualizarIngreso = exports.obtenerIngreso = void 0;
const sqlStore_1 = require("../services/sqlStore");
const isResidual = (nombre) => nombre.toLowerCase() === "residuo";
// Obtener ingresos del usuario
const obtenerIngreso = async (req, res) => {
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
        const ingresos = await (0, sqlStore_1.obtenerMovimientosUsuario)(usuario.id, "Ingreso");
        const historial = ingresos.map(item => ({
            monto: Number(item.monto),
            usuarioEmail: usuario.email,
            fecha: item.fechaMovimiento
        }));
        const totalMonto = historial.reduce((sum, item) => sum + item.monto, 0);
        res.json({
            monto: totalMonto,
            historial
        });
    }
    catch (error) {
        console.error("Error al obtener ingresos:", error);
        res.status(500).json({ mensaje: "Error interno al obtener ingresos." });
    }
};
exports.obtenerIngreso = obtenerIngreso;
// Actualizar ingreso y distribuir automaticamente
const actualizarIngreso = async (req, res) => {
    const usuarioEmail = req.headers["x-usuario-email"];
    const { monto } = req.body;
    if (!usuarioEmail) {
        res.status(400).json({ mensaje: "Usuario no autenticado" });
        return;
    }
    if (monto == null || monto < 0) {
        res.status(400).json({ mensaje: "Ingrese un monto valido." });
        return;
    }
    try {
        const usuario = await (0, sqlStore_1.obtenerUsuarioPorEmail)(usuarioEmail);
        if (!usuario) {
            res.status(404).json({ mensaje: "Usuario no encontrado." });
            return;
        }
        const sobresUsuario = await (0, sqlStore_1.obtenerSobresUsuario)(usuario.id, usuario.email);
        const ahorro = sobresUsuario.find(s => s.esAhorro);
        if (!ahorro || ahorro.porcentaje === 0) {
            res.status(400).json({ mensaje: "Debes configurar el ahorro primero." });
            return;
        }
        await (0, sqlStore_1.registrarMovimiento)(usuario.id, "Ingreso", monto, "Ingreso general", null, null);
        const montoAlAhorro = Number(((monto * ahorro.porcentaje) / 100).toFixed(2));
        const nuevoSaldoAhorro = Number((ahorro.saldo + montoAlAhorro).toFixed(2));
        await (0, sqlStore_1.actualizarSaldoAhorro)(ahorro.id, nuevoSaldoAhorro);
        const sobresActivos = sobresUsuario.filter(s => !s.esAhorro && s.activo && !isResidual(s.nombre));
        const porcentajeTotal = sobresActivos.reduce((sum, sobre) => sum + sobre.porcentaje, 0);
        const porcentajeRestante = Math.max(0, 100 - ahorro.porcentaje - porcentajeTotal);
        const montoResidual = porcentajeRestante > 0
            ? Number(((monto * porcentajeRestante) / 100).toFixed(2))
            : 0;
        for (const sobre of sobresActivos) {
            const montoSobre = Number(((monto * sobre.porcentaje) / 100).toFixed(2));
            const nuevoSaldo = Number((sobre.saldo + montoSobre).toFixed(2));
            await (0, sqlStore_1.actualizarSaldoSobre)(sobre.id, nuevoSaldo);
        }
        const sobreResidual = sobresUsuario.find(s => !s.esAhorro && s.activo && isResidual(s.nombre));
        if (sobreResidual) {
            const saldoResidual = Number((sobreResidual.saldo + montoResidual).toFixed(2));
            await (0, sqlStore_1.actualizarSaldoSobre)(sobreResidual.id, saldoResidual);
        }
        else if (montoResidual > 0) {
            await (0, sqlStore_1.crearSobreUsuario)(usuario.id, "Residuo", porcentajeRestante, montoResidual);
        }
        const sobresActualizados = await (0, sqlStore_1.obtenerSobresUsuario)(usuario.id, usuario.email);
        res.json({
            mensaje: "Ingreso actualizado correctamente. Distribucion realizada.",
            ingreso: {
                monto,
                distribuido: true
            },
            distribucion: {
                alAhorro: montoAlAhorro,
                porcentajeAhorro: ahorro.porcentaje,
                montoResidual,
                porcentajeResidual: porcentajeRestante
            },
            sobres: sobresActualizados.filter(s => s.activo).map(s => ({
                id: s.id,
                nombre: s.nombre,
                porcentaje: s.porcentaje,
                saldo: s.saldo,
                esAhorro: s.esAhorro,
                esAutomatico: s.esAutomatico,
                montoAutomatico: s.montoAutomatico,
                fechaProximoPago: s.fechaProximoPago
            }))
        });
    }
    catch (error) {
        console.error("Error al actualizar ingreso:", error);
        res.status(500).json({ mensaje: "Error interno al actualizar ingreso." });
    }
};
exports.actualizarIngreso = actualizarIngreso;
// Obtener historial completo (ingresos + retiros)
const obtenerHistorialCompleto = async (req, res) => {
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
        const movimientos = await (0, sqlStore_1.obtenerMovimientosUsuario)(usuario.id);
        const sobres = await (0, sqlStore_1.obtenerSobresUsuario)(usuario.id, usuario.email, true);
        const nombreSobrePorId = new Map();
        const nombreAhorroPorId = new Map();
        for (const sobre of sobres) {
            if (sobre.esAhorro) {
                nombreAhorroPorId.set(sobre.id, sobre.nombre);
            }
            else {
                nombreSobrePorId.set(sobre.id, sobre.nombre);
            }
        }
        const historial = movimientos.map(item => {
            const tipo = String(item.tipoMovimiento);
            const idSobre = item.idSobre ? Number(item.idSobre) : null;
            const idAhorro = item.idAhorro ? Number(item.idAhorro) : null;
            const nombreAsociado = idSobre
                ? (nombreSobrePorId.get(idSobre) ?? "Sobre")
                : idAhorro
                    ? (nombreAhorroPorId.get(idAhorro) ?? "Ahorro")
                    : "Distribucion";
            if (tipo === "Retiro") {
                return {
                    id: `retiro-${item.idMovimiento}`,
                    tipo: "retiro",
                    fecha: item.fechaMovimiento,
                    concepto: `Retiro de ${nombreAsociado}`,
                    monto: -Number(item.monto),
                    sobreAsociado: nombreAsociado
                };
            }
            return {
                id: `ingreso-${item.idMovimiento}`,
                tipo: "ingreso",
                fecha: item.fechaMovimiento,
                concepto: String(item.descripcion ?? "Ingreso general"),
                monto: Number(item.monto),
                sobreAsociado: "Distribucion"
            };
        });
        res.json({ historial });
    }
    catch (error) {
        console.error("Error al obtener historial:", error);
        res.status(500).json({ mensaje: "Error interno al obtener historial." });
    }
};
exports.obtenerHistorialCompleto = obtenerHistorialCompleto;
