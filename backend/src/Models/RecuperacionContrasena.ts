export default class RecuperacionContrasena {
    constructor(
        public id: number,
        public usuarioId: number,
        public email: string,
        public codigo: string,
        public fechaExpiracion: Date = new Date(Date.now() + 15 * 60 * 1000), // 15 minutos
        public utilizado: boolean = false
    ) {}
}
