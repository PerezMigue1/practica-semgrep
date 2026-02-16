/**
 * Módulo Login - VERSIÓN VULNERABLE para práctica SAST
 * Vulnerabilidad: comparación con contraseña hardcodeada en frontend (nunca hacer esto)
 */
import React, { useState } from 'react';

// VULNERABILIDAD: Contraseña de prueba hardcodeada en el cliente (detectada por SAST)
const DEFAULT_ADMIN_PASS = 'admin123';

const LoginVulnerable = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Comparación insegura con valor hardcodeado
    if (password === DEFAULT_ADMIN_PASS && email === 'admin@test.com') {
      window.location = '/dashboard';
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Contraseña"
      />
      <button type="submit">Iniciar sesión</button>
    </form>
  );
};

export default LoginVulnerable;
