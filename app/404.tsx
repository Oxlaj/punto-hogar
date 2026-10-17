export default function NotFound404() {
  return (
    <div className="p-16 text-center space-y-4">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-neutral-600">Página no encontrada.</p>
      <a href="/" className="text-sm text-brand underline">Volver al inicio</a>
    </div>
  );
}