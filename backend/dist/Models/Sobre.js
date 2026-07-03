"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Sobre {
    constructor(id, nombre, porcentaje, saldo = 0, esAhorro = false, activo = true, esAutomatico = false, montoAutomatico = 0, frecuenciaAutomatica = "mensual", // "semanal", "mensual", "personalizado"
    usuarioEmail = "", fechaBloqueo = null, // Fecha hasta la cual está bloqueado (solo para ahorro)
    tiempoBloqueoMeses = 0 // Cantidad de meses de bloqueo (solo para ahorro)
    ) {
        this.id = id;
        this.nombre = nombre;
        this.porcentaje = porcentaje;
        this.saldo = saldo;
        this.esAhorro = esAhorro;
        this.activo = activo;
        this.esAutomatico = esAutomatico;
        this.montoAutomatico = montoAutomatico;
        this.frecuenciaAutomatica = frecuenciaAutomatica;
        this.usuarioEmail = usuarioEmail;
        this.fechaBloqueo = fechaBloqueo;
        this.tiempoBloqueoMeses = tiempoBloqueoMeses;
    }
}
exports.default = Sobre;
