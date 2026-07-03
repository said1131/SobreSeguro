"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Ingreso {
    constructor(monto = 0, usuarioEmail = "", fecha = new Date()) {
        this.monto = monto;
        this.usuarioEmail = usuarioEmail;
        this.fecha = fecha;
    }
}
exports.default = Ingreso;
