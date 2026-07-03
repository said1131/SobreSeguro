export default class Retiro {
    constructor(
        public id: number,
        public usuarioEmail: string,
        public sobreId: number,
        public monto: number,
        public fecha: Date = new Date(),
        public estado: string = "completado" // "completado", "pendiente"
    ) {}
}
