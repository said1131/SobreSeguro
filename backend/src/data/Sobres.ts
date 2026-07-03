import Sobre from "../Models/Sobre";

export const sobres: Sobre[] = [
    // Sobres de Karlita Chi (usuario de prueba)
    new Sobre(
        1,          // id
        "Ahorro",   // nombre
        10,         // porcentaje (configurado)
        0,          // saldo
        true,       // esAhorro
        true,       // activo
        false,      // esAutomatico
        0,          // montoAutomatico
        "mensual",  // frecuenciaAutomatica
        "karlitaChi@gmail.com"  // usuarioEmail
    ),
    new Sobre(
        2,          // id
        "Agua",     // nombre - Cambié de "Luz" a "Agua"
        15,         // porcentaje (configurado)
        0,          // saldo
        false,      // esAhorro
        true,       // activo
        false,      // esAutomatico
        0,          // montoAutomatico
        "mensual",  // frecuenciaAutomatica
        "karlitaChi@gmail.com"  // usuarioEmail
    ),
    new Sobre(
        3,          // id
        "Luz",      // nombre - Agregué Luz
        15,         // porcentaje (configurado)
        0,          // saldo
        false,      // esAhorro
        true,       // activo
        false,      // esAutomatico
        0,          // montoAutomatico
        "mensual",  // frecuenciaAutomatica
        "karlitaChi@gmail.com"  // usuarioEmail
    ),
    new Sobre(
        4,          // id
        "Mascotas", // nombre
        20,         // porcentaje
        0,          // saldo
        false,      // esAhorro
        true,       // activo
        false,      // esAutomatico
        0,          // montoAutomatico
        "mensual",  // frecuenciaAutomatica
        "karlitaChi@gmail.com"  // usuarioEmail
    ),
    new Sobre(
        5,          // id
        "Entretenimiento", // nombre
        30,         // porcentaje
        0,          // saldo
        false,      // esAhorro
        true,       // activo
        false,      // esAutomatico
        0,          // montoAutomatico
        "mensual",  // frecuenciaAutomatica
        "karlitaChi@gmail.com"  // usuarioEmail
    ),
];