"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.cambiarContraseña = exports.solicitarRecuperacion = exports.actualizarPerfil = exports.obtenerPerfil = exports.login = exports.registrar = void 0;
const RecuperacionContrasena_1 = require("../data/RecuperacionContrasena");
const Notificacion_1 = require("../data/Notificacion");
const RecuperacionContrasena_2 = __importDefault(require("../Models/RecuperacionContrasena"));
const Notificacion_2 = __importDefault(require("../Models/Notificacion"));
const sqlStore_1 = require("../services/sqlStore");
// Función auxiliar para generar código de 6 dígitos
const generarCodigoRecuperacion = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};
// Registrar nuevo usuario
const registrar = async (req, res) => {
    const { firstName, lastName, email, password, confirmPassword } = req.body;
    // Validaciones
    if (!firstName || !lastName || !email || !password) {
        res.status(400).json({
            mensaje: "Todos los campos son obligatorios."
        });
        return;
    }
    if (password !== confirmPassword) {
        res.status(400).json({
            mensaje: "Las contraseñas no coinciden."
        });
        return;
    }
    if (password.length < 6) {
        res.status(400).json({
            mensaje: "La contraseña debe tener al menos 6 caracteres."
        });
        return;
    }
    try {
        const usuarioExistente = await (0, sqlStore_1.obtenerUsuarioPorEmail)(email);
        if (usuarioExistente) {
            res.status(400).json({
                mensaje: "El email ya está registrado."
            });
            return;
        }
        const nuevoUsuario = await (0, sqlStore_1.crearUsuario)(firstName, lastName, email, password);
        await (0, sqlStore_1.asegurarAhorroUsuario)(nuevoUsuario.id);
        res.status(201).json({
            mensaje: "Usuario registrado correctamente.",
            usuario: {
                id: nuevoUsuario.id,
                firstName: nuevoUsuario.firstName,
                lastName: nuevoUsuario.lastName,
                email: nuevoUsuario.email
            }
        });
    }
    catch (error) {
        console.error("Error al registrar usuario:", error);
        res.status(500).json({
            mensaje: "Error interno al registrar usuario."
        });
    }
};
exports.registrar = registrar;
// Login
const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400).json({
            mensaje: "Email y contraseña son obligatorios."
        });
        return;
    }
    try {
        const usuario = await (0, sqlStore_1.obtenerUsuarioPorEmail)(email);
        if (!usuario) {
            res.status(401).json({
                mensaje: "Usuario no registrado"
            });
            return;
        }
        if (usuario.password !== password) {
            res.status(401).json({
                mensaje: "Contrasena incorrecta."
            });
            return;
        }
        res.json({
            mensaje: "Login exitoso.",
            usuario: {
                id: usuario.id,
                firstName: usuario.firstName,
                lastName: usuario.lastName,
                email: usuario.email
            }
        });
    }
    catch (error) {
        console.error("Error en login:", error);
        res.status(500).json({
            mensaje: "Error interno al iniciar sesión."
        });
    }
};
exports.login = login;
// Obtener perfil
const obtenerPerfil = async (req, res) => {
    const usuarioId = Number(req.params.id);
    try {
        const usuario = await (0, sqlStore_1.obtenerUsuarioPorId)(usuarioId);
        if (!usuario) {
            res.status(404).json({
                mensaje: "Usuario no encontrado."
            });
            return;
        }
        res.json({
            id: usuario.id,
            firstName: usuario.firstName,
            lastName: usuario.lastName,
            email: usuario.email
        });
    }
    catch (error) {
        console.error("Error al obtener perfil:", error);
        res.status(500).json({
            mensaje: "Error interno al obtener perfil."
        });
    }
};
exports.obtenerPerfil = obtenerPerfil;
// Actualizar perfil
const actualizarPerfil = async (req, res) => {
    const usuarioEmail = req.headers["x-usuario-email"]?.toLowerCase();
    const { firstName, lastName, password } = req.body;
    if (!usuarioEmail) {
        res.status(400).json({
            mensaje: "Usuario no autenticado"
        });
        return;
    }
    try {
        const usuario = await (0, sqlStore_1.obtenerUsuarioPorEmail)(usuarioEmail);
        if (!usuario) {
            res.status(404).json({
                mensaje: "Usuario no encontrado."
            });
            return;
        }
        if (password && password.length < 6) {
            res.status(400).json({
                mensaje: "La contraseña debe tener al menos 6 caracteres."
            });
            return;
        }
        await (0, sqlStore_1.actualizarUsuario)(usuario.id, { firstName, lastName, password });
        const usuarioActualizado = await (0, sqlStore_1.obtenerUsuarioPorId)(usuario.id);
        res.json({
            mensaje: "Perfil actualizado correctamente.",
            usuario: {
                id: usuarioActualizado?.id ?? usuario.id,
                firstName: usuarioActualizado?.firstName ?? usuario.firstName,
                lastName: usuarioActualizado?.lastName ?? usuario.lastName,
                email: usuarioActualizado?.email ?? usuario.email
            }
        });
    }
    catch (error) {
        console.error("Error al actualizar perfil:", error);
        res.status(500).json({
            mensaje: "Error interno al actualizar perfil."
        });
    }
};
exports.actualizarPerfil = actualizarPerfil;
// Solicitar recuperación de contraseña (enviar código)
const solicitarRecuperacion = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        res.status(400).json({
            mensaje: "Email es obligatorio."
        });
        return;
    }
    try {
        const usuario = await (0, sqlStore_1.obtenerUsuarioPorEmail)(email);
        if (!usuario) {
            res.status(404).json({
                mensaje: "Usuario no encontrado con ese email."
            });
            return;
        }
        // Generar código
        const codigo = generarCodigoRecuperacion();
        const nuevoId = RecuperacionContrasena_1.recuperaciones.length > 0
            ? Math.max(...RecuperacionContrasena_1.recuperaciones.map(r => r.id)) + 1
            : 1;
        const recuperacion = new RecuperacionContrasena_2.default(nuevoId, usuario.id, email, codigo);
        RecuperacionContrasena_1.recuperaciones.push(recuperacion);
        // Crear notificación
        const notifId = Notificacion_1.notificaciones.length > 0
            ? Math.max(...Notificacion_1.notificaciones.map(n => n.id)) + 1
            : 1;
        const notif = new Notificacion_2.default(notifId, usuario.id, "cambio_contrasena", `Código de recuperación solicitado: ${codigo}. Válido por 15 minutos.`);
        Notificacion_1.notificaciones.push(notif);
        // En producción, aquí se enviaría un email
        res.json({
            mensaje: "Código enviado al email. (En desarrollo, código visible en notificaciones)",
            codigo: codigo,
            expiraEn: "15 minutos"
        });
    }
    catch (error) {
        console.error("Error al solicitar recuperacion:", error);
        res.status(500).json({
            mensaje: "Error interno al solicitar recuperacion."
        });
    }
};
exports.solicitarRecuperacion = solicitarRecuperacion;
// Verificar código y cambiar contraseña
const cambiarContraseña = async (req, res) => {
    const { email, codigo, nuevaContrasena, confirmPassword } = req.body;
    if (!email || !codigo || !nuevaContrasena) {
        res.status(400).json({
            mensaje: "Email, código y nueva contraseña son obligatorios."
        });
        return;
    }
    if (nuevaContrasena !== confirmPassword) {
        res.status(400).json({
            mensaje: "Las contraseñas no coinciden."
        });
        return;
    }
    if (nuevaContrasena.length < 6) {
        res.status(400).json({
            mensaje: "La contraseña debe tener al menos 6 caracteres."
        });
        return;
    }
    // Buscar recuperación válida
    const recuperacion = RecuperacionContrasena_1.recuperaciones.find(r => r.email.toLowerCase() === email.toLowerCase() &&
        r.codigo === codigo &&
        !r.utilizado &&
        r.fechaExpiracion > new Date());
    if (!recuperacion) {
        res.status(400).json({
            mensaje: "Código inválido o expirado."
        });
        return;
    }
    try {
        const usuario = await (0, sqlStore_1.obtenerUsuarioPorId)(recuperacion.usuarioId);
        if (!usuario) {
            res.status(404).json({
                mensaje: "Usuario no encontrado."
            });
            return;
        }
        await (0, sqlStore_1.actualizarUsuario)(usuario.id, { password: nuevaContrasena });
        recuperacion.utilizado = true;
        // Crear notificación
        const notifId = Notificacion_1.notificaciones.length > 0
            ? Math.max(...Notificacion_1.notificaciones.map(n => n.id)) + 1
            : 1;
        const notif = new Notificacion_2.default(notifId, usuario.id, "cambio_contrasena", "Tu contraseña ha sido cambiada exitosamente.");
        Notificacion_1.notificaciones.push(notif);
        res.json({
            mensaje: "Contrasena cambiada exitosamente. Puedes iniciar sesion.",
            usuario: {
                id: usuario.id,
                email: usuario.email
            }
        });
    }
    catch (error) {
        console.error("Error al cambiar contrasena:", error);
        res.status(500).json({
            mensaje: "Error interno al cambiar contrasena."
        });
    }
};
exports.cambiarContraseña = cambiarContraseña;
// Logout - Eliminar datos de usuarios temporales
const logout = (_req, res) => {
    res.json({
        mensaje: "Sesion cerrada. Tus datos permanecen guardados en la base de datos.",
        esUsuarioPrueba: false
    });
};
exports.logout = logout;
