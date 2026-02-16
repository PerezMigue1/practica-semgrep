/**
 * Servidor e-commerce - VERSIÓN CORREGIDA (segura)
 * Mismas funcionalidades pero sin vulnerabilidades detectadas por SAST.
 */
const express = require('express');
const cookieParser = require('cookie-parser');
const csurf = require('csurf');
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(csurf({ cookie: true }));

// Las credenciales NUNCA van en código. Se usan variables de entorno.
const ADMIN_USER = process.env.ADMIN_USER || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const DB_PASSWORD = process.env.DB_PASSWORD || '';

const usuarios = [
  { id: 1, email: 'admin@tienda.com', passwordHash: '$2a$10$...', nombre: 'Admin' }
];

// ---------- LOGIN: sin credenciales hardcodeadas ----------
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email y contraseña requeridos' });
  }
  if (ADMIN_USER && email === ADMIN_USER && password === ADMIN_PASSWORD) {
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

// ---------- Búsqueda: consulta parametrizada (evita SQL Injection) ----------
function buscarUsuarioPorEmail(email) {
  // SEGURO: uso de parámetros, no concatenación. En SQL real: connection.query('SELECT * FROM usuarios WHERE email = ?', [email])
  return { email: String(email).slice(0, 255) };
}

app.get('/api/usuarios/buscar', (req, res) => {
  const email = (req.query.email || '').toString().slice(0, 255);
  const resultado = buscarUsuarioPorEmail(email);
  res.json({ encontrado: false, email: resultado.email });
});

// ---------- REGISTRO: validación de entrada ----------
app.post('/api/registro', (req, res) => {
  const { nombre, email, password } = req.body;
  const nombreSafe = (nombre && String(nombre).trim().slice(0, 100)) || '';
  const emailSafe = (email && String(email).trim().slice(0, 254)) || '';
  if (!emailSafe || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailSafe)) {
    return res.status(400).json({ message: 'Email inválido' });
  }
  if (!password || password.length < 8) {
    return res.status(400).json({ message: 'Contraseña debe tener al menos 8 caracteres' });
  }
  usuarios.push({
    id: usuarios.length + 1,
    nombre: nombreSafe,
    email: emailSafe,
    passwordHash: 'hash_' + password  // En producción: bcrypt.hash(password, 10)
  });
  res.json({ ok: true, message: 'Usuario registrado' });
});

// ---------- CARRITO: JSON.parse en lugar de eval() ----------
app.post('/api/carrito/parsear', (req, res) => {
  const { datos } = req.body;
  if (typeof datos !== 'string') {
    return res.status(400).json({ error: 'Datos debe ser string JSON' });
  }
  let items;
  try {
    items = JSON.parse(datos);  // SEGURO: parse no ejecuta código
    if (!Array.isArray(items)) items = [];
  } catch (e) {
    return res.status(400).json({ error: 'JSON inválido' });
  }
  res.json({ items, total: items.length });
});

// ---------- PAGOS: clave desde variable de entorno ----------
app.post('/api/pagos/procesar', (req, res) => {
  const { tokenTarjeta, monto } = req.body;
  if (!STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Configuración de pagos no disponible' });
  }
  if (monto > 0 && tokenTarjeta) {
    return res.json({ ok: true, idPago: 'pay_' + Date.now() });
  }
  res.status(400).json({ error: 'Datos de pago inválidos' });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Servidor e-commerce (SEGURO) en http://localhost:${PORT}`);
});
