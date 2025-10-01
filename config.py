# config.py
import sqlite3
from werkzeug.security import generate_password_hash

# =======================================================
# CONFIGURACIÓN DE LA BASE DE DATOS Y LÓGICA DE USUARIOS
# =======================================================

DATABASE = 'db.db'

def get_db_connection():
    """Establece y retorna la conexión a la base de datos SQLite."""
    conn = sqlite3.connect(DATABASE)
    # Configura la conexión para devolver filas como diccionarios
    conn.row_factory = sqlite3.Row 
    return conn

def init_db():
    """Inicializa la base de datos y crea la tabla de usuarios si no existe."""
    conn = get_db_connection()
    try:
        conn.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                primer_apellido TEXT NOT NULL,
                segundo_apellido TEXT,
                telefono TEXT NOT NULL UNIQUE,
                email TEXT NOT NULL UNIQUE,
                usuario TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL
            );
        ''')
        print("Tabla 'users' verificada o creada exitosamente.")
        
        # Opcional: Insertar un usuario de prueba si la base de datos está vacía
        cursor = conn.execute("SELECT COUNT(*) FROM users")
        if cursor.fetchone()[0] == 0:
            # Hash de la contraseña "password123"
            test_password = generate_password_hash("password123", method='pbkdf2:sha256')
            conn.execute(
                "INSERT INTO users (nombre, primer_apellido, segundo_apellido, telefono, email, usuario, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?)",
                ('Admin', 'User', '', '12345678', 'admin@app.com', 'admin', test_password)
            )
            print("Usuario de prueba (admin@app.com/password123) insertado.")
        
        conn.commit()
    except Exception as e:
        print(f"Error al inicializar la base de datos: {e}")
    finally:
        conn.close()

def get_user_by_email_or_username(identifier):
    """Busca un usuario por email o nombre de usuario."""
    conn = get_db_connection()
    user = conn.execute(
        "SELECT * FROM users WHERE email = ? OR usuario = ?", 
        (identifier, identifier)
    ).fetchone()
    conn.close()
    return user

def register_user(nombre, primer_apellido, segundo_apellido, telefono, email, usuario, password):
    """Registra un nuevo usuario en la base de datos."""
    conn = get_db_connection()
    try:
        # La contraseña se hashea antes de guardarse
        password_hash = generate_password_hash(password, method='pbkdf2:sha256')
        
        conn.execute(
            "INSERT INTO users (nombre, primer_apellido, segundo_apellido, telefono, email, usuario, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (nombre, primer_apellido, segundo_apellido, telefono, email, usuario, password_hash)
        )
        conn.commit()
        return True
    except sqlite3.IntegrityError as e:
        # Esto captura errores de UNIQUE constraint (email, usuario, telefono ya existen)
        if 'UNIQUE constraint failed: users.email' in str(e):
            return 'email_exists'
        if 'UNIQUE constraint failed: users.usuario' in str(e):
            return 'username_exists'
        if 'UNIQUE constraint failed: users.telefono' in str(e):
            return 'phone_exists'
        return 'unknown_error'
    finally:
        conn.close()

# Asegura que la base de datos se inicialice al importar (al menos una vez)
init_db()
