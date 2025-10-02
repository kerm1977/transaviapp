# config.py
import sqlite3
from werkzeug.security import generate_password_hash
from sqlite3 import IntegrityError

DATABASE = 'db.db'
# Variable para controlar si ya se ha impreso el mensaje de éxito de inicialización.
# Esto ayuda a mitigar la doble impresión del Flask reloader.
DB_INIT_MESSAGE_SHOWN = False 


def init_db():
    """Inicializa la base de datos y crea la tabla de usuarios si no existe."""
    global DB_INIT_MESSAGE_SHOWN
    
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    try:
        # Comando para crear la tabla si no existe
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                primer_apellido TEXT NOT NULL,
                segundo_apellido TEXT,
                telefono TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                usuario TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL
            )
        ''')
        conn.commit()
        
        # Este mensaje solo se imprimirá una vez por ejecución del script Python, 
        # sin importar si la tabla ya existía o si Flask la llama dos veces.
        if not DB_INIT_MESSAGE_SHOWN:
            print("Base de datos 'db.db' verificada: La tabla 'users' está lista.")
            DB_INIT_MESSAGE_SHOWN = True
            
    except Exception as e:
        print(f"Error al inicializar la base de datos: {e}")
    finally:
        conn.close()


# --- Funciones CRUD y de Búsqueda ---

def get_db_connection():
    """Retorna una conexión a la base de datos."""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row  # Permite acceder a las columnas por nombre
    return conn

def get_user_by_email_or_username(identifier):
    """Busca un usuario por email o nombre de usuario."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Intenta buscar por email
    cursor.execute('SELECT * FROM users WHERE email = ?', (identifier,))
    user = cursor.fetchone()
    
    if user is None:
        # Si no se encuentra por email, intenta buscar por nombre de usuario
        cursor.execute('SELECT * FROM users WHERE usuario = ?', (identifier,))
        user = cursor.fetchone()
        
    conn.close()
    return user

def get_user_by_id(user_id):
    """Busca un usuario por su ID (usado después del login para obtener detalles)."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
    user = cursor.fetchone()
    conn.close()
    # Retorna un diccionario con los datos o None
    return dict(user) if user else None


def register_user(nombre, apellido1, apellido2, telefono, email, usuario, password):
    """Registra un nuevo usuario, manejando colisiones de UNIQUE."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    password_hash = generate_password_hash(password)
    
    try:
        cursor.execute(
            'INSERT INTO users (nombre, primer_apellido, segundo_apellido, telefono, email, usuario, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?)',
            (nombre, apellido1, apellido2, telefono, email, usuario, password_hash)
        )
        conn.commit()
        return True
    except IntegrityError as e:
        conn.close()
        # Analizar el error para dar un mensaje específico al usuario
        error_message = str(e)
        if 'email' in error_message:
            return 'email_exists'
        elif 'usuario' in error_message:
            return 'username_exists'
        elif 'telefono' in error_message:
            return 'phone_exists'
        else:
            # En caso de otros errores de integridad
            return 'integrity_error'
    except Exception as e:
        print(f"Error al registrar usuario: {e}")
        conn.close()
        return 'general_error'
    finally:
        # Solo cerramos la conexión si no se cerró en el IntegrityError
        if conn:
             conn.close()

def update_user_password(user_id, new_password_hash):
    """Actualiza el password_hash de un usuario por su ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            (new_password_hash, user_id)
        )
        conn.commit()
        return cursor.rowcount > 0 # Retorna True si se actualizó una fila
    except Exception as e:
        print(f"Error al actualizar la contraseña del usuario {user_id}: {e}")
        return False
    finally:
        conn.close()
