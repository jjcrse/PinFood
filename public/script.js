// 🔧 CONFIGURACIÓN - Detecta automáticamente si está en desarrollo o producción
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// URLs de las aplicaciones
const URLS = {
  shop: isDevelopment 
    ? '/app2/' 
    : 'https://pin-food-26he.vercel.app/',
  user: isDevelopment 
    ? '/app1/' 
    : 'https://pinfoodapp1.vercel.app/'
};

// Función universal para redirigir a cualquier app
function goToApp(appType) {
  if (appType === 'shop') {
    window.location.href = URLS.shop;
  } else if (appType === 'user') {
    window.location.href = URLS.user;
  } else {
    // Si es una URL directa (compatibilidad con versión anterior)
    window.location.href = appType;
  }
}

// Decorativo
document.addEventListener('DOMContentLoaded', () => {
  console.log('🍕 Bienvenido a PinFood Landing Page');
  console.log(`📍 Modo: ${isDevelopment ? 'Desarrollo' : 'Producción'}`);
});
