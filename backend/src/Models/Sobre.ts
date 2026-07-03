export default class Sobre {

    constructor(
        public id: number,
        public nombre: string,
        public porcentaje: number,
        public saldo: number = 0,
        public esAhorro: boolean = false,
        public activo: boolean = true,
        public esAutomatico: boolean = false,
        public montoAutomatico: number = 0,
        public frecuenciaAutomatica: string = "mensual", // "semanal", "mensual", "personalizado"
        public usuarioEmail: string = "",
        public fechaBloqueo: Date | null = null, // Fecha hasta la cual está bloqueado (solo para ahorro)
        public tiempoBloqueoMeses: number = 0 // Cantidad de meses de bloqueo (solo para ahorro)
    ) {}

}