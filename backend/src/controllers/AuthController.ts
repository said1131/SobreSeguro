import { Request, Response } from "express";
import { usuarios } from "../data/Usuario";
import { recuperaciones } from "../data/RecuperacionContrasena";
import { notificaciones } from "../data/Notificacion";
import { sobres } from "../data/Sobres";
import { ingresos } from "../data/Ingreso";
import { retiros } from "../data/Retiro";
import Usuario from "../Models/Usuario";
import Sobre from "../Models/Sobre";
import RecuperacionContrasena from "../Models/RecuperacionContrasena";
import Notificacion from "../Models/Notificacion";
import { isTestUser } from "../config/testUser";

// Función auxiliar para generar código de 6 dígitos
const generarCodigoRecuperacion = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Registrar nuevo usuario
export const registrar = (req: Request, res: Response): void => {
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
    const usuarioExistente = usuarios.find(
        u => u.email.toLowerCase() === email.toLowerCase()
    );

    if (usuarioExistente) {
        res.status(400).json({
            mensaje: "El email ya está registrado."
        });
        return;
    }

    // Crear nuevo usuario
    const nuevoId = usuarios.length > 0 
        ? Math.max(...usuarios.map(u => u.id)) + 1 
        : 1;

    const nuevoUsuario = new Usuario(
        nuevoId,
        firstName,
        lastName,
        email,
        password
    );

    usuarios.push(nuevoUsuario);

    // Crear automáticamente un sobre de ahorro para el nuevo usuario
    const nuevoAhorroId = sobres.length > 0 
        ? Math.max(...sobres.map(s => s.id)) + 1 
        : 1;
    
    const nuevoAhorro = new Sobre(
        nuevoAhorroId,
        "Ahorro",
        0,
        0,
        true,
        true,
        false,
        0,
        "mensual",
        email
    );

    console.log(`[registro] Creando sobre de ahorro para ${email}:`, nuevoAhorro);
    sobres.push(nuevoAhorro);
    console.log(`[registro] Total sobres en sistema: ${sobres.length}`);

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

// Login
export const login = (req: Request, res: Response): void => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400).json({
            mensaje: "Email y contraseña son obligatorios."
        });
        return;
    }

    const usuario = usuarios.find(
        u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

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

// Obtener perfil
export const obtenerPerfil = (req: Request, res: Response): void => {
    const usuarioId = Number(req.params.id);

    const usuario = usuarios.find(u => u.id === usuarioId);

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

// Actualizar perfil
export const actualizarPerfil = (req: Request, res: Response): void => {
    const usuarioEmail = (req.headers["x-usuario-email"] as string)?.toLowerCase();
    const { firstName, lastName, password } = req.body;

    if (!usuarioEmail) {
        res.status(400).json({
            mensaje: "Usuario no autenticado"
        });
        return;
    }

    const usuario = usuarios.find(u => u.email.toLowerCase() === usuarioEmail);

    if (!usuario) {
        res.status(404).json({
            mensaje: "Usuario no encontrado."
        });
        return;
    }

    if (firstName) usuario.firstName = firstName;
    if (lastName) usuario.lastName = lastName;
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

// Solicitar recuperación de contraseña (enviar código)
export const solicitarRecuperacion = (req: Request, res: Response): void => {
    const { email } = req.body;

    if (!email) {
        res.status(400).json({
            mensaje: "Email es obligatorio."
        });
        return;
    }

    const usuario = usuarios.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!usuario) {
        res.status(404).json({
            mensaje: "Usuario no encontrado con ese email."
        });
        return;
    }

    // Generar código
    const codigo = generarCodigoRecuperacion();
    const nuevoId = recuperaciones.length > 0 
        ? Math.max(...recuperaciones.map(r => r.id)) + 1 
        : 1;

    const recuperacion = new RecuperacionContrasena(
        nuevoId,
        usuario.id,
        email,
        codigo
    );

    recuperaciones.push(recuperacion);

    // Crear notificación
    const notifId = notificaciones.length > 0 
        ? Math.max(...notificaciones.map(n => n.id)) + 1 
        : 1;

    const notif = new Notificacion(
        notifId,
        usuario.id,
        "cambio_contrasena",
        `Código de recuperación solicitado: ${codigo}. Válido por 15 minutos.`
    );

    notificaciones.push(notif);

    // En producción, aquí se enviaría un email
    res.json({
        mensaje: "Código enviado al email. (En desarrollo, código visible en notificaciones)",
        codigo: codigo, // Solo para desarrollo, en producción no se devuelve
        expiraEn: "15 minutos"
    });
};

// Verificar código y cambiar contraseña
export const cambiarContraseña = (req: Request, res: Response): void => {
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
    const recuperacion = recuperaciones.find(
        r => r.email.toLowerCase() === email.toLowerCase() && 
             r.codigo === codigo && 
             !r.utilizado &&
             r.fechaExpiracion > new Date()
    );

    if (!recuperacion) {
        res.status(400).json({
            mensaje: "Código inválido o expirado."
        });
        return;
    }

    // Buscar usuario
    const usuario = usuarios.find(u => u.id === recuperacion.usuarioId);

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
    const notifId = notificaciones.length > 0 
        ? Math.max(...notificaciones.map(n => n.id)) + 1 
        : 1;

    const notif = new Notificacion(
        notifId,
        usuario.id,
        "cambio_contrasena",
        "Tu contraseña ha sido cambiada exitosamente."
    );

    notificaciones.push(notif);

    res.json({
        mensaje: "Contraseña cambiad exitosamente. Puedes iniciar sesión.",
        usuario: {
            id: usuario.id,
            email: usuario.email
        }
    });
};

// Logout - Eliminar datos de usuarios temporales
export const logout = (req: Request, res: Response): void => {
    const usuarioEmail = req.headers["x-usuario-email"] as string;

    if (!usuarioEmail) {
        res.status(400).json({
            mensaje: "Usuario no autenticado"
        });
        return;
    }

    // Si es el usuario de prueba, no eliminar datos
    if (isTestUser(usuarioEmail)) {
        res.json({
            mensaje: "Sesión cerrada. Bienvenido de vuelta pronto.",
            esUsuarioPrueba: true
        });
        return;
    }

    // Eliminar datos del usuario temporal
    // Eliminar sobres
    const sobresIndex = sobres.findIndex(s => s.usuarioEmail === usuarioEmail);
    while (sobres.findIndex(s => s.usuarioEmail === usuarioEmail) !== -1) {
        sobres.splice(sobres.findIndex(s => s.usuarioEmail === usuarioEmail), 1);
    }

    // Eliminar ingresos
    const ingresosIndex = ingresos.findIndex(i => i.usuarioEmail === usuarioEmail);
    while (ingresos.findIndex(i => i.usuarioEmail === usuarioEmail) !== -1) {
        ingresos.splice(ingresos.findIndex(i => i.usuarioEmail === usuarioEmail), 1);
    }

    // Eliminar retiros
    const retirosIndex = retiros.findIndex(r => r.usuarioEmail === usuarioEmail);
    while (retiros.findIndex(r => r.usuarioEmail === usuarioEmail) !== -1) {
        retiros.splice(retiros.findIndex(r => r.usuarioEmail === usuarioEmail), 1);
    }

    // Eliminar usuario (si no es de prueba)
    const usuarioIndex = usuarios.findIndex(u => u.email.toLowerCase() === usuarioEmail.toLowerCase());
    if (usuarioIndex !== -1) {
        usuarios.splice(usuarioIndex, 1);
    }

    res.json({
        mensaje: "Sesión cerrada. Todos tus datos temporales han sido eliminados.",
        esUsuarioPrueba: false
    });
};

