"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.cambiarContraseña = exports.solicitarRecuperacion = exports.actualizarPerfil = exports.obtenerPerfil = exports.login = exports.registrar = void 0;
const Usuario_1 = require("../data/Usuario");
const RecuperacionContrasena_1 = require("../data/RecuperacionContrasena");
const Notificacion_1 = require("../data/Notificacion");
const Sobres_1 = require("../data/Sobres");
const Ingreso_1 = require("../data/Ingreso");
const Retiro_1 = require("../data/Retiro");
const Usuario_2 = __importDefault(require("../Models/Usuario"));
const Sobre_1 = __importDefault(require("../Models/Sobre"));
const RecuperacionContrasena_2 = __importDefault(require("../Models/RecuperacionContrasena"));
const Notificacion_2 = __importDefault(require("../Models/Notificacion"));
const testUser_1 = require("../config/testUser");
// Función auxiliar para generar código de 6 dígitos
const generarCodigoRecuperacion = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};
// Registrar nuevo usuario
const registrar = (req, res) => {
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
    // Verificar si el email ya existe
    const usuarioExistente = Usuario_1.usuarios.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (usuarioExistente) {
        res.status(400).json({
            mensaje: "El email ya está registrado."
        });
        return;
    }
    // Crear nuevo usuario
    const nuevoId = Usuario_1.usuarios.length > 0
        ? Math.max(...Usuario_1.usuarios.map(u => u.id)) + 1
        : 1;
    const nuevoUsuario = new Usuario_2.default(nuevoId, firstName, lastName, email, password);
    Usuario_1.usuarios.push(nuevoUsuario);
    // Crear automáticamente un sobre de ahorro para el nuevo usuario
    const nuevoAhorroId = Sobres_1.sobres.length > 0
        ? Math.max(...Sobres_1.sobres.map(s => s.id)) + 1
        : 1;
    const nuevoAhorro = new Sobre_1.default(nuevoAhorroId, "Ahorro", 0, 0, true, true, false, 0, "mensual", email);
    console.log(`[registro] Creando sobre de ahorro para ${email}:`, nuevoAhorro);
    Sobres_1.sobres.push(nuevoAhorro);
    console.log(`[registro] Total sobres en sistema: ${Sobres_1.sobres.length}`);
    res.status(201).json({
        mensaje: "Usuario registrado correctamente.",
        usuario: {
            id: nuevoUsuario.id,
            firstName: nuevoUsuario.firstName,
            lastName: nuevoUsuario.lastName,
            email: nuevoUsuario.email
        }
    });
};
exports.registrar = registrar;
// Login
const login = (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400).json({
            mensaje: "Email y contraseña son obligatorios."
        });
        return;
    }
    const usuario = Usuario_1.usuarios.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!usuario) {
        res.status(401).json({
            mensaje: "Email o contraseña incorrectos."
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
};
exports.login = login;
// Obtener perfil
const obtenerPerfil = (req, res) => {
    const usuarioId = Number(req.params.id);
    const usuario = Usuario_1.usuarios.find(u => u.id === usuarioId);
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
};
exports.obtenerPerfil = obtenerPerfil;
// Actualizar perfil
const actualizarPerfil = (req, res) => {
    const usuarioEmail = req.headers["x-usuario-email"]?.toLowerCase();
    const { firstName, lastName, password } = req.body;
    if (!usuarioEmail) {
        res.status(400).json({
            mensaje: "Usuario no autenticado"
        });
        return;
    }
    const usuario = Usuario_1.usuarios.find(u => u.email.toLowerCase() === usuarioEmail);
    if (!usuario) {
        res.status(404).json({
            mensaje: "Usuario no encontrado."
        });
        return;
    }
    if (firstName)
        usuario.firstName = firstName;
    if (lastName)
        usuario.lastName = lastName;
    if (password) {
        if (password.length < 6) {
            res.status(400).json({
                mensaje: "La contraseña debe tener al menos 6 caracteres."
            });
            return;
        }
        usuario.password = password;
    }
    res.json({
        mensaje: "Perfil actualizado correctamente.",
        usuario: {
            id: usuario.id,
            firstName: usuario.firstName,
            lastName: usuario.lastName,
            email: usuario.email
        }
    });
};
exports.actualizarPerfil = actualizarPerfil;
// Solicitar recuperación de contraseña (enviar código)
const solicitarRecuperacion = (req, res) => {
    const { email } = req.body;
    if (!email) {
        res.status(400).json({
            mensaje: "Email es obligatorio."
        });
        return;
    }
    const usuario = Usuario_1.usuarios.find(u => u.email.toLowerCase() === email.toLowerCase());
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
        codigo: codigo, // Solo para desarrollo, en producción no se devuelve
        expiraEn: "15 minutos"
    });
};
exports.solicitarRecuperacion = solicitarRecuperacion;
// Verificar código y cambiar contraseña
const cambiarContraseña = (req, res) => {
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
    // Buscar usuario
    const usuario = Usuario_1.usuarios.find(u => u.id === recuperacion.usuarioId);
    if (!usuario) {
        res.status(404).json({
            mensaje: "Usuario no encontrado."
        });
        return;
    }
    // Cambiar contraseña
    usuario.password = nuevaContrasena;
    recuperacion.utilizado = true;
    // Crear notificación
    const notifId = Notificacion_1.notificaciones.length > 0
        ? Math.max(...Notificacion_1.notificaciones.map(n => n.id)) + 1
        : 1;
    const notif = new Notificacion_2.default(notifId, usuario.id, "cambio_contrasena", "Tu contraseña ha sido cambiada exitosamente.");
    Notificacion_1.notificaciones.push(notif);
    res.json({
        mensaje: "Contraseña cambiad exitosamente. Puedes iniciar sesión.",
        usuario: {
            id: usuario.id,
            email: usuario.email
        }
    });
};
exports.cambiarContraseña = cambiarContraseña;
// Logout - Eliminar datos de usuarios temporales
const logout = (req, res) => {
    const usuarioEmail = req.headers["x-usuario-email"];
    if (!usuarioEmail) {
        res.status(400).json({
            mensaje: "Usuario no autenticado"
        });
        return;
    }
    // Si es el usuario de prueba, no eliminar datos
    if ((0, testUser_1.isTestUser)(usuarioEmail)) {
        res.json({
            mensaje: "Sesión cerrada. Bienvenido de vuelta pronto.",
            esUsuarioPrueba: true
        });
        return;
    }
    // Eliminar datos del usuario temporal
    // Eliminar sobres
    const sobresIndex = Sobres_1.sobres.findIndex(s => s.usuarioEmail === usuarioEmail);
    while (Sobres_1.sobres.findIndex(s => s.usuarioEmail === usuarioEmail) !== -1) {
        Sobres_1.sobres.splice(Sobres_1.sobres.findIndex(s => s.usuarioEmail === usuarioEmail), 1);
    }
    // Eliminar ingresos
    const ingresosIndex = Ingreso_1.ingresos.findIndex(i => i.usuarioEmail === usuarioEmail);
    while (Ingreso_1.ingresos.findIndex(i => i.usuarioEmail === usuarioEmail) !== -1) {
        Ingreso_1.ingresos.splice(Ingreso_1.ingresos.findIndex(i => i.usuarioEmail === usuarioEmail), 1);
    }
    // Eliminar retiros
    const retirosIndex = Retiro_1.retiros.findIndex(r => r.usuarioEmail === usuarioEmail);
    while (Retiro_1.retiros.findIndex(r => r.usuarioEmail === usuarioEmail) !== -1) {
        Retiro_1.retiros.splice(Retiro_1.retiros.findIndex(r => r.usuarioEmail === usuarioEmail), 1);
    }
    // Eliminar usuario (si no es de prueba)
    const usuarioIndex = Usuario_1.usuarios.findIndex(u => u.email.toLowerCase() === usuarioEmail.toLowerCase());
    if (usuarioIndex !== -1) {
        Usuario_1.usuarios.splice(usuarioIndex, 1);
    }
    res.json({
        mensaje: "Sesión cerrada. Todos tus datos temporales han sido eliminados.",
        esUsuarioPrueba: false
    });
};
exports.logout = logout;
