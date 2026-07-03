const API_BASE_URL = "http://localhost:3000/api";

// Obtener usuario autenticado desde localStorage
const getAuthHeaders = () => {
  const headers: any = { "Content-Type": "application/json" };
  
  // Intentar obtener el email del localStorage
  let userEmail: string | null = null;
  
  // Verificar varias claves posibles
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

export const apiClient = {
  auth: {
    registro: async (userData: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
      confirmPassword: string;
    }) => {
      const response = await fetch(`${API_BASE_URL}/auth/registro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      return response.json();
    },

    login: async (email: string, password: string) => {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      return response.json();
    },

    logout: async () => {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      return response.json();
    },

    obtenerPerfil: async (id: number) => {
      const response = await fetch(`${API_BASE_URL}/auth/perfil/${id}`, {
        headers: getAuthHeaders(),
      });
      return response.json();
    },

    actualizarPerfil: async (datos: any) => {
      const response = await fetch(`${API_BASE_URL}/auth/perfil/update`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(datos),
      });
      return response.json();
    },

    solicitarRecuperacion: async (email: string) => {
      const response = await fetch(`${API_BASE_URL}/auth/recuperar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      return response.json();
    },

    cambiarContrasena: async (datos: {
      email: string;
      codigo: string;
      nuevaContrasena: string;
      confirmPassword: string;
    }) => {
      const response = await fetch(`${API_BASE_URL}/auth/cambiar-contrasena`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });
      return response.json();
    },
  },

  sobres: {
    obtener: async () => {
      const response = await fetch(`${API_BASE_URL}/sobres`, {
        headers: getAuthHeaders(),
      });
      return response.json();
    },

    crear: async (datos: { nombre: string; porcentaje: number }) => {
      const response = await fetch(`${API_BASE_URL}/sobres`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(datos),
      });
      return response.json();
    },

    configurarAhorro: async (porcentaje: number, tiempoBloqueoMeses: number) => {
      const response = await fetch(`${API_BASE_URL}/sobres/ahorro`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ porcentaje, tiempoBloqueoMeses }),
      });
      return response.json();
    },

    actualizarPorcentajes: async (sobres: any[]) => {
      const response = await fetch(`${API_BASE_URL}/sobres/porcentajes`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(sobres),
      });
      return response.json();
    },

    actualizarPorcentajeSobre: async (id: number, porcentaje: number) => {
      const response = await fetch(`${API_BASE_URL}/sobres/${id}/porcentaje`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ porcentaje }),
      });
      return response.json();
    },

    eliminar: async (id: number) => {
      const response = await fetch(`${API_BASE_URL}/sobres/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      return response.json();
    },
  },

  ingresos: {
    obtener: async () => {
      const response = await fetch(`${API_BASE_URL}/ingresos`, {
        headers: getAuthHeaders(),
      });
      return response.json();
    },

    actualizar: async (monto: number) => {
      const response = await fetch(`${API_BASE_URL}/ingresos`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ monto }),
      });
      return response.json();
    },

    obtenerHistorialCompleto: async () => {
      const response = await fetch(`${API_BASE_URL}/ingresos/historial/completo`, {
        headers: getAuthHeaders(),
      });
      return response.json();
    },
  },

  retiros: {
    obtenerRetiros: async () => {
      const response = await fetch(`${API_BASE_URL}/retiros`, {
        headers: getAuthHeaders(),
      });
      return response.json();
    },

    realizarRetiro: async (sobreId: number, monto: number) => {
      const response = await fetch(`${API_BASE_URL}/retiros`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ sobreId, monto }),
      });
      const data = await response.json();
      
      // Si hay un error en la respuesta, lanzar excepción para que sea capturada
      if (data.mensaje && !response.ok) {
        const error = new Error(data.mensaje) as any;
        error.bloqueado = data.bloqueado;
        error.diasRestantes = data.diasRestantes;
        error.fechaDesbloqueo = data.fechaDesbloqueo;
        throw error;
      }
      
      // Si la respuesta contiene error en body (aunque status sea 200)
      if (data.error || (data.mensaje && data.mensaje.toLowerCase().includes('bloqueado'))) {
        const error = new Error(data.mensaje || 'Error en retiro') as any;
        error.bloqueado = data.bloqueado;
        error.diasRestantes = data.diasRestantes;
        error.fechaDesbloqueo = data.fechaDesbloqueo;
        throw error;
      }
      
      return data;
    },

    obtenerRetirosSobre: async (sobreId: number) => {
      const response = await fetch(`${API_BASE_URL}/retiros/sobre/${sobreId}`, {
        headers: getAuthHeaders(),
      });
      return response.json();
    },
  },
};
