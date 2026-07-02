import { Request, Response } from "express";
import { sobres } from "../data/Sobres";
import { Sobre } from "../Models/Sobre";

// Obtener todos los sobres
export const obtenerSobres = (req: Request, res: Response): void => {
    res.json(sobres);
};

// Crear un nuevo sobre
export const crearSobre = (req: Request, res: Response): void => {

    const { nombre, porcentaje } = req.body;

    // Validar nombre repetido
    const existe = sobres.find(s =>
        s.nombre.toLowerCase() === nombre.toLowerCase()
    );

    if (existe) {
        res.status(400).json({
            mensaje: "Ya existe un sobre con ese nombre."
        });
        return;
    }

    // Obtener porcentaje del ahorro
    const ahorro = sobres.find(s => s.esAhorro);

    const porcentajeDisponible = 100 - (ahorro?.porcentaje ?? 0);

    // Sumar porcentajes actuales (sin ahorro)
    const suma = sobres
        .filter(s => !s.esAhorro)
        .reduce((total, s) => total + s.porcentaje, 0);

    if (suma + porcentaje > porcentajeDisponible) {
        res.status(400).json({
            mensaje: `Solo puedes repartir ${porcentajeDisponible}% entre los sobres.`
        });
        return;
    }

    const nuevoSobre: Sobre = {
        id: sobres.length + 1,
        nombre,
        porcentaje,
        saldo: 0,
        esAhorro: false,
        activo: true
    };

    sobres.push(nuevoSobre);

    res.status(201).json({
        mensaje: "Sobre creado correctamente.",
        sobre: nuevoSobre
    });

};

// Configurar porcentaje del ahorro
export const configurarAhorro = (req: Request, res: Response): void => {

    const { porcentaje } = req.body;

    const ahorro = sobres.find(s => s.esAhorro);

    if (!ahorro) {
        res.status(404).json({
            mensaje: "No existe el sobre de ahorro."
        });
        return;
    }

    if (ahorro.porcentaje > 0) {
        res.status(400).json({
            mensaje: "El porcentaje del ahorro ya fue configurado."
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

    res.json({
        mensaje: "Porcentaje de ahorro configurado.",
        ahorro
    });

};

// Actualizar porcentajes de TODOS los sobres
export const actualizarPorcentajes = (req: Request, res: Response): void => {

    const nuevosSobres = req.body;

    const ahorro = sobres.find(s => s.esAhorro);

    if (!ahorro) {
        res.status(404).json({
            mensaje: "No existe el ahorro."
        });
        return;
    }

    const porcentajeDisponible = 100 - ahorro.porcentaje;

    const suma = nuevosSobres.reduce(
        (total: number, s: Sobre) => total + s.porcentaje,
        0
    );

    if (suma !== porcentajeDisponible) {
        res.status(400).json({
            mensaje: `Los porcentajes deben sumar exactamente ${porcentajeDisponible}%.`
        });
        return;
    }

    nuevosSobres.forEach((nuevo: Sobre) => {

        const sobre = sobres.find(
            s => s.id === nuevo.id && !s.esAhorro
        );

        if (sobre) {
            sobre.nombre = nuevo.nombre;
            sobre.porcentaje = nuevo.porcentaje;
        }

    });

    res.json({
        mensaje: "Porcentajes actualizados correctamente."
    });

};

// Eliminar sobre
export const eliminarSobre = (req: Request, res: Response): void => {

    const id = Number(req.params.id);

    const index = sobres.findIndex(s => s.id === id);

    if (index === -1) {
        res.status(404).json({
            mensaje: "Sobre no encontrado."
        });
        return;
    }

    if (sobres[index].esAhorro) {
        res.status(400).json({
            mensaje: "No se puede eliminar el sobre de ahorro."
        });
        return;
    }

    sobres.splice(index, 1);

    res.json({
        mensaje: "Sobre eliminado correctamente."
    });

};