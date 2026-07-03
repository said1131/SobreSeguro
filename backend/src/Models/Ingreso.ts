export default class Ingreso {

    constructor(
        public monto: number = 0,
        public usuarioEmail: string = "",
        public fecha: Date = new Date()
    ) {}

}