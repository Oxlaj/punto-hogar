import React from 'react';
export default function Custom500() {
  return (
    <div style={{padding:'4rem 1rem', textAlign:'center'}}>
      <h1 style={{fontSize:'2.5rem', fontWeight:700, marginBottom:'0.75rem'}}>500</h1>
      <p style={{color:'#555'}}>Error interno del servidor.</p>
      <p style={{marginTop:'1rem'}}><a href="/" style={{color:'#2563eb', textDecoration:'underline'}}>Volver al inicio</a></p>
    </div>
  );
}