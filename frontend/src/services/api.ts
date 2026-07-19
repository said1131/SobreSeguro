const API_BASE_URL = "http://localhost:3000/api";

const getAuthHeaders = () => {
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  let userEmail: string | null = null;

  const storedUserCurrent = localStorage.getItem('sobreseguro-current-user');
  const storedUserRegistered = localStorage.getItem('sobreseguro-registered-user');
  const storedUser = localStorage.getItem('storedUser');

  if (storedUserCurrent) {
    try {
      const user = JSON.parse(storedUserCurrent);
      userEmail = user.email;
    } catch (err) {
      console.error('Error parsing sobreseguro-current-user:', err);
    }
  } else if (storedUserRegistered) {
    try {
      const user = JSON.parse(storedUserRegistered);
      userEmail = user.email;
    } catch (err) {
      console.error('Error parsing sobreseguro-registered-user:', err);
    }
  } else if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      userEmail = user.email;
    } catch (err) {
      console.error('Error parsing storedUser:', err);
    }
  }

  if (userEmail) {
    headers["x-usuario-email"] = userEmail;
  }

  return headers;
};

const parseJsonSafely = async (response: Response) => {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  const text = await response.text();
  return text ? { mensaje: text } : null;
};

const requestJson = async (path: string, options: RequestInit = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, options);
    const data = await parseJsonSafely(response);

    if (!response.ok) {
      const message = data?.mensaje || data?.error || `Error ${response.status}`;
      const error = new Error(message) as Error & { status?: number; body?: unknown };
      error.status = response.status;
      error.body = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (err instanceof TypeError) {
      const networkError = new Error('No se pudo conectar con el servidor.') as Error & { cause?: unknown };
      networkError.cause = err;
      throw networkError;
    }

    throw err;
  }
};

export const apiClient = {
  auth: {
    registro: async (userData: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
      confirmPassword: string;
    }) => {
      return requestJson('/auth/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
    },

    login: async (email: string, password: string) => {
      return requestJson('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
    },

    logout: async () => {
      return requestJson('/auth/logout', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
    },

    obtenerPerfil: async (id: number) => {
      return requestJson(`/auth/perfil/${id}`, {
        headers: getAuthHeaders(),
      });
    },

    actualizarPerfil: async (datos: any) => {
      return requestJson('/auth/perfil/update', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(datos),
      });
    },

    solicitarRecuperacion: async (email: string) => {
      return requestJson('/auth/recuperar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
    },

    cambiarContrasena: async (datos: {
      email: string;
      codigo: string;
      nuevaContrasena: string;
      confirmPassword: string;
    }) => {
      return requestJson('/auth/cambiar-contrasena', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      });
    },
  },

  sobres: {
    obtener: async () => {
      return requestJson('/sobres', {
        headers: getAuthHeaders(),
      });
    },

    crear: async (datos: { nombre: string; porcentaje: number }) => {
      return requestJson('/sobres', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(datos),
      });
    },

    configurarAhorro: async (porcentaje: number, tiempoBloqueoMeses: number) => {
      return requestJson('/sobres/ahorro', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ porcentaje, tiempoBloqueoMeses }),
      });
    },

    actualizarPorcentajes: async (sobres: any[]) => {
      return requestJson('/sobres/porcentajes', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(sobres),
      });
    },

    actualizarPorcentajeSobre: async (id: number, porcentaje: number) => {
      return requestJson(`/sobres/${id}/porcentaje`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ porcentaje }),
      });
    },

    actualizarSobre: async (id: number, datos: { nombre: string; porcentaje: number }) => {
      return requestJson(`/sobres/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(datos),
      });
    },

    eliminar: async (id: number) => {
      return requestJson(`/sobres/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
    },
  },

  ingresos: {
    obtener: async () => {
      return requestJson('/ingresos', {
        headers: getAuthHeaders(),
      });
    },

    actualizar: async (monto: number) => {
      return requestJson('/ingresos', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ monto }),
      });
    },

    obtenerHistorialCompleto: async () => {
      return requestJson('/ingresos/historial/completo', {
        headers: getAuthHeaders(),
      });
    },
  },

  retiros: {
    obtenerRetiros: async () => {
      return requestJson('/retiros', {
        headers: getAuthHeaders(),
      });
    },

    realizarRetiro: async (sobreId: number, monto: number) => {
      const response = await fetch(`${API_BASE_URL}/retiros`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ sobreId, monto }),
      });
      const data = await parseJsonSafely(response);

      if (data?.mensaje && !response.ok) {
        const error = new Error(data.mensaje) as Error & {
          bloqueado?: boolean;
          diasRestantes?: number;
          fechaDesbloqueo?: string;
        };
        error.bloqueado = data.bloqueado;
        error.diasRestantes = data.diasRestantes;
        error.fechaDesbloqueo = data.fechaDesbloqueo;
        throw error;
      }

      if (data?.error || (data?.mensaje && data.mensaje.toLowerCase().includes('bloqueado'))) {
        const error = new Error(data.mensaje || 'Error en retiro') as Error & {
          bloqueado?: boolean;
          diasRestantes?: number;
          fechaDesbloqueo?: string;
        };
        error.bloqueado = data.bloqueado;
        error.diasRestantes = data.diasRestantes;
        error.fechaDesbloqueo = data.fechaDesbloqueo;
        throw error;
      }

      if (!response.ok) {
        const error = new Error(data?.mensaje || 'Error al realizar retiro');
        throw error;
      }

      return data;
    },

    obtenerRetirosSobre: async (sobreId: number) => {
      return requestJson(`/retiros/sobre/${sobreId}`, {
        headers: getAuthHeaders(),
      });
    },
  },
};
