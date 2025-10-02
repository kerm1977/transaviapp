// Función para cambiar entre pestañas
function openTab(evt, tabName) {
    let i, tabcontent, tabbuttons;
    
    // Ocultar todo el contenido de las pestañas
    tabcontent = document.getElementsByClassName("tab-content");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    
    // Desactivar todos los botones de pestaña
    tabbuttons = document.getElementsByClassName("tab-button");
    for (i = 0; i < tabbuttons.length; i++) {
        tabbuttons[i].classList.remove("active");
    }
    
    // Mostrar la pestaña actual y activar el botón
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.classList.add("active");
}

// Inicializar la primera pestaña al cargar la página (Servicios Especiales)
document.addEventListener("DOMContentLoaded", function() {
    const defaultTabButton = document.querySelector(".tab-button");
    if (defaultTabButton) {
        defaultTabButton.click();
    }
});