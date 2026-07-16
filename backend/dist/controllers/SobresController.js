"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.actualizarPorcentajeSobre = exports.eliminarSobre = exports.actualizarPorcentajesSobres = exports.configurarAhorro = exports.crearSobre = exports.obtenerSobres = void 0;
const Sobres_1 = require("../data/Sobres");
const Sobre_1 = __importDefault(require("../Models/Sobre"));
// Obtener sobres del usuario
const getSobresUsuario = (usuarioEmail) => {
    return Sobres_1.sobres.filter(s => s.usuarioEmail === usuarioEmail);
};
const esSobreResidual = (sobre) => {
    return sobre.nombre.toLowerCase() === 'residuo' && sobre.activo !== false;
};
// Validar que los porcentajes NO ahorro sumen correctamente (POR USUARIO)
const validarPorcentajesNoAhorro = (usuarioEmail, porcentajeNuevo = 0, excluirId) => {
    const sobresUsuario = getSobresUsuario(usuarioEmail);
    const ahorro = sobresUsuario.find(s => s.esAhorro);
    if (!ahorro)
        return false;
    const porcentajeDisponible = 100 - ahorro.porcentaje;
    const suma = sobresUsuario
        .filter(s => !s.esAhorro && s.id !== excluirId && s.activo && !esSobreResidual(s))
        .reduce((total, s) => total + s.porcentaje, 0);
    return suma + porcentajeNuevo <= porcentajeDisponible;
};
// Obtener todos los sobres del usuario
const obtenerSobres = (req, res) => {
    const usuarioEmail = req.headers["x-usuario-email"];
    if (!usuarioEmail) {
        res.status(400).json({
            mensaje: "Usuario no autenticado"
        });
        return;
    }
    const sobresUsuario = getSobresUsuario(usuarioEmail);
    res.json(sobresUsuario);
};
exports.obtenerSobres = obtenerSobres;
// Crear un nuevo sobre (no ahorro)
const crearSobre = (req, res) => {
    const usuarioEmail = req.headers["x-usuario-email"];
    const { nombre, porcentaje } = req.body;
    console.log(`[crearSobre] Email: ${usuarioEmail}, Nombre: ${nombre}, Porcentaje: ${porcentaje}`);
    if (!usuarioEmail) {
        res.status(400).json({
            mensaje: "Usuario no autenticado"
        });
        return;
    }
    if (!nombre || porcentaje == null) {
        res.status(400).json({
            mensaje: "Nombre y porcentaje son obligatorios."
        });
        return;
    }
    if (porcentaje <= 0) {
        res.status(400).json({
            mensaje: "El porcentaje debe ser mayor a 0."
        });
        return;
    }
    const sobresUsuario = getSobresUsuario(usuarioEmail);
    console.log(`[crearSobre] Sobres del usuario: ${sobresUsuario.length}`, sobresUsuario);
    const existe = sobresUsuario.find(s => s.nombre.toLowerCase() === nombre.toLowerCase());
    if (existe) {
        res.status(400).json({
            mensaje: "Ya existe un sobre con ese nombre."
        });
        return;
    }
    const ahorro = sobresUsuario.find(s => s.esAhorro);
    console.log(`[crearSobre] Sobre de ahorro:`, ahorro);
    if (!ahorro) {
        res.status(400).json({
            mensaje: "Debes configurar el ahorro primero."
        });
        return;
    }
    if (!validarPorcentajesNoAhorro(usuarioEmail, porcentaje)) {
        const porcentajeDisponible = 100 - (ahorro?.porcentaje ?? 0);
        const sumaActual = sobresUsuario
            .filter(s => !s.esAhorro && s.activo && !esSobreResidual(s))
            .reduce((total, s) => total + s.porcentaje, 0);
        res.status(400).json({
            mensaje: `Has excedido el límite. Disponible: ${porcentajeDisponible}% (Usado: ${sumaActual}%). Intenta agregar: ${porcentaje}%. Necesitas liberar ${sumaActual + porcentaje - porcentajeDisponible}% ajustando otros sobres.`,
            error: true,
            disponible: porcentajeDisponible,
            usado: sumaActual,
            intento: porcentaje
        });
        return;
    }
    const sobreResidual = Sobres_1.sobres.find(s => s.usuarioEmail === usuarioEmail && s.activo && esSobreResidual(s));
    const ultimoId = Sobres_1.sobres.length > 0 ? Math.max(...Sobres_1.sobres.map(s => s.id)) : 0;
    const nuevoSobre = new Sobre_1.default(ultimoId + 1, nombre, porcentaje, 0, false, true, false, 0, "mensual", usuarioEmail);
    Sobres_1.sobres.push(nuevoSobre);
    if (sobreResidual) {
        nuevoSobre.saldo = Number((nuevoSobre.saldo + sobreResidual.saldo).toFixed(2));
        sobreResidual.activo = false;
        sobreResidual.saldo = 0;
    }
    res.status(201).json({
        mensaje: "Sobre creado correctamente.",
        sobre: nuevoSobre
    });
};
exports.crearSobre = crearSobre;
// Configurar porcentaje del ahorro (SOLO UNA VEZ)
const configurarAhorro = (req, res) => {
    const usuarioEmail = req.headers["x-usuario-email"];
    const { porcentaje, tiempoBloqueoMeses } = req.body;
    if (!usuarioEmail) {
        res.status(400).json({
            mensaje: "Usuario no autenticado"
        });
        return;
    }
    if (!porcentaje || !tiempoBloqueoMeses) {
        res.status(400).json({
            mensaje: "Porcentaje y tiempo de bloqueo son obligatorios."
        });
        return;
    }
    if (tiempoBloqueoMeses <= 0 || tiempoBloqueoMeses > 60) {
        res.status(400).json({
            mensaje: "El tiempo de bloqueo debe estar entre 1 y 60 meses."
        });
        return;
    }
    const sobresUsuario = getSobresUsuario(usuarioEmail);
    const ahorro = sobresUsuario.find(s => s.esAhorro);
    if (!ahorro) {
        // Crear el sobre de ahorro si no existe
        const fechaBloqueo = new Date();
        fechaBloqueo.setMonth(fechaBloqueo.getMonth() + tiempoBloqueoMeses);
        const nuevoAhorro = new Sobre_1.default(Math.max(...Sobres_1.sobres.map(s => s.id), 0) + 1, "Ahorro", porcentaje, 0, true, true, false, 0, "mensual", usuarioEmail, fechaBloqueo, tiempoBloqueoMeses);
        Sobres_1.sobres.push(nuevoAhorro);
        res.json({
            mensaje: "Porcentaje de ahorro configurado con bloqueo de " + tiempoBloqueoMeses + " meses.",
            ahorro: nuevoAhorro,
            disponibleParaOtrosSobres: 100 - porcentaje
        });
        return;
    }
    if (ahorro.porcentaje > 0) {
        res.status(400).json({
            mensaje: "El porcentaje del ahorro ya fue configurado y no se puede cambiar."
        });
        return;
    }
    if (porcentaje <= 0 || porcentaje >= 100) {
        res.status(400).json({
            mensaje: "El porcentaje debe estar entre 1 y 99."
        });
        return;
    }
    ahorro.porcentaje = porcentaje;
    ahorro.tiempoBloqueoMeses = tiempoBloqueoMeses;
    const fechaBloqueo = new Date();
    fechaBloqueo.setMonth(fechaBloqueo.getMonth() + tiempoBloqueoMeses);
    ahorro.fechaBloqueo = fechaBloqueo;
    res.json({
        mensaje: "Porcentaje de ahorro configurado (no se puede cambiar después) con bloqueo de " + tiempoBloqueoMeses + " meses.",
        ahorro,
        disponibleParaOtrosSobres: 100 - porcentaje
    });
};
exports.configurarAhorro = configurarAhorro;
// Actualizar porcentajes de sobres NO ahorro
const actualizarPorcentajesSobres = (req, res) => {
    const usuarioEmail = req.headers["x-usuario-email"];
    const nuevosSobres = req.body;
    if (!usuarioEmail) {
        res.status(400).json({
            mensaje: "Usuario no autenticado"
        });
        return;
    }
    const sobresUsuario = getSobresUsuario(usuarioEmail);
    const ahorro = sobresUsuario.find(s => s.esAhorro);
    if (!ahorro || ahorro.porcentaje === 0) {
        res.status(400).json({
            mensaje: "El ahorro no está configurado."
        });
        return;
    }
    const porcentajeDisponible = 100 - ahorro.porcentaje;
    // Calcular suma de nuevos porcentajes
    const suma = nuevosSobres.reduce((total, s) => total + s.porcentaje, 0);
    if (suma !== porcentajeDisponible) {
        res.status(400).json({
            mensaje: `Los porcentajes deben sumar exactamente ${porcentajeDisponible}%.`,
            sumaActual: suma,
            esperada: porcentajeDisponible
        });
        return;
    }
    // Actualizar porcentajes
    nuevosSobres.forEach(nuevo => {
        const sobre = sobresUsuario.find(s => s.id === nuevo.id && !s.esAhorro);
        if (sobre) {
            sobre.porcentaje = nuevo.porcentaje;
        }
    });
    res.json({
        mensaje: "Porcentajes actualizados correctamente.",
        sobres: sobresUsuario.filter(s => !s.esAhorro)
    });
};
exports.actualizarPorcentajesSobres = actualizarPorcentajesSobres;
// Eliminar sobre (no se puede eliminar ahorro)
const eliminarSobre = (req, res) => {
    const usuarioEmail = req.headers["x-usuario-email"];
    const id = Number(req.params.id);
    if (!usuarioEmail) {
        res.status(400).json({
            mensaje: "Usuario no autenticado"
        });
        return;
    }
    const index = Sobres_1.sobres.findIndex(s => s.id === id && s.usuarioEmail === usuarioEmail);
    if (index === -1) {
        res.status(404).json({
            mensaje: "Sobre no encontrado."
        });
        return;
    }
    if (Sobres_1.sobres[index].esAhorro) {
        res.status(400).json({
            mensaje: "No se puede eliminar el sobre de ahorro."
        });
        return;
    }
    if (Sobres_1.sobres[index].saldo > 0) {
        res.status(400).json({
            mensaje: "No puedes eliminar un sobre que todavía tiene saldo."
        });
        return;
    }
    const nombreEliminado = Sobres_1.sobres[index].nombre;
    Sobres_1.sobres[index].activo = false;
    res.json({
        mensaje: `Sobre '${nombreEliminado}' desactivado correctamente.`
    });
};
exports.eliminarSobre = eliminarSobre;
// Actualizar porcentaje de un sobre individual
const actualizarPorcentajeSobre = (req, res) => {
    const usuarioEmail = req.headers["x-usuario-email"];
    const id = Number(req.params.id);
    const { porcentaje } = req.body;
    if (!usuarioEmail) {
        res.status(400).json({
            mensaje: "Usuario no autenticado"
        });
        return;
    }
    if (porcentaje == null || porcentaje < 0) {
        res.status(400).json({
            mensaje: "Porcentaje inválido"
        });
        return;
    }
    const sobresUsuario = getSobresUsuario(usuarioEmail);
    const sobre = sobresUsuario.find(s => s.id === id);
    if (!sobre) {
        res.status(404).json({
            mensaje: "Sobre no encontrado."
        });
        return;
    }
    if (sobre.esAhorro) {
        res.status(400).json({
            mensaje: "No se puede cambiar el porcentaje del ahorro."
        });
        return;
    }
    const porcentajeAnterior = sobre.porcentaje;
    const diferencia = porcentaje - porcentajeAnterior;
    // Validar que la suma de porcentajes (excluido este) más el nuevo no exceda lo disponible
    const ahorro = sobresUsuario.find(s => s.esAhorro);
    const porcentajeDisponible = 100 - (ahorro?.porcentaje ?? 0);
    const sumaOtros = sobresUsuario
        .filter(s => !s.esAhorro && s.id !== id && s.activo)
        .reduce((total, s) => total + s.porcentaje, 0);
    if (sumaOtros + porcentaje > porcentajeDisponible) {
        res.status(400).json({
            mensaje: `Has excedido el límite. Disponible: ${porcentajeDisponible}%. Otros sobres usan: ${sumaOtros}%. Intentas usar: ${porcentaje}%. Total: ${sumaOtros + porcentaje}%.`
        });
        return;
    }
    sobre.porcentaje = porcentaje;
    res.json({
        mensaje: `Porcentaje de '${sobre.nombre}' actualizado de ${porcentajeAnterior}% a ${porcentaje}%.`,
        sobre
    });
};
exports.actualizarPorcentajeSobre = actualizarPorcentajeSobre;
