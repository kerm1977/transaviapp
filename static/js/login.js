// Función para mostrar/ocultar la contraseña
function togglePasswordVisibility(fieldId) {
    const field = document.getElementById(fieldId);
    const icon = document.getElementById(`icon-${fieldId}`);
    if (field.type === "password") {
        field.type = "text";
        icon.name = "eye-outline";
    } else {
        field.type = "password";
        icon.name = "eye-off-outline";
    }
}