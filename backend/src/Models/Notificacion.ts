export default class Notificacion {
    constructor(
        public id: number,
        public usuarioId: number,
        public tipo: string, // "saldo_insuficiente", "pago_automatico", "cambio_contrasena"
        public mensaje: string,
        public fecha: Date = new Date(),
        public leida: boolean = false
    ) {}
}
