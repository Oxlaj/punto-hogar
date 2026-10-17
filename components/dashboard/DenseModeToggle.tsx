"use client";
import { useEffect, useState } from 'react';

// Toggle that applies/removes a root class so charts can react without restructuring server components.
export function DenseModeToggle() {
  const [dense, setDense] = useState(false);
  useEffect(()=> {
    const handler = () => setDense(document.documentElement.classList.contains('dense-mode'));
    handler();
    window.addEventListener('dense-toggle', handler);
    return ()=> window.removeEventListener('dense-toggle', handler);
  }, []);
  function toggle() {
    const root = document.documentElement;
    root.classList.toggle('dense-mode');
    window.dispatchEvent(new Event('dense-toggle'));
  }
  return (
    <button onClick={toggle} className="px-2 py-1 text-xs border rounded hover:bg-neutral-50 transition" title="Alternar compacidad visual">
      {dense ? 'Modo normal' : 'Modo denso'}
    </button>
  );
}