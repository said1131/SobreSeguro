"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.obtenerMovimientosUsuario = exports.registrarMovimiento = exports.actualizarSaldoAhorro = exports.actualizarSaldoSobre = exports.desactivarSobreUsuario = exports.actualizarSobreUsuario = exports.actualizarPorcentajeSobreUsuario = exports.actualizarAhorroUsuario = exports.crearSobreUsuario = exports.obtenerSobresUsuario = exports.asegurarAhorroUsuario = exports.actualizarUsuario = exports.crearUsuario = exports.obtenerUsuarioPorId = exports.obtenerUsuarioPorEmail = void 0;
const mssql_1 = __importDefault(require("mssql"));
const Database_1 = require("../config/Database");
const toNumber = (value) => Number(value ?? 0);
const normalizeEmail = (email) => email.trim().toLowerCase();
const isWaterOrLight = (nombre) => {
    const n = nombre.trim().toLowerCase();
    return n === "agua" || n === "luz";
};
const firstDayNextMonth = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 1);
};
const monthDiff = (from, to) => {
    const years = to.getFullYear() - from.getFullYear();
    const months = to.getMonth() - from.getMonth();
    return Math.max(0, years * 12 + months);
};
const mapUsuario = (row) => ({
    id: Number(row.idUsuario),
    firstName: String(row.nombre ?? ""),
    lastName: String(row.apellido ?? ""),
    email: String(row.correo ?? ""),
    password: String(row.contrasena ?? "")
});
const mapSobreNormal = (row, usuarioEmail) => {
    const servicio = isWaterOrLight(row.nombre);
    return {
        id: Number(row.idSobre),
        nombre: row.nombre,
        porcentaje: toNumber(row.porcentaje),
        saldo: toNumber(row.saldo),
        esAhorro: false,
        activo: Boolean(row.activo),
        esAutomatico: servicio || Boolean(row.pagoAutomatico),
        montoAutomatico: 0,
        frecuenciaAutomatica: servicio ? (row.frecuenciaPago ?? "mensual") : (row.frecuenciaPago ?? "mensual"),
        usuarioEmail,
        fechaBloqueo: null,
        tiempoBloqueoMeses: 0,
        fechaProximoPago: servicio ? (row.fechaProximoPago ?? firstDayNextMonth()) : row.fechaProximoPago
    };
};
const mapSobreAhorro = (row, usuarioEmail) => ({
    id: Number(row.idAhorro),
    nombre: row.nombre,
    porcentaje: toNumber(row.porcentaje),
    saldo: toNumber(row.saldo),
    esAhorro: true,
    activo: true,
    esAutomatico: false,
    montoAutomatico: 0,
    frecuenciaAutomatica: "mensual",
    usuarioEmail,
    fechaBloqueo: row.fechaDesbloqueo,
    tiempoBloqueoMeses: monthDiff(new Date(row.fechaInicio), new Date(row.fechaDesbloqueo)),
    fechaProximoPago: null
});
const obtenerUsuarioPorEmail = async (email) => {
    const pool = await (0, Database_1.getPool)();
    const result = await pool
        .request()
        .input("correo", mssql_1.default.VarChar(100), normalizeEmail(email))
        .query(`
            SELECT TOP (1) *
            FROM Usuario
            WHERE LOWER(correo) = LOWER(@correo) AND activo = 1
        `);
    if (result.recordset.length === 0) {
        return null;
    }
    return mapUsuario(result.recordset[0]);
};
exports.obtenerUsuarioPorEmail = obtenerUsuarioPorEmail;
const obtenerUsuarioPorId = async (idUsuario) => {
    const pool = await (0, Database_1.getPool)();
    const result = await pool
        .request()
        .input("idUsuario", mssql_1.default.Int, idUsuario)
        .query(`
            SELECT TOP (1) *
            FROM Usuario
            WHERE idUsuario = @idUsuario AND activo = 1
        `);
    if (result.recordset.length === 0) {
        return null;
    }
    return mapUsuario(result.recordset[0]);
};
exports.obtenerUsuarioPorId = obtenerUsuarioPorId;
const crearUsuario = async (firstName, lastName, email, password) => {
    const pool = await (0, Database_1.getPool)();
    const result = await pool
        .request()
        .input("nombre", mssql_1.default.VarChar(100), firstName)
        .input("apellido", mssql_1.default.VarChar(100), lastName)
        .input("correo", mssql_1.default.VarChar(100), normalizeEmail(email))
        .input("contrasena", mssql_1.default.VarChar(255), password)
        .query(`
            INSERT INTO Usuario (nombre, apellido, correo, contrasena)
            OUTPUT INSERTED.*
            VALUES (@nombre, @apellido, @correo, @contrasena)
        `);
    return mapUsuario(result.recordset[0]);
};
exports.crearUsuario = crearUsuario;
const actualizarUsuario = async (idUsuario, fields) => {
    const updates = [];
    const pool = await (0, Database_1.getPool)();
    const request = pool.request().input("idUsuario", mssql_1.default.Int, idUsuario);
    if (fields.firstName) {
        updates.push("nombre = @nombre");
        request.input("nombre", mssql_1.default.VarChar(100), fields.firstName);
    }
    if (fields.lastName) {
        updates.push("apellido = @apellido");
        request.input("apellido", mssql_1.default.VarChar(100), fields.lastName);
    }
    if (fields.password) {
        updates.push("contrasena = @contrasena");
        request.input("contrasena", mssql_1.default.VarChar(255), fields.password);
    }
    if (updates.length === 0) {
        return;
    }
    await request.query(`
        UPDATE Usuario
        SET ${updates.join(", ")}
        WHERE idUsuario = @idUsuario
    `);
};
exports.actualizarUsuario = actualizarUsuario;
const asegurarAhorroUsuario = async (idUsuario) => {
    const pool = await (0, Database_1.getPool)();
    const check = await pool
        .request()
        .input("idUsuario", mssql_1.default.Int, idUsuario)
        .query(`
            SELECT TOP (1) idAhorro
            FROM SobreAhorro
            WHERE idUsuario = @idUsuario
        `);
    if (check.recordset.length > 0) {
        return;
    }
    const now = new Date();
    await pool
        .request()
        .input("idUsuario", mssql_1.default.Int, idUsuario)
        .input("porcentaje", mssql_1.default.Decimal(5, 2), 0)
        .input("fechaDesbloqueo", mssql_1.default.Date, now)
        .query(`
            INSERT INTO SobreAhorro (idUsuario, porcentaje, fechaDesbloqueo)
            VALUES (@idUsuario, @porcentaje, @fechaDesbloqueo)
        `);
};
exports.asegurarAhorroUsuario = asegurarAhorroUsuario;
const obtenerSobresUsuario = async (idUsuario, usuarioEmail, includeInactive = false) => {
    const pool = await (0, Database_1.getPool)();
    const sobresResult = await pool
        .request()
        .input("idUsuario", mssql_1.default.Int, idUsuario)
        .query(`
            SELECT idSobre, nombre, porcentaje, saldo, pagoAutomatico, frecuenciaPago, fechaProximoPago, activo
            FROM Sobres
            WHERE idUsuario = @idUsuario ${includeInactive ? "" : "AND activo = 1"}
        `);
    const ahorroResult = await pool
        .request()
        .input("idUsuario", mssql_1.default.Int, idUsuario)
        .query(`
            SELECT TOP (1) idAhorro, nombre, porcentaje, saldo, fechaInicio, fechaDesbloqueo, bloqueado
            FROM SobreAhorro
            WHERE idUsuario = @idUsuario
        `);
    const sobres = sobresResult.recordset.map(row => mapSobreNormal(row, usuarioEmail));
    const ahorro = ahorroResult.recordset.map(row => mapSobreAhorro(row, usuarioEmail));
    return [...ahorro, ...sobres];
};
exports.obtenerSobresUsuario = obtenerSobresUsuario;
const crearSobreUsuario = async (idUsuario, nombre, porcentaje, saldoInicial = 0) => {
    const pool = await (0, Database_1.getPool)();
    const automatico = isWaterOrLight(nombre);
    await pool
        .request()
        .input("idUsuario", mssql_1.default.Int, idUsuario)
        .input("nombre", mssql_1.default.VarChar(50), nombre)
        .input("porcentaje", mssql_1.default.Decimal(5, 2), porcentaje)
        .input("saldo", mssql_1.default.Decimal(12, 2), saldoInicial)
        .input("pagoAutomatico", mssql_1.default.Bit, automatico)
        .input("frecuenciaPago", mssql_1.default.VarChar(20), automatico ? "mensual" : null)
        .input("fechaProximoPago", mssql_1.default.Date, automatico ? firstDayNextMonth() : null)
        .query(`
            INSERT INTO Sobres (idUsuario, nombre, porcentaje, saldo, pagoAutomatico, frecuenciaPago, fechaProximoPago)
            VALUES (@idUsuario, @nombre, @porcentaje, @saldo, @pagoAutomatico, @frecuenciaPago, @fechaProximoPago)
        `);
};
exports.crearSobreUsuario = crearSobreUsuario;
const actualizarAhorroUsuario = async (idUsuario, porcentaje, tiempoBloqueoMeses) => {
    const fechaInicio = new Date();
    const fechaDesbloqueo = new Date(fechaInicio);
    fechaDesbloqueo.setMonth(fechaDesbloqueo.getMonth() + tiempoBloqueoMeses);
    const pool = await (0, Database_1.getPool)();
    await pool
        .request()
        .input("idUsuario", mssql_1.default.Int, idUsuario)
        .input("porcentaje", mssql_1.default.Decimal(5, 2), porcentaje)
        .input("fechaInicio", mssql_1.default.Date, fechaInicio)
        .input("fechaDesbloqueo", mssql_1.default.Date, fechaDesbloqueo)
        .input("bloqueado", mssql_1.default.Bit, true)
        .query(`
            UPDATE SobreAhorro
            SET porcentaje = @porcentaje,
                fechaInicio = @fechaInicio,
                fechaDesbloqueo = @fechaDesbloqueo,
                bloqueado = @bloqueado
            WHERE idUsuario = @idUsuario
        `);
};
exports.actualizarAhorroUsuario = actualizarAhorroUsuario;
const actualizarPorcentajeSobreUsuario = async (idUsuario, idSobre, porcentaje) => {
    const pool = await (0, Database_1.getPool)();
    await pool
        .request()
        .input("idUsuario", mssql_1.default.Int, idUsuario)
        .input("idSobre", mssql_1.default.Int, idSobre)
        .input("porcentaje", mssql_1.default.Decimal(5, 2), porcentaje)
        .query(`
            UPDATE Sobres
            SET porcentaje = @porcentaje
            WHERE idUsuario = @idUsuario AND idSobre = @idSobre
        `);
};
exports.actualizarPorcentajeSobreUsuario = actualizarPorcentajeSobreUsuario;
const actualizarSobreUsuario = async (idUsuario, idSobre, fields) => {
    const updates = [];
    const pool = await (0, Database_1.getPool)();
    const request = pool
        .request()
        .input("idUsuario", mssql_1.default.Int, idUsuario)
        .input("idSobre", mssql_1.default.Int, idSobre);
    if (fields.nombre) {
        const automatico = isWaterOrLight(fields.nombre);
        updates.push("nombre = @nombre");
        updates.push("pagoAutomatico = @pagoAutomatico");
        updates.push("frecuenciaPago = @frecuenciaPago");
        updates.push("fechaProximoPago = @fechaProximoPago");
        request.input("nombre", mssql_1.default.VarChar(50), fields.nombre);
        request.input("pagoAutomatico", mssql_1.default.Bit, automatico);
        request.input("frecuenciaPago", mssql_1.default.VarChar(20), automatico ? "mensual" : null);
        request.input("fechaProximoPago", mssql_1.default.Date, automatico ? firstDayNextMonth() : null);
    }
    if (fields.porcentaje != null) {
        updates.push("porcentaje = @porcentaje");
        request.input("porcentaje", mssql_1.default.Decimal(5, 2), fields.porcentaje);
    }
    if (updates.length === 0) {
        return;
    }
    await request.query(`
        UPDATE Sobres
        SET ${updates.join(", ")}
        WHERE idUsuario = @idUsuario AND idSobre = @idSobre
    `);
};
exports.actualizarSobreUsuario = actualizarSobreUsuario;
const desactivarSobreUsuario = async (idUsuario, idSobre) => {
    const pool = await (0, Database_1.getPool)();
    await pool
        .request()
        .input("idUsuario", mssql_1.default.Int, idUsuario)
        .input("idSobre", mssql_1.default.Int, idSobre)
        .query(`
            UPDATE Sobres
            SET activo = 0
            WHERE idUsuario = @idUsuario AND idSobre = @idSobre
        `);
};
exports.desactivarSobreUsuario = desactivarSobreUsuario;
const actualizarSaldoSobre = async (idSobre, nuevoSaldo) => {
    const pool = await (0, Database_1.getPool)();
    await pool
        .request()
        .input("idSobre", mssql_1.default.Int, idSobre)
        .input("saldo", mssql_1.default.Decimal(12, 2), nuevoSaldo)
        .query(`
            UPDATE Sobres
            SET saldo = @saldo
            WHERE idSobre = @idSobre
        `);
};
exports.actualizarSaldoSobre = actualizarSaldoSobre;
const actualizarSaldoAhorro = async (idAhorro, nuevoSaldo) => {
    const pool = await (0, Database_1.getPool)();
    await pool
        .request()
        .input("idAhorro", mssql_1.default.Int, idAhorro)
        .input("saldo", mssql_1.default.Decimal(12, 2), nuevoSaldo)
        .query(`
            UPDATE SobreAhorro
            SET saldo = @saldo
            WHERE idAhorro = @idAhorro
        `);
};
exports.actualizarSaldoAhorro = actualizarSaldoAhorro;
const registrarMovimiento = async (idUsuario, tipoMovimiento, monto, descripcion, idSobre, idAhorro) => {
    const pool = await (0, Database_1.getPool)();
    const result = await pool
        .request()
        .input("idUsuario", mssql_1.default.Int, idUsuario)
        .input("idSobre", mssql_1.default.Int, idSobre)
        .input("idAhorro", mssql_1.default.Int, idAhorro)
        .input("tipoMovimiento", mssql_1.default.VarChar(10), tipoMovimiento)
        .input("monto", mssql_1.default.Decimal(12, 2), monto)
        .input("descripcion", mssql_1.default.VarChar(200), descripcion)
        .query(`
            INSERT INTO Movimientos (idUsuario, idSobre, idAhorro, tipoMovimiento, monto, descripcion)
            OUTPUT INSERTED.idMovimiento, INSERTED.fechaMovimiento
            VALUES (@idUsuario, @idSobre, @idAhorro, @tipoMovimiento, @monto, @descripcion)
        `);
    return {
        idMovimiento: Number(result.recordset[0].idMovimiento),
        fechaMovimiento: new Date(result.recordset[0].fechaMovimiento)
    };
};
exports.registrarMovimiento = registrarMovimiento;
const obtenerMovimientosUsuario = async (idUsuario, tipoMovimiento) => {
    const pool = await (0, Database_1.getPool)();
    const request = pool.request().input("idUsuario", mssql_1.default.Int, idUsuario);
    let query = `
        SELECT idMovimiento, idSobre, idAhorro, tipoMovimiento, monto, descripcion, fechaMovimiento
        FROM Movimientos
        WHERE idUsuario = @idUsuario
    `;
    if (tipoMovimiento) {
        request.input("tipoMovimiento", mssql_1.default.VarChar(10), tipoMovimiento);
        query += " AND tipoMovimiento = @tipoMovimiento";
    }
    query += " ORDER BY fechaMovimiento DESC";
    const result = await request.query(query);
    return result.recordset;
};
exports.obtenerMovimientosUsuario = obtenerMovimientosUsuario;
