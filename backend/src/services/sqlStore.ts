import sql from "mssql";
import { getPool } from "../config/Database";

export interface UsuarioDTO {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}

export interface SobreDTO {
    id: number;
    nombre: string;
    porcentaje: number;
    saldo: number;
    esAhorro: boolean;
    activo: boolean;
    esAutomatico: boolean;
    montoAutomatico: number;
    frecuenciaAutomatica: string;
    usuarioEmail: string;
    fechaBloqueo: Date | null;
    tiempoBloqueoMeses: number;
    fechaProximoPago: Date | null;
}

interface SobreNormalRow {
    idSobre: number;
    nombre: string;
    porcentaje: number;
    saldo: number;
    pagoAutomatico: boolean;
    frecuenciaPago: string | null;
    fechaProximoPago: Date | null;
    activo: boolean;
}

interface SobreAhorroRow {
    idAhorro: number;
    nombre: string;
    porcentaje: number;
    saldo: number;
    fechaInicio: Date;
    fechaDesbloqueo: Date;
    bloqueado: boolean;
}

const toNumber = (value: unknown): number => Number(value ?? 0);

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const isWaterOrLight = (nombre: string): boolean => {
    const n = nombre.trim().toLowerCase();
    return n === "agua" || n === "luz";
};

const firstDayNextMonth = (): Date => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 1);
};

const monthDiff = (from: Date, to: Date): number => {
    const years = to.getFullYear() - from.getFullYear();
    const months = to.getMonth() - from.getMonth();
    return Math.max(0, years * 12 + months);
};

const mapUsuario = (row: Record<string, unknown>): UsuarioDTO => ({
    id: Number(row.idUsuario),
    firstName: String(row.nombre ?? ""),
    lastName: String(row.apellido ?? ""),
    email: String(row.correo ?? ""),
    password: String(row.contrasena ?? "")
});

const mapSobreNormal = (row: SobreNormalRow, usuarioEmail: string): SobreDTO => {
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

const mapSobreAhorro = (row: SobreAhorroRow, usuarioEmail: string): SobreDTO => ({
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

export const obtenerUsuarioPorEmail = async (email: string): Promise<UsuarioDTO | null> => {
    const pool = await getPool();
    const result = await pool
        .request()
        .input("correo", sql.VarChar(100), normalizeEmail(email))
        .query(`
            SELECT TOP (1) *
            FROM Usuario
            WHERE LOWER(correo) = LOWER(@correo) AND activo = 1
        `);

    if (result.recordset.length === 0) {
        return null;
    }

    return mapUsuario(result.recordset[0] as Record<string, unknown>);
};

export const obtenerUsuarioPorId = async (idUsuario: number): Promise<UsuarioDTO | null> => {
    const pool = await getPool();
    const result = await pool
        .request()
        .input("idUsuario", sql.Int, idUsuario)
        .query(`
            SELECT TOP (1) *
            FROM Usuario
            WHERE idUsuario = @idUsuario AND activo = 1
        `);

    if (result.recordset.length === 0) {
        return null;
    }

    return mapUsuario(result.recordset[0] as Record<string, unknown>);
};

export const crearUsuario = async (
    firstName: string,
    lastName: string,
    email: string,
    password: string
): Promise<UsuarioDTO> => {
    const pool = await getPool();
    const result = await pool
        .request()
        .input("nombre", sql.VarChar(100), firstName)
        .input("apellido", sql.VarChar(100), lastName)
        .input("correo", sql.VarChar(100), normalizeEmail(email))
        .input("contrasena", sql.VarChar(255), password)
        .query(`
            INSERT INTO Usuario (nombre, apellido, correo, contrasena)
            OUTPUT INSERTED.*
            VALUES (@nombre, @apellido, @correo, @contrasena)
        `);

    return mapUsuario(result.recordset[0] as Record<string, unknown>);
};

export const actualizarUsuario = async (
    idUsuario: number,
    fields: { firstName?: string; lastName?: string; password?: string }
): Promise<void> => {
    const updates: string[] = [];
    const pool = await getPool();
    const request = pool.request().input("idUsuario", sql.Int, idUsuario);

    if (fields.firstName) {
        updates.push("nombre = @nombre");
        request.input("nombre", sql.VarChar(100), fields.firstName);
    }

    if (fields.lastName) {
        updates.push("apellido = @apellido");
        request.input("apellido", sql.VarChar(100), fields.lastName);
    }

    if (fields.password) {
        updates.push("contrasena = @contrasena");
        request.input("contrasena", sql.VarChar(255), fields.password);
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

export const asegurarAhorroUsuario = async (idUsuario: number): Promise<void> => {
    const pool = await getPool();
    const check = await pool
        .request()
        .input("idUsuario", sql.Int, idUsuario)
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
        .input("idUsuario", sql.Int, idUsuario)
        .input("porcentaje", sql.Decimal(5, 2), 0)
        .input("fechaDesbloqueo", sql.Date, now)
        .query(`
            INSERT INTO SobreAhorro (idUsuario, porcentaje, fechaDesbloqueo)
            VALUES (@idUsuario, @porcentaje, @fechaDesbloqueo)
        `);
};

export const obtenerSobresUsuario = async (
    idUsuario: number,
    usuarioEmail: string,
    includeInactive = false
): Promise<SobreDTO[]> => {
    const pool = await getPool();

    const sobresResult = await pool
        .request()
        .input("idUsuario", sql.Int, idUsuario)
        .query(`
            SELECT idSobre, nombre, porcentaje, saldo, pagoAutomatico, frecuenciaPago, fechaProximoPago, activo
            FROM Sobres
            WHERE idUsuario = @idUsuario ${includeInactive ? "" : "AND activo = 1"}
        `);

    const ahorroResult = await pool
        .request()
        .input("idUsuario", sql.Int, idUsuario)
        .query(`
            SELECT TOP (1) idAhorro, nombre, porcentaje, saldo, fechaInicio, fechaDesbloqueo, bloqueado
            FROM SobreAhorro
            WHERE idUsuario = @idUsuario
        `);

    const sobres = (sobresResult.recordset as SobreNormalRow[]).map(row => mapSobreNormal(row, usuarioEmail));
    const ahorro = (ahorroResult.recordset as SobreAhorroRow[]).map(row => mapSobreAhorro(row, usuarioEmail));

    return [...ahorro, ...sobres];
};

export const crearSobreUsuario = async (
    idUsuario: number,
    nombre: string,
    porcentaje: number,
    saldoInicial = 0
): Promise<void> => {
    const pool = await getPool();
    const automatico = isWaterOrLight(nombre);

    await pool
        .request()
        .input("idUsuario", sql.Int, idUsuario)
        .input("nombre", sql.VarChar(50), nombre)
        .input("porcentaje", sql.Decimal(5, 2), porcentaje)
        .input("saldo", sql.Decimal(12, 2), saldoInicial)
        .input("pagoAutomatico", sql.Bit, automatico)
        .input("frecuenciaPago", sql.VarChar(20), automatico ? "mensual" : null)
        .input("fechaProximoPago", sql.Date, automatico ? firstDayNextMonth() : null)
        .query(`
            INSERT INTO Sobres (idUsuario, nombre, porcentaje, saldo, pagoAutomatico, frecuenciaPago, fechaProximoPago)
            VALUES (@idUsuario, @nombre, @porcentaje, @saldo, @pagoAutomatico, @frecuenciaPago, @fechaProximoPago)
        `);
};

export const actualizarAhorroUsuario = async (
    idUsuario: number,
    porcentaje: number,
    tiempoBloqueoMeses: number
): Promise<void> => {
    const fechaInicio = new Date();
    const fechaDesbloqueo = new Date(fechaInicio);
    fechaDesbloqueo.setMonth(fechaDesbloqueo.getMonth() + tiempoBloqueoMeses);

    const pool = await getPool();
    await pool
        .request()
        .input("idUsuario", sql.Int, idUsuario)
        .input("porcentaje", sql.Decimal(5, 2), porcentaje)
        .input("fechaInicio", sql.Date, fechaInicio)
        .input("fechaDesbloqueo", sql.Date, fechaDesbloqueo)
        .input("bloqueado", sql.Bit, true)
        .query(`
            UPDATE SobreAhorro
            SET porcentaje = @porcentaje,
                fechaInicio = @fechaInicio,
                fechaDesbloqueo = @fechaDesbloqueo,
                bloqueado = @bloqueado
            WHERE idUsuario = @idUsuario
        `);
};

export const actualizarPorcentajeSobreUsuario = async (idUsuario: number, idSobre: number, porcentaje: number): Promise<void> => {
    const pool = await getPool();
    await pool
        .request()
        .input("idUsuario", sql.Int, idUsuario)
        .input("idSobre", sql.Int, idSobre)
        .input("porcentaje", sql.Decimal(5, 2), porcentaje)
        .query(`
            UPDATE Sobres
            SET porcentaje = @porcentaje
            WHERE idUsuario = @idUsuario AND idSobre = @idSobre
        `);
};

export const actualizarSobreUsuario = async (
    idUsuario: number,
    idSobre: number,
    fields: { nombre?: string; porcentaje?: number }
): Promise<void> => {
    const updates: string[] = [];
    const pool = await getPool();
    const request = pool
        .request()
        .input("idUsuario", sql.Int, idUsuario)
        .input("idSobre", sql.Int, idSobre);

    if (fields.nombre) {
        const automatico = isWaterOrLight(fields.nombre);
        updates.push("nombre = @nombre");
        updates.push("pagoAutomatico = @pagoAutomatico");
        updates.push("frecuenciaPago = @frecuenciaPago");
        updates.push("fechaProximoPago = @fechaProximoPago");

        request.input("nombre", sql.VarChar(50), fields.nombre);
        request.input("pagoAutomatico", sql.Bit, automatico);
        request.input("frecuenciaPago", sql.VarChar(20), automatico ? "mensual" : null);
        request.input("fechaProximoPago", sql.Date, automatico ? firstDayNextMonth() : null);
    }

    if (fields.porcentaje != null) {
        updates.push("porcentaje = @porcentaje");
        request.input("porcentaje", sql.Decimal(5, 2), fields.porcentaje);
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

export const desactivarSobreUsuario = async (idUsuario: number, idSobre: number): Promise<void> => {
    const pool = await getPool();
    await pool
        .request()
        .input("idUsuario", sql.Int, idUsuario)
        .input("idSobre", sql.Int, idSobre)
        .query(`
            UPDATE Sobres
            SET activo = 0
            WHERE idUsuario = @idUsuario AND idSobre = @idSobre
        `);
};

export const actualizarSaldoSobre = async (idSobre: number, nuevoSaldo: number): Promise<void> => {
    const pool = await getPool();
    await pool
        .request()
        .input("idSobre", sql.Int, idSobre)
        .input("saldo", sql.Decimal(12, 2), nuevoSaldo)
        .query(`
            UPDATE Sobres
            SET saldo = @saldo
            WHERE idSobre = @idSobre
        `);
};

export const actualizarSaldoAhorro = async (idAhorro: number, nuevoSaldo: number): Promise<void> => {
    const pool = await getPool();
    await pool
        .request()
        .input("idAhorro", sql.Int, idAhorro)
        .input("saldo", sql.Decimal(12, 2), nuevoSaldo)
        .query(`
            UPDATE SobreAhorro
            SET saldo = @saldo
            WHERE idAhorro = @idAhorro
        `);
};

export const registrarMovimiento = async (
    idUsuario: number,
    tipoMovimiento: "Ingreso" | "Retiro",
    monto: number,
    descripcion: string,
    idSobre: number | null,
    idAhorro: number | null
): Promise<{ idMovimiento: number; fechaMovimiento: Date }> => {
    const pool = await getPool();
    const result = await pool
        .request()
        .input("idUsuario", sql.Int, idUsuario)
        .input("idSobre", sql.Int, idSobre)
        .input("idAhorro", sql.Int, idAhorro)
        .input("tipoMovimiento", sql.VarChar(10), tipoMovimiento)
        .input("monto", sql.Decimal(12, 2), monto)
        .input("descripcion", sql.VarChar(200), descripcion)
        .query(`
            INSERT INTO Movimientos (idUsuario, idSobre, idAhorro, tipoMovimiento, monto, descripcion)
            OUTPUT INSERTED.idMovimiento, INSERTED.fechaMovimiento
            VALUES (@idUsuario, @idSobre, @idAhorro, @tipoMovimiento, @monto, @descripcion)
        `);

    return {
        idMovimiento: Number(result.recordset[0].idMovimiento),
        fechaMovimiento: new Date(result.recordset[0].fechaMovimiento as Date)
    };
};

export const obtenerMovimientosUsuario = async (
    idUsuario: number,
    tipoMovimiento?: "Ingreso" | "Retiro"
): Promise<Array<Record<string, unknown>>> => {
    const pool = await getPool();
    const request = pool.request().input("idUsuario", sql.Int, idUsuario);

    let query = `
        SELECT idMovimiento, idSobre, idAhorro, tipoMovimiento, monto, descripcion, fechaMovimiento
        FROM Movimientos
        WHERE idUsuario = @idUsuario
    `;

    if (tipoMovimiento) {
        request.input("tipoMovimiento", sql.VarChar(10), tipoMovimiento);
        query += " AND tipoMovimiento = @tipoMovimiento";
    }

    query += " ORDER BY fechaMovimiento DESC";
    const result = await request.query(query);

    return result.recordset as Array<Record<string, unknown>>;
};