// Estado global de validación
let validationState = {
    nombre: true,
    apellido1: true,
    telefono: false,
    email: false,
    usuario: false,
    passwords: false
};

// El email es un caso especial por la asincronicidad, inicializarlo aparte.
const emailInput = document.getElementById('email');
const passwordFeedback = document.getElementById('password-feedback');

// Función para actualizar el estado del botón
function updateButtonState() {
    const button = document.getElementById('register-button');
    const isValid = Object.values(validationState).every(Boolean);
    button.disabled = !isValid;
}

// Función para mostrar/ocultar la contraseña
function togglePasswordVisibility(fieldId) {
    const field = document.getElementById(fieldId);
    // Aseguramos que solo afecte al ícono de toggle, no al de validación
    const icon = document.getElementById(`icon-${fieldId}-toggle`); 
    if (field.type === "password") {
        field.type = "text";
        icon.name = "eye-outline";
    } else {
        field.type = "password";
        icon.name = "eye-off-outline";
    }
}

// 1. Validación de Nombre/Apellido (Title Case)
function validateName(input, isRequired = true) {
    let value = input.value.trim();
    // Aplicar Title Case: solo si no está vacío
    if (value.length > 0) {
        value = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
        // Esto solo funciona si solo hay un nombre/apellido
        input.value = value;
    }

    // Validación de formato: solo letras
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ]*$/;
    const isValid = isRequired ? (regex.test(value) && value.length > 0) : regex.test(value);
    
    // No hay iconos de validación para Nombre/Apellido, solo el estado interno.
    validationState[input.id] = isValid || !isRequired; // Si no es requerido, es válido si está vacío
    updateButtonState();
}

// 2. Validación de Teléfono (SIN ICONO)
function validatePhone(input) {
    const value = input.value.trim();
    // ELIMINADO: const iconElement = document.getElementById('icon-telefono');
    
    // Solo 8 dígitos, sin caracteres
    const regex = /^[0-9]{8}$/;
    const isValid = regex.test(value);
    
    // Restricción: solo permitir 8 números
    input.value = input.value.replace(/[^0-9]/g, '').slice(0, 8);
    
    validationState.telefono = isValid;
    updateButtonState();
}

// 3. Validación de Email (SIN ICONO)
function validateEmail(input) {
    const value = input.value.trim();
    // ELIMINADO: const iconElement = document.getElementById('icon-email');
    
    // Expresión regular de email básica
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = regex.test(value);
    
    validationState.email = isValid;
    updateButtonState();
}

// 4. Validación de Usuario (CON ICONO)
function validateUsername(input) {
    const value = input.value.trim();
    const iconElement = document.getElementById('icon-usuario');
    
    // 5 a 15 caracteres alfanuméricos
    const regex = /^[a-zA-Z0-9]{5,15}$/;
    const isLengthValid = regex.test(value);

    // Se mantiene el código para actualizar el icono de usuario
    if (isLengthValid) {
        iconElement.innerHTML = '<ion-icon name="checkmark-circle-outline"></ion-icon>';
        iconElement.style.color = '#4CAF50'; // Verde
    } else {
        iconElement.innerHTML = '<ion-icon name="close-circle-outline"></ion-icon>';
        iconElement.style.color = '#f44336'; // Rojo
    }
    
    // Ocultar el icono si el campo está vacío
    if (value.length === 0) {
        iconElement.innerHTML = '';
    }

    validationState.usuario = isLengthValid;
    updateButtonState();
}

// 5. Validación de Contraseñas
function checkPasswords() {
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password_confirm').value;
    
    const passwordsMatch = password === passwordConfirm && password.length >= 8;
    
    if (password.length > 0 && passwordConfirm.length > 0) {
         if (!passwordsMatch) {
            passwordFeedback.style.display = 'block';
            passwordFeedback.style.color = '#f44336'; // Rojo
            passwordFeedback.textContent = 'Las contraseñas no coinciden o son muy cortas.';
        } else {
            passwordFeedback.style.display = 'block';
            passwordFeedback.style.color = '#4CAF50'; // Verde
            passwordFeedback.textContent = 'Las contraseñas coinciden.';
        }
    } else {
        passwordFeedback.style.display = 'none';
    }


    validationState.passwords = passwordsMatch;
    updateButtonState();
}

// Inicializar estado de validación al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    // Ejecutar validaciones iniciales si hay datos precargados (después de un error de Flask)
    validateName(document.getElementById('nombre'));
    validateName(document.getElementById('apellido1'));
    validatePhone(document.getElementById('telefono'));
    validateUsername(document.getElementById('usuario'));
    checkPasswords();
    
    // Inicializa validación de email si tiene valor
    emailInput.dispatchEvent(new Event('input'));
    
    updateButtonState();
});