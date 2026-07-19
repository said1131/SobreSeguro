import { Request, Response } from "express";
import { recuperaciones } from "../data/RecuperacionContrasena";
import { notificaciones } from "../data/Notificacion";
import RecuperacionContrasena from "../Models/RecuperacionContrasena";
import Notificacion from "../Models/Notificacion";
import {
    actualizarUsuario,
    asegurarAhorroUsuario,
    crearUsuario,
    obtenerUsuarioPorEmail,
    obtenerUsuarioPorId
} from "../services/sqlStore";

// Función auxiliar para generar código de 6 dígitos
const generarCodigoRecuperacion = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Registrar nuevo usuario
export const registrar = async (req: Request, res: Response): Promise<void> => {
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
        const usuarioExistente = await obtenerUsuarioPorEmail(email);
        if (usuarioExistente) {
            res.status(400).json({
                mensaje: "El email ya está registrado."
            });
            return;
        }

        const nuevoUsuario = await crearUsuario(firstName, lastName, email, password);
        await asegurarAhorroUsuario(nuevoUsuario.id);

        res.status(201).json({
            mensaje: "Usuario registrado correctamente.",
            usuario: {
                id: nuevoUsuario.id,
                firstName: nuevoUsuario.firstName,
                lastName: nuevoUsuario.lastName,
                email: nuevoUsuario.email
            }
        });
    } catch (error) {
        console.error("Error al registrar usuario:", error);
        res.status(500).json({
            mensaje: "Error interno al registrar usuario."
        });
    }
};

// Login
export const login = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400).json({
            mensaje: "Email y contraseña son obligatorios."
        });
        return;
    }

    try {
        const usuario = await obtenerUsuarioPorEmail(email);
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
    } catch (error) {
        console.error("Error en login:", error);
        res.status(500).json({
            mensaje: "Error interno al iniciar sesión."
        });
    }
};

// Obtener perfil
export const obtenerPerfil = async (req: Request, res: Response): Promise<void> => {
    const usuarioId = Number(req.params.id);

    try {
        const usuario = await obtenerUsuarioPorId(usuarioId);
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
    } catch (error) {
        console.error("Error al obtener perfil:", error);
        res.status(500).json({
            mensaje: "Error interno al obtener perfil."
        });
    }
};

// Actualizar perfil
export const actualizarPerfil = async (req: Request, res: Response): Promise<void> => {
    const usuarioEmail = (req.headers["x-usuario-email"] as string)?.toLowerCase();
    const { firstName, lastName, password } = req.body;

    if (!usuarioEmail) {
        res.status(400).json({
            mensaje: "Usuario no autenticado"
        });
        return;
    }

    try {
        const usuario = await obtenerUsuarioPorEmail(usuarioEmail);

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

        await actualizarUsuario(usuario.id, { firstName, lastName, password });
        const usuarioActualizado = await obtenerUsuarioPorId(usuario.id);

        res.json({
            mensaje: "Perfil actualizado correctamente.",
            usuario: {
                id: usuarioActualizado?.id ?? usuario.id,
                firstName: usuarioActualizado?.firstName ?? usuario.firstName,
                lastName: usuarioActualizado?.lastName ?? usuario.lastName,
                email: usuarioActualizado?.email ?? usuario.email
            }
        });
    } catch (error) {
        console.error("Error al actualizar perfil:", error);
        res.status(500).json({
            mensaje: "Error interno al actualizar perfil."
        });
    }
};

// Solicitar recuperación de contraseña (enviar código)
export const solicitarRecuperacion = async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body;

    if (!email) {
        res.status(400).json({
            mensaje: "Email es obligatorio."
        });
        return;
    }

    try {
        const usuario = await obtenerUsuarioPorEmail(email);

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
            codigo: codigo,
            expiraEn: "15 minutos"
        });
    } catch (error) {
        console.error("Error al solicitar recuperacion:", error);
        res.status(500).json({
            mensaje: "Error interno al solicitar recuperacion."
        });
    }
};

// Verificar código y cambiar contraseña
export const cambiarContraseña = async (req: Request, res: Response): Promise<void> => {
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

    try {
        const usuario = await obtenerUsuarioPorId(recuperacion.usuarioId);

        if (!usuario) {
            res.status(404).json({
                mensaje: "Usuario no encontrado."
            });
            return;
        }

        await actualizarUsuario(usuario.id, { password: nuevaContrasena });
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
            mensaje: "Contrasena cambiada exitosamente. Puedes iniciar sesion.",
            usuario: {
                id: usuario.id,
                email: usuario.email
            }
        });
    } catch (error) {
        console.error("Error al cambiar contrasena:", error);
        res.status(500).json({
            mensaje: "Error interno al cambiar contrasena."
        });
    }
};

// Logout - Eliminar datos de usuarios temporales
export const logout = (_req: Request, res: Response): void => {
    res.json({
        mensaje: "Sesion cerrada. Tus datos permanecen guardados en la base de datos.",
        esUsuarioPrueba: false
    });
};

