# Práctica: Aplicación de pruebas SAST en módulos críticos de un sistema e-commerce

## Objetivo

Detectar y corregir vulnerabilidades en el código de una tienda en línea utilizando una herramienta SAST (Static Application Security Testing), demostrando **concepto**, **alcance**, **momento de aplicación** y **módulos** donde se usa.

---

## ¿Qué es SAST?

- **SAST** = análisis estático del código fuente (sin ejecutar la aplicación).
- Se aplica en **fase de desarrollo** (antes de producción).
- Detecta patrones de código inseguros: inyección SQL, `eval()`, secretos hardcodeados, falta de validación, XSS, etc.

---

## Estructura de la práctica

```
practica-sast/
├── backend/           # API simulada (Node/Express)
│   ├── server.js      # VERSIÓN VULNERABLE (aquí se introducen fallos)
│   └── server-seguro.js   # VERSIÓN CORREGIDA
├── frontend/          # Componentes React vulnerables (opcional)
│   ├── LoginVulnerable.js
│   └── CarritoVulnerable.js
├── .semgrep.yml       # Configuración opcional Semgrep
└── README-PRACTICA-SAST.md  # Este archivo
```

---

## Módulos simulados y vulnerabilidades intencionales

| Módulo              | Archivo / función           | Vulnerabilidad introducida        | Riesgo en e-commerce                    |
|---------------------|-----------------------------|-----------------------------------|----------------------------------------|
| **Login**           | `server.js` (credenciales)  | Contraseña hardcodeada            | Acceso no autorizado, robo de datos     |
| **Pagos**           | `server.js` (STRIPE_SECRET) | API key / secreto en código      | Fraude, robo de datos de tarjetas       |
| **Búsqueda usuario**| `buscarUsuarioPorEmail()`   | SQL Injection (concatenación)     | Extracción de BD, borrado de datos      |
| **Registro**        | `POST /api/registro`        | Falta validación de entrada      | Inyección, datos corruptos              |
| **Carrito**         | `POST /api/carrito/parsear` | Uso de `eval()`                  | Ejecución de código remoto (RCE)        |
| **Frontend Login**  | `LoginVulnerable.js`        | Contraseña en cliente             | Bypass de autenticación                 |
| **Frontend Carrito**| `CarritoVulnerable.js`      | `dangerouslySetInnerHTML`         | XSS, robo de sesiones                   |

---

## Pasos de la práctica

### 1. Instalar Semgrep

```bash
# Opción A: pip (recomendado)
pip install semgrep

# Opción B: npm (en el proyecto)
npm install -g semgrep
```

Verificar:

```bash
semgrep --version
```

### 2. Analizar el código vulnerable

Desde la raíz de esta carpeta **practica-sast**:

**Solo en tu PC (resultados en terminal):**
```bash
cd practica-sast
semgrep scan --config auto .
```

**Con Semgrep Cloud (resultados en la web):** si debes usar el proyecto de la institución (p. ej. https://semgrep.dev/orgs/20230091_uthh_edu_mx/projects/scanning):
```bash
semgrep login    # solo la primera vez; abre el navegador para activar
semgrep ci       # escanea y sube los hallazgos al dashboard
```
Los resultados se verán en el dashboard de Semgrep Cloud.

### 3. Interpretar resultados

Semgrep mostrará algo similar a:

- **Archivo y línea** donde está el hallazgo.
- **Regla** que lo detectó (ej. `javascript.lang.security.audit.dangerous-eval`, `generic.secrets.security.detected-generic-secret`).
- **Severidad** (ERROR, WARNING).
- **Descripción** del riesgo.

Para cada hallazgo, documentar:

1. Qué vulnerabilidad es.
2. En qué línea y módulo (Login, Carrito, Pagos, etc.).
3. Qué riesgo representa en un e-commerce (robo de datos, fraude, etc.).
4. Qué impacto tendría si se explotara.

### 4. Corregir el código

- Las correcciones están ya implementadas en:
  - **Backend:** `backend/server-seguro.js`
  - **Frontend:** se puede sustituir `eval()` por `JSON.parse()`, eliminar secretos, validar entradas y evitar `dangerouslySetInnerHTML` con datos de usuario.
- Cambios principales:
  - **Secretos:** usar variables de entorno (`process.env.ADMIN_PASSWORD`, etc.).
  - **SQL Injection:** no concatenar entrada del usuario; usar consultas parametrizadas o ORM.
  - **eval():** reemplazar por `JSON.parse()` para datos JSON.
  - **Validación:** validar y limitar longitud de email, nombre, contraseña.
  - **XSS:** no renderizar HTML desde entrada del usuario; usar texto escapado o librerías seguras.

### 5. Volver a analizar

Después de aplicar las correcciones (o al analizar solo la versión segura):

```bash
semgrep scan --config auto . --exclude node_modules
```

Comprobar que los hallazgos asociados a las vulnerabilidades introducidas **ya no aparecen** o se reducen.

---

### Nota para Windows

Si aparece `UnicodeEncodeError: 'charmap' codec can't encode character` al usar Semgrep:

- Ejecutar en PowerShell: `$env:PYTHONUTF8=1` y luego `semgrep scan ...`
- O usar la consola desde una ruta corta (ej. `C:\practica-sast`) copiando solo esta carpeta
- O ejecutar Semgrep desde WSL (Linux) o desde un entorno Linux/Mac

Mientras tanto puedes documentar los **resultados esperados** (ver siguiente sección) para la entrega.

---

## Resultados esperados del primer escaneo (código vulnerable)

Al analizar `backend/server.js` y `frontend/*.js` con `semgrep scan --config auto .`, Semgrep debería reportar hallazgos como los siguientes. Úsalos para documentar la práctica si en tu entorno el comando falla por codificación.

| Archivo | Línea aprox. | Regla / tipo | Vulnerabilidad |
|---------|----------------|--------------|----------------|
| `backend/server.js` | ADMIN_PASSWORD = '...' | Secretos / hardcoded | Contraseña en código |
| `backend/server.js` | STRIPE_SECRET_KEY = '...' | Secretos | API key en código |
| `backend/server.js` | DB_PASSWORD = '...' | Secretos | Contraseña BD en código |
| `backend/server.js` | `eval('(' + datos + ')')` | dangerous-eval | Ejecución de código arbitrario (RCE) |
| `backend/server.js` | `"SELECT ... '" + email + "'"` | SQL injection / concatenation | Inyección SQL |
| `frontend/LoginVulnerable.js` | DEFAULT_ADMIN_PASS = '...' | Secretos | Contraseña en cliente |
| `frontend/CarritoVulnerable.js` | dangerouslySetInnerHTML | XSS / React | Cross-Site Scripting |

Tras corregir con `server-seguro.js` y eliminar/reemplazar los fragmentos vulnerables, un nuevo escaneo debería **no** mostrar estos hallazgos (o solo menos).

---

## Resumen: qué demuestra la práctica

| Punto                 | Cómo se demuestra                                              |
|-----------------------|----------------------------------------------------------------|
| **Qué es SAST**       | Análisis estático del código con Semgrep                      |
| **Cuándo se aplica**  | En desarrollo, antes de desplegar a producción                |
| **Qué módulos analizar** | Login, Registro, Carrito, Pagos (módulos críticos)         |
| **Qué fallos detecta**| SQLi, eval, secretos, falta de validación, XSS                |
| **Mejora de seguridad** | Correcciones en código y nuevo escaneo sin (o con menos) hallazgos |

---

## Título sugerido para entregar

**Aplicación de pruebas SAST en módulos críticos de un sistema e-commerce**

Resumen en una frase: *"Detectar y corregir vulnerabilidades en el código de una tienda en línea utilizando una herramienta SAST (Semgrep)."*
