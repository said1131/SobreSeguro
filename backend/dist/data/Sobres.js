"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sobres = void 0;
const Sobre_1 = __importDefault(require("../Models/Sobre"));
exports.sobres = [
    // Sobres de Karlita Chi (usuario de prueba)
    new Sobre_1.default(1, // id
    "Ahorro", // nombre
    10, // porcentaje (configurado)
    0, // saldo
    true, // esAhorro
    true, // activo
    false, // esAutomatico
    0, // montoAutomatico
    "mensual", // frecuenciaAutomatica
    "karlitaChi@gmail.com" // usuarioEmail
    ),
    new Sobre_1.default(2, // id
    "Agua", // nombre - Cambié de "Luz" a "Agua"
    15, // porcentaje (configurado)
    0, // saldo
    false, // esAhorro
    true, // activo
    false, // esAutomatico
    0, // montoAutomatico
    "mensual", // frecuenciaAutomatica
    "karlitaChi@gmail.com" // usuarioEmail
    ),
    new Sobre_1.default(3, // id
    "Luz", // nombre - Agregué Luz
    15, // porcentaje (configurado)
    0, // saldo
    false, // esAhorro
    true, // activo
    false, // esAutomatico
    0, // montoAutomatico
    "mensual", // frecuenciaAutomatica
    "karlitaChi@gmail.com" // usuarioEmail
    ),
    new Sobre_1.default(4, // id
    "Mascotas", // nombre
    20, // porcentaje
    0, // saldo
    false, // esAhorro
    true, // activo
    false, // esAutomatico
    0, // montoAutomatico
    "mensual", // frecuenciaAutomatica
    "karlitaChi@gmail.com" // usuarioEmail
    ),
    new Sobre_1.default(5, // id
    "Entretenimiento", // nombre
    30, // porcentaje
    0, // saldo
    false, // esAhorro
    true, // activo
    false, // esAutomatico
    0, // montoAutomatico
    "mensual", // frecuenciaAutomatica
    "karlitaChi@gmail.com" // usuarioEmail
    ),
];
