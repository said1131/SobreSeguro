"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Notificacion {
    constructor(id, usuarioId, tipo, // "saldo_insuficiente", "pago_automatico", "cambio_contrasena"
    mensaje, fecha = new Date(), leida = false) {
        this.id = id;
        this.usuarioId = usuarioId;
        this.tipo = tipo;
        this.mensaje = mensaje;
        this.fecha = fecha;
        this.leida = leida;
    }
}
exports.default = Notificacion;
