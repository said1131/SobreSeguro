"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class RecuperacionContrasena {
    constructor(id, usuarioId, email, codigo, fechaExpiracion = new Date(Date.now() + 15 * 60 * 1000), // 15 minutos
    utilizado = false) {
        this.id = id;
        this.usuarioId = usuarioId;
        this.email = email;
        this.codigo = codigo;
        this.fechaExpiracion = fechaExpiracion;
        this.utilizado = utilizado;
    }
}
exports.default = RecuperacionContrasena;
