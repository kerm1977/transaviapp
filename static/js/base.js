const list = document.querySelectorAll('.list');
const indicator = document.querySelector('.indicator');
const body = document.body;
const themeToggleButton = document.getElementById('theme-toggle');
const mainContent = document.getElementById('main-content'); // Nuevo: Referencia al div de contenido

// ===========================================
// FUNCIONES GLOBALES REQUERIDAS
// ===========================================

function getPathname() {
    // Retorna la ruta base (ej: /auth/login, /messages) sin el origen
    const path = window.location.pathname.replace(/^\/|\/$/g, '');
    
    if (path.startsWith('auth/')) {
         return 'auth';
    }
    return path;
}

// -------------------------------------------
// Lógica de Temas con Persistencia (localStorage)
// -------------------------------------------
const themes = ['theme-dark', 'theme-light', 'theme-sepia'];
const localStorageKey = 'appTheme'; // Clave para guardar en localStorage

function getCurrentThemeIndex() {
    for (let i = 0; i < themes.length; i++) {
        if (body.classList.contains(themes[i])) {
            return i;
        }
    }
    return 0; // Por defecto 'theme-dark'
}

function applyTheme(themeClass, initialLoad = false) {
    themes.forEach(t => body.classList.remove(t));
    body.classList.add(themeClass);
    
    if (!initialLoad) {
         const newIndex = getCurrentThemeIndex();
         const iconElement = themeToggleButton.querySelector('ion-icon');
         iconElement.style.transform = `rotate(${newIndex * 120}deg)`; 
         localStorage.setItem(localStorageKey, themeClass);
    }
}

function toggleTheme() {
    const currentThemeIndex = getCurrentThemeIndex();
    let newThemeIndex = (currentThemeIndex + 1) % themes.length;
    const newTheme = themes[newThemeIndex];
    
    applyTheme(newTheme, false); 
    
    const activeItem = document.querySelector('.list.active');
    if (activeItem) {
        setTimeout(() => moveIndicator(activeItem), 50); 
    }
}

function loadInitialTheme() {
    const savedTheme = localStorage.getItem(localStorageKey);
    if (savedTheme && themes.includes(savedTheme)) {
        applyTheme(savedTheme, true); 
    } else {
        applyTheme('theme-dark', true); 
    }
    
    const initialIndex = getCurrentThemeIndex();
    const iconElement = themeToggleButton.querySelector('ion-icon');
    iconElement.style.transform = `rotate(${initialIndex * 120}deg)`; 
}

loadInitialTheme();

themeToggleButton.addEventListener('click', toggleTheme);


// -------------------------------------------
// Lógica de Navbar y Movimiento
// -------------------------------------------

function updateIndicatorContent(element) {
    const iconName = element.getAttribute('data-icon-name');
    const iconHtml = `<span class="dot-icon"><ion-icon name="${iconName}"></ion-icon></span>`;
    
    indicator.innerHTML = iconHtml;
    
    const dotIcon = indicator.querySelector('.dot-icon');
    setTimeout(() => {
        if (dotIcon) {
            dotIcon.style.opacity = '1';
        }
    }, 500); 
}

function moveIndicator(element) {
    const listWidth = element.offsetWidth;
    const indicatorWidth = indicator.offsetWidth;
    const offset = element.offsetLeft + (listWidth / 2) - (indicatorWidth / 2);

    const currentDotIcon = indicator.querySelector('.dot-icon');
    if (currentDotIcon) {
        currentDotIcon.style.opacity = '0';
    }

    indicator.style.transition = '0.5s';
    indicator.style.transform = `translateX(${offset}px)`;
    
    updateIndicatorContent(element);
}

function highlightActiveLink() {
    const path = getPathname(); 
    let activeItem = null;
    
    list.forEach((item) => {
        item.classList.remove('active');
    });
    
    activeItem = document.querySelector(`[data-path="${path}"]`);

    if (!activeItem && (path === '' || path === 'main' || path.includes('index'))) {
        activeItem = document.querySelector('[data-path="index"]');
    }
    
    if (!activeItem) {
        activeItem = document.querySelector('[data-path="index"]');
    }


    if (activeItem) {
        activeItem.classList.add('active');
        moveIndicator(activeItem);
    }
}

// --- FUNCIÓN DE NAVEGACIÓN SUAVIZADA ---
function smoothNavigate(e) {
    // Previene la navegación inmediata del enlace
    e.preventDefault();
    
    const listItem = e.currentTarget.closest('.list');
    const targetUrl = e.currentTarget.href;

    // 1. Oculta el contenido antes de la recarga
    mainContent.style.opacity = '0'; 

    // 2. Mueve el indicador inmediatamente
    list.forEach((i) => i.classList.remove('active'));
    listItem.classList.add('active');
    moveIndicator(listItem);

    // 3. Espera a que la animación CSS del indicador termine (0.5s + 50ms buffer)
    setTimeout(() => {
        // 4. Navega a la nueva URL (esto recarga toda la página)
        window.location.href = targetUrl;
    }, 550); 
}

// Reasignar el evento de click para usar la función smoothNavigate
list.forEach((item) => {
    const link = item.querySelector('a');
    if (link) {
         // Eliminamos cualquier listener anterior (para limpiar el estado)
         link.removeEventListener('click', smoothNavigate);
         
         // Añadimos el nuevo smoothNavigate
         link.addEventListener('click', smoothNavigate);
    }
});

// Inicialización y Responsividad
window.addEventListener('load', () => {
     highlightActiveLink();
     // Añadido: Hace visible el contenido después de que el indicador se ha movido
     mainContent.classList.remove('page-loading');
     mainContent.classList.add('page-loaded');
});

window.addEventListener('resize', () => {
     const activeItem = document.querySelector('.list.active');
     if (activeItem) {
        moveIndicator(activeItem);
     }
});

// Ocultar mensajes flash después de 5 segundos
$(document).ready(function() {
    window.setTimeout(function() {
        $(".flash-message").fadeTo(500, 0).slideUp(500, function(){
            $(this).remove(); 
        });
    }, 5000); // 5 segundos
});