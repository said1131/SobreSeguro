"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TEST_USER_PASSWORD = exports.TEST_USER_EMAIL = void 0;
exports.isTestUser = isTestUser;
// Configuración del usuario de prueba
exports.TEST_USER_EMAIL = "karlitaChi@gmail.com";
exports.TEST_USER_PASSWORD = "181107";
// Función para verificar si un usuario es de prueba
function isTestUser(email) {
    return email.toLowerCase() === exports.TEST_USER_EMAIL.toLowerCase();
}
