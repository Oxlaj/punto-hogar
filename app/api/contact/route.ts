import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

interface ContactInput { name: string; email: string; message: string }

function validate(body: any) {
  const errors: Record<string,string> = {};
  function req(field: string, min = 2) {
    const v = body?.[field];
    if (typeof v !== 'string' || v.trim().length < min) errors[field] = `Requerido (min ${min})`;
    return v as string | undefined;
  }
  const name = req('name', 2);
  const email = req('email', 5);
  const message = req('message', 10);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Email inválido';
  if (Object.keys(errors).length) return { errors };
  return { data: { name: name!, email: email!, message: message! } };
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json().catch(()=>null);
    const { data, errors } = validate(json);
    if (errors) return new Response(JSON.stringify({ error: 'Validación', fields: errors }), { status: 422 });
    // Aquí podrías enviar email / guardar en DB / integrar con helpdesk.
    await new Promise(r => setTimeout(r, 400)); // Simula latencia
    return new Response(JSON.stringify({ ok: true }), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: 'No se pudo enviar', detalle: e.message }), { status: 500 });
  }
}
