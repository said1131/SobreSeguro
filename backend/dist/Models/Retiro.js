"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Retiro {
    constructor(id, usuarioEmail, sobreId, monto, fecha = new Date(), estado = "completado" // "completado", "pendiente"
    ) {
        this.id = id;
        this.usuarioEmail = usuarioEmail;
        this.sobreId = sobreId;
        this.monto = monto;
        this.fecha = fecha;
        this.estado = estado;
    }
}
exports.default = Retiro;
