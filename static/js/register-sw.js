// register-sw.js
// Este script se encarga de registrar el Service Worker principal e implementar la instalación PWA.

// Variable para almacenar el evento 'beforeinstallprompt'
let deferredPrompt;
const installButton = document.getElementById('install-button');

// 1. CAPTURAR EL EVENTO DE INSTALACIÓN
// Este evento se dispara cuando el navegador detecta que la PWA es instalable.
window.addEventListener('beforeinstallprompt', (e) => {
    // Evita que el navegador muestre su propio cuadro de diálogo por defecto.
    e.preventDefault();
    
    // Almacena el evento para poder llamarlo más tarde, desde un clic de usuario.
    deferredPrompt = e;
    
    console.log('El evento beforeinstallprompt ha sido capturado.');
    
    // Muestra el botón de instalación si existe en el DOM
    if (installButton) {
        installButton.style.display = 'block';
    }
});

// 2. FUNCIÓN PARA MOSTRAR EL DIÁLOGO DE INSTALACIÓN
if (installButton) {
    installButton.addEventListener('click', (e) => {
        if (deferredPrompt) {
            // Oculta el botón tan pronto como se hace clic
            installButton.style.display = 'none';

            // Muestra el prompt de instalación al usuario
            deferredPrompt.prompt();

            // Espera a que el usuario responda al prompt
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('El usuario aceptó instalar la PWA.');
                    // Aquí podrías añadir un mensaje de flash o una redirección si quieres
                } else {
                    console.log('El usuario rechazó la instalación de la PWA.');
                }
                // Limpia el prompt diferido
                deferredPrompt = null;
            });
        }
    });
}


// 3. REGISTRO DEL SERVICE WORKER (Lógica existente)
if ('serviceWorker' in navigator) {
    // Usamos window.addEventListener('load', ...) para asegurar que todos los recursos
    // de la página principal hayan cargado antes de intentar registrar el SW.
    window.addEventListener('load', () => {
        // CORRECCIÓN CRÍTICA: Indicamos que el Service Worker debe controlar la raíz (scope: '/')
        // Esto le da control sobre todas las páginas de la aplicación, como /index, /auth/login, etc.
        navigator.serviceWorker.register('/static/service-worker.js', {scope: '/'}) 
            .then(registration => {
                console.log('Service Worker registrado con éxito. Scope:', registration.scope);
                // Si la instalación funciona, el scope debe ser "http://localhost:5000/" (la raíz)
            })
            .catch(error => {
                // Esto podría fallar si el SW tiene un error de sintaxis o si no está en la raíz del scope.
                console.log('Fallo el registro del Service Worker:', error);
            });
    });
} else {
    console.warn('El navegador no soporta Service Workers. Funcionalidad offline limitada.');
}
