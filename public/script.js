// Función para navegar a las diferentes apps
function goToApp(type) {
  if (type === 'user') {
    // Redirigir a la app de usuarios
    window.location.href = '/app1/index.html';
  } else if (type === 'restaurant') {
    // Redirigir a la app de restaurantes
    window.location.href = '/app2/index.html';
  }
}

// Agregar efecto de partículas (opcional - decorativo)
document.addEventListener('DOMContentLoaded', () => {
  console.log('🍕 Bienvenido a PinFood!');
});

