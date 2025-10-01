from flask import Flask, render_template, redirect, url_for, flash, request, Blueprint, session
from werkzeug.security import check_password_hash
import re
from functools import wraps

# Importa las funciones de conexión/lógica de la base de datos
from config import get_user_by_email_or_username, register_user, init_db

# Inicialización de la base de datos (asegura que db.db exista con la tabla)
init_db()

# =======================================================
# CONFIGURACIÓN DE LA APLICACIÓN PRINCIPAL
# =======================================================
app = Flask(__name__)
app.config['SECRET_KEY'] = 'una_clave_secreta_super_segura_404' # Necesario para flash y session

# =======================================================
# UTILITY FUNCTIONS
# =======================================================

def is_logged_in(f):
    """Decorator para proteger rutas que requieren inicio de sesión."""
    @wraps(f)
    def wrap(*args, **kwargs):
        if 'logged_in' in session and session['logged_in']:
            return f(*args, **kwargs)
        else:
            flash('Acceso denegado. Por favor, inicia sesión.', 'warning')
            return redirect(url_for('auth.login'))
    return wrap

def format_title_case(text):
    """Aplica formato Title, eliminando espacios y caracteres no alfabéticos."""
    # Eliminar cualquier caracter que no sea letra (incluyendo espacios, números y puntuación)
    cleaned_text = re.sub(r'[^a-zA-ZáéíóúÁÉÍÓÚñÑ]', '', text)
    if not cleaned_text:
        return ''
    # Aplicar title case al texto limpio
    return cleaned_text.capitalize()

# =======================================================
# BLUEPRINT DE AUTENTICACIÓN (auth_bp)
# =======================================================
auth_bp = Blueprint('auth', __name__, template_folder='templates')

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    """Vista para iniciar sesión."""
    if request.method == 'POST':
        # Los datos pueden ser email o nombre de usuario
        identifier = request.form['identifier']
        password = request.form['password']
        remember = 'remember_me' in request.form
        
        user = get_user_by_email_or_username(identifier)

        if user and check_password_hash(user['password_hash'], password):
            # Login exitoso
            session['logged_in'] = True
            session['user_id'] = user['id']
            session['username'] = user['usuario']
            session['full_name'] = f"{user['nombre']} {user['primer_apellido']}"
            
            # Si "Mantener sesión activa" está activo, la sesión se extiende
            session.permanent = remember
            
            flash('¡Inicio de sesión exitoso!', 'success')
            return redirect(url_for('main.index'))
        else:
            flash('Email/Usuario o Contraseña incorrectos.', 'danger')
            return render_template('login.html')

    return render_template('login.html')

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    """Vista para registrar un nuevo usuario."""
    # Inicializa form_data como diccionario vacío para la solicitud GET
    form_data = {} 
    
    if request.method == 'POST':
        # 1. Obtener datos del formulario
        nombre = request.form['nombre']
        apellido1 = request.form['apellido1']
        apellido2 = request.form.get('apellido2', '') # Es opcional en la BD
        telefono = request.form['telefono']
        email = request.form['email']
        usuario = request.form['usuario']
        password = request.form['password']
        password_confirm = request.form['password_confirm']
        
        # Guardamos los datos del formulario original en caso de error
        form_data = request.form 
        
        # 2. Validaciones de servidor (adicionales a las de cliente)
        errors = []
        
        # Validación de longitud de Usuario (máx 10)
        if len(usuario) > 10:
             errors.append('El nombre de Usuario no puede exceder los 10 caracteres.')
        
        # Validación de Teléfono (exactamente 8 dígitos numéricos)
        # Nota: El frontend ya restringe la entrada, pero el backend valida el formato final.
        if not re.fullmatch(r'^\d{8}$', telefono):
             errors.append('El Teléfono debe contener exactamente 8 dígitos numéricos.')
        
        # Validación de contraseñas
        if password != password_confirm:
             errors.append('Las contraseñas no coinciden.')
        
        # 3. Formatear y limpiar los campos de nombre/apellido (lógica de Title Case sin espacios/caracteres especiales)
        nombre_clean = format_title_case(nombre)
        apellido1_clean = format_title_case(apellido1)
        apellido2_clean = format_title_case(apellido2)

        if not nombre_clean or not apellido1_clean:
             errors.append('Nombre y Primer Apellido solo deben contener letras.')
        
        if errors:
            for error in errors:
                flash(error, 'danger')
            # Retorna con los datos del formulario (form_data) para mantenerlos
            return render_template('register.html', form_data=form_data)

        # 4. Intentar registrar el usuario con los datos limpios
        result = register_user(nombre_clean, apellido1_clean, apellido2_clean, telefono, email, usuario, password)
        
        # 5. Manejar resultados de registro (IntegrityError de la DB)
        if result is True:
            flash('¡Registro exitoso! Por favor, inicia sesión.', 'success')
            return redirect(url_for('auth.login'))
        elif result == 'email_exists':
            flash('El email ya está registrado.', 'danger')
        elif result == 'username_exists':
            flash('El nombre de Usuario ya está en uso.', 'danger')
        elif result == 'phone_exists':
            flash('El número de Teléfono ya está registrado.', 'danger')
        else:
            flash('Ocurrió un error desconocido durante el registro.', 'danger')

        # Si hay errores de DB, retorna con los datos del formulario para que el usuario no pierda el progreso
        return render_template('register.html', form_data=form_data)
    
    # Si el método es GET, se renderiza con form_data={}
    return render_template('register.html', form_data=form_data)


@auth_bp.route('/logout')
def logout():
    """Ruta para cerrar la sesión del usuario."""
    session.clear() # Limpia toda la información de la sesión
    flash('Has cerrado sesión exitosamente.', 'info')
    return redirect(url_for('auth.login'))


# =======================================================
# BLUEPRINT PRINCIPAL (main_bp)
# =======================================================
main_bp = Blueprint('main', __name__, template_folder='templates')

@main_bp.route('/index') 
# @is_logged_in <--- ELIMINADO: Ahora es accesible públicamente
def index():
    """Ruta principal (Pública)."""
    return render_template('index.html')

# NUEVAS RUTAS DE NAVEGACIÓN (Públicas)
@main_bp.route('/messages')
# @is_logged_in <--- ELIMINADO
def messages():
    """Vista de Mensajes (Pública)."""
    return render_template('index.html', page_title="Mensajes")

@main_bp.route('/photos')
# @is_logged_in <--- ELIMINADO
def photos():
    """Vista de Fotos (Pública)."""
    return render_template('index.html', page_title="Fotos")

@main_bp.route('/settings')
# @is_logged_in <--- ELIMINADO
def settings():
    """Vista de Ajustes (Pública)."""
    return render_template('index.html', page_title="Ajustes")

# =======================================================
# REGISTRO DE BLUEPRINTS Y RUTAS GLOBALES
# =======================================================

app.register_blueprint(auth_bp, url_prefix='/auth')
app.register_blueprint(main_bp, url_prefix='/')

# Redirección de la ruta raíz (solicitud inicial de "/" ) a la página de inicio de sesión
@app.route('/')
def home():
    if 'logged_in' in session and session['logged_in']:
        return redirect(url_for('main.index'))
    else:
        # CAMBIADO: Redirigir a Index (página pública) en lugar de login si la app es pública
        return redirect(url_for('main.index'))


# PROHIBIDO TOCAR ESTA ÁREA NI LOS COMENTARIOS 
if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True, port=3030)


# Migraciones Cmder
        # set FLASK_APP=app.py     <--Crea un directorio de migraciones
        # flask db init             <--
        # $ flask db stamp head
        # $ flask db migrate
        # $ flask db migrate -m "mensaje x"
        # $ flask db upgrade
        # ERROR [flask_migrate] Error: Target database is not up to date.
        # $ flask db stamp head
        # $ flask db migrate
        # $ flask db upgrade
        # git clone https://github.com/kerm1977/MI_APP_FLASK.git
        # mysql> DROP DATABASE kenth1977$db; PYTHONANYWHATE
# -----------------------

# del db.db
# rmdir /s /q migrations
# flask db init
# flask db migrate -m "Reinitial migration with all correct models"
# flask db upgrade


# -----------------------
# Consola de pythonanywhere ante los errores de versiones
# Error: Can't locate revision identified by '143967eb40c0'

# flask db stamp head
# flask db migrate
# flask db upgrade

# Database pythonanywhere
# kenth1977$db
# DROP TABLE alembic_version;
# rm -rf migrations
# flask db init
# flask db migrate -m "Initial migration after reset"
# flask db upgrade

# 21:56 ~/LATRIBU1 (main)$ source env/Scripts/activate
# (env) 21:57 ~/LATRIBU1 (main)$

# En caso de que no sirva el env/Scripts/activate
# remover en env
# 05:48 ~/latribuapp (main)$ rm -rf env
# Crear nuevo
# 05:49 ~/latribuapp (main)$ python -m venv env
# 05:51 ~/latribuapp (main)$ source env/bin/activate
# (env) 05:52 ~/latribuapp (main)$ 



# Cuando se cambia de repositorio
# git remote -v
# git remote add origin <URL_DEL_REPOSITORIO>
# git remote set-url origin <NUEVA_URL_DEL_REPOSITORIO>
# git branchgit remote -v
# git push -u origin flet



# borrar base de datos y reconstruirla
# pip install PyMySQL
# SHOW TABLES;
# 21:56 ~/LATRIBU1 (main)$ source env/Scripts/activate <-- Entra al entorno virtual
# (env) 21:57 ~/LATRIBU1 (main)$
# (env) 23:30 ~/LATRIBU1 (main)$ cd /home/kenth1977/LATRIBU1
# (env) 23:31 ~/LATRIBU1 (main)$ rm -f instance/db.db
# (env) 23:32 ~/LATRIBU1 (main)$ rm -rf migrations
# (env) 23:32 ~/LATRIBU1 (main)$ flask db init
# (env) 23:33 ~/LATRIBU1 (main)$ flask db migrate -m "Initial migration with all models"
# (env) 23:34 ~/LATRIBU1 (main)$ flask db upgrade
# (env) 23:34 ~/LATRIBU1 (main)$ ls -l instance/db


# GUARDA  todas las dependecias para utilizar offline luego
# pip download -r requirements.txt -d librerias_offline
# INSTALA  todas las dependecias para utilizar offline luego
# pip install --no-index --find-links=./librerias_offline -r requirements.txt