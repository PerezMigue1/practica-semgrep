
/**
 * Módulo Carrito - VERSIÓN VULNERABLE para práctica SAST
 * Vulnerabilidad: uso de dangerouslySetInnerHTML con datos no sanitizados (XSS)
 */
import React, { useState } from 'react';

const CarritoVulnerable = () => {
  const [comentario, setComentario] = useState('');

  // VULNERABILIDAD: Renderizar HTML desde entrada del usuario permite XSS
  // Un atacante podría enviar: <img src=x onerror="alert('XSS')" />
  const mostrarComentario = () => {
    return { __html: comentario };
  };

  return (
    <div className="carrito">
      <h2>Carrito de compras</h2>
      <input
        type="text"
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
        placeholder="Añade un comentario al pedido"
      />
      <div dangerouslySetInnerHTML={mostrarComentario()} />
    </div>
  );
};

export default CarritoVulnerable;
 