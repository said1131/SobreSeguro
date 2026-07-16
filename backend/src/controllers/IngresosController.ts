import { Request, Response } from "express";
import { ingresos } from "../data/Ingreso";
import { retiros } from "../data/Retiro";
import { sobres } from "../data/Sobres";
import { notificaciones } from "../data/Notificacion";
import Notificacion from "../Models/Notificacion";
import Ingreso from "../Models/Ingreso";
import Sobre from "../Models/Sobre";

// Obtener ingresos del usuario
export const obtenerIngreso = (req: Request, res: Response): void => {
    const usuarioEmail = req.headers["x-usuario-email"] as string;

    if (!usuarioEmail) {
        res.status(400).json({
            mensaje: "Usuario no autenticado"
        });
        return;
    }

    const ingresosUsuario = ingresos.filter(i => i.usuarioEmail === usuarioEmail);
    const totalMonto = ingresosUsuario.reduce((sum, i) => sum + i.monto, 0);

    res.json({
        monto: totalMonto,
        historial: ingresosUsuario
    });
};

// Actualizar ingreso y distribuir automáticamente
export const actualizarIngreso = (req: Request, res: Response): void => {
    const usuarioEmail = req.headers["x-usuario-email"] as string;
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

    const sobresUsuario = sobres.filter(s => s.usuarioEmail === usuarioEmail);
    const ahorro = sobresUsuario.find(s => s.esAhorro);

    if (!ahorro || ahorro.porcentaje === 0) {
        res.status(400).json({
            mensaje: "Debes configurar el ahorro primero."
        });
        return;
    }

    const nuevoIngreso = new Ingreso(monto, usuarioEmail, new Date());
    ingresos.push(nuevoIngreso);

    const montoAlAhorro = Number(((monto * ahorro.porcentaje) / 100).toFixed(2));
    ahorro.saldo = Number((ahorro.saldo + montoAlAhorro).toFixed(2));

    const sobresActivos = sobresUsuario.filter(s => !s.esAhorro && s.activo);
    const porcentajeTotal = sobresActivos.reduce((sum, sobre) => sum + sobre.porcentaje, 0);
    const porcentajeRestante = Math.max(0, 100 - ahorro.porcentaje - porcentajeTotal);

    let montoResidual = 0;
    if (porcentajeRestante > 0) {
        montoResidual = Number(((monto * porcentajeRestante) / 100).toFixed(2));
    }

    sobresActivos.forEach(sobre => {
        const montoSobre = Number(((monto * sobre.porcentaje) / 100).toFixed(2));
        sobre.saldo = Number((sobre.saldo + montoSobre).toFixed(2));
    });

    const sobreResidual = sobresUsuario.find(s => s.nombre.toLowerCase() === 'residuo' && s.activo);
    if (sobreResidual) {
        sobreResidual.saldo = Number((sobreResidual.saldo + montoResidual).toFixed(2));
    } else if (montoResidual > 0) {
        const nuevoId = sobres.length > 0 ? Math.max(...sobres.map(s => s.id)) + 1 : 1;
        sobres.push(new Sobre(
            nuevoId,
            'Residuo',
            porcentajeRestante,
            montoResidual,
            false,
            true,
            false,
            0,
            'mensual',
            usuarioEmail
        ));
    }

    // Crear notificaciones para pagos automáticos si hay saldo insuficiente
    sobresUsuario.forEach(sobre => {
        if (sobre.esAutomatico && sobre.saldo < sobre.montoAutomatico) {
            const notifId = notificaciones.length > 0 
                ? Math.max(...notificaciones.map(n => n.id)) + 1 
                : 1;

            const notif = new Notificacion(
                notifId,
                1, // usuarioId por defecto
                "saldo_insuficiente",
                `Advertencia: Saldo bajo en '${sobre.nombre}'. Se requieren $${sobre.montoAutomatico} pero tienes $${sobre.saldo}.`
            );

            notificaciones.push(notif);
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
            porcentajeAhorro: ahorro.porcentaje,
            montoResidual,
            porcentajeResidual: porcentajeRestante
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

// Obtener historial completo (ingresos + retiros)
export const obtenerHistorialCompleto = (req: Request, res: Response): void => {
    const usuarioEmail = req.headers["x-usuario-email"] as string;

    if (!usuarioEmail) {
        res.status(400).json({
            mensaje: "Usuario no autenticado"
        });
        return;
    }

    // Obtener ingresos del usuario
    const ingresosUsuario = ingresos.filter(i => i.usuarioEmail === usuarioEmail);
    const movimientosIngresos = ingresosUsuario.map(ingreso => ({
        id: `ingreso-${ingreso.usuarioEmail}-${ingreso.fecha}`,
        tipo: 'ingreso',
        fecha: ingreso.fecha,
        concepto: 'Ingreso general',
        monto: ingreso.monto,
        sobreAsociado: 'Distribución'
    }));

    // Obtener retiros del usuario
    const retirosUsuario = retiros.filter(r => r.usuarioEmail === usuarioEmail);
    const movimientosRetiros = retirosUsuario.map(retiro => ({
        id: `retiro-${retiro.id}`,
        tipo: 'retiro',
        fecha: retiro.fecha,
        concepto: `Retiro de ${sobres.find(s => s.id === retiro.sobreId)?.nombre || 'Sobre'}`,
        monto: -retiro.monto, // Negativo para retiros
        sobreAsociado: sobres.find(s => s.id === retiro.sobreId)?.nombre || 'Desconocido'
    }));

    // Combinar y ordenar por fecha (más reciente primero)
    const historialCompleto = [...movimientosIngresos, ...movimientosRetiros]
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    res.json({
        historial: historialCompleto
    });
};

