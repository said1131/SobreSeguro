// Configuración del usuario de prueba
export const TEST_USER_EMAIL = "karlitaChi@gmail.com";
export const TEST_USER_PASSWORD = "181107";

// Función para verificar si un usuario es de prueba
export function isTestUser(email: string): boolean {
  return email.toLowerCase() === TEST_USER_EMAIL.toLowerCase();
}
