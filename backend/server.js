/**
 * Servidor e-commerce - VERSIÓN VULNERABLE para práctica SAST
 * Contiene vulnerabilidades intencionales: secretos hardcodeados, SQL injection,
 * eval(), falta de validación. Usar solo con fines educativos.
 */
const express = require('express');
const app = express();
app.use(express.json());

// VULNERABILIDAD: Credenciales y secretos hardcodeados (detectados por SAST)
const ADMIN_USER = 'admin@tienda.com';
const ADMIN_PASSWORD = 'Admin123!';
const STRIPE_SECRET_KEY = 'sk_live_abc123xyz789secreto';
const DB_PASSWORD = 'root123';

const usuarios = [
    { id: 1, email: 'admin@tienda.com', passwordHash: '$2a$10$...', nombre: 'Admin' }
];

// ---------- LOGIN (usa credenciales hardcodeadas) ----------
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email y contraseña requeridos' });
    }
    if (email === ADMIN_USER && password === ADMIN_PASSWORD) {
        return res.json({ token: 'fake-jwt', usuario: { email, nombre: 'Admin' } });
    }
    const user = usuarios.find(u => u.email === email);
    if (user && (await bcryptCompare(password, user.passwordHash))) {
        return res.json({ token: 'fake-jwt', usuario: { email: user.email, nombre: user.nombre } });
    }
    res.status(401).json({ message: 'Credenciales inválidas' });
});

function bcryptCompare(plain, hash) {
    return Promise.resolve(true); // En producción: bcrypt.compare(plain, hash)
}

// ---------- Búsqueda: VULNERABILIDAD SQL Injection (concatenación) ----------
function buscarUsuarioPorEmail(email) {
    const querySimulada = "SELECT * FROM usuarios WHERE email = '" + email + "'";
    // En un driver real esto ejecutaría la query; aquí solo simulamos el patrón vulnerable
    return { email: email, query: querySimulada };
}

app.get('/api/usuarios/buscar', (req, res) => {
    const email = req.query.email || '';
    const resultado = buscarUsuarioPorEmail(email);
    res.json({ encontrado: false, email: resultado.email });
});

// ---------- REGISTRO: VULNERABILIDAD falta de validación de entrada ----------
app.post('/api/registro', (req, res) => {
    const { nombre, email, password } = req.body;
    usuarios.push({
        id: usuarios.length + 1,
        nombre: nombre,
        email: email,
        passwordHash: 'hash_' + password
    });
    res.json({ ok: true, message: 'Usuario registrado' });
});

// ---------- CARRITO: VULNERABILIDAD uso de eval() (RCE) ----------
app.post('/api/carrito/parsear', (req, res) => {
    const { datos } = req.body;
    let items;
    items = eval('(' + datos + ')');
    if (!Array.isArray(items)) items = [];
    res.json({ items, total: items.length });
});

// ---------- PAGOS (usa clave hardcodeada) ----------
app.post('/api/pagos/procesar', (req, res) => {
    const { tokenTarjeta, monto } = req.body;
    if (monto > 0 && tokenTarjeta && STRIPE_SECRET_KEY) {
        return res.json({ ok: true, idPago: 'pay_' + Date.now() });
    }
    res.status(400).json({ error: 'Datos de pago inválidos' });
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Servidor e-commerce (VULNERABLE) en http://localhost:${PORT}`);
});
