'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LoaderCircle } from 'lucide-react';
import { DiretorShell } from '@/components/layout/DiretorShell';
import { Alert } from '@/components/ui/Alert';
import { sociosService } from '@/features/socios/services';
import { socioFormSchema } from '@/features/socios/schemas';
import { ApiError } from '@/lib/api-client';

// Tradução de prototipo/socio-form.html (modo criação).
export default function NovoSocioPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [memberSince, setMemberSince] = useState('');
  const [defaultPosition, setDefaultPosition] = useState<'GOLEIRO' | 'LINHA'>('LINHA');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const parsed = socioFormSchema.safeParse({ name, email, phone, memberSince, defaultPosition });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Dados inválidos.');
      return;
    }

    setSaving(true);
    try {
      const socio = await sociosService.create({
        name: parsed.data.name,
        email: parsed.data.email || undefined,
        phone: parsed.data.phone || undefined,
        defaultPosition: parsed.data.defaultPosition,
      });
      router.push(`/socios/${socio.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível salvar o sócio.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <DiretorShell eyebrow="Associados" title="Novo Sócio">
      <div className="mx-auto max-w-2xl">
        {error && <div className="mb-4"><Alert type="error" title="Não foi possível salvar" description={error} /></div>}

        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="font-display text-sm font-semibold text-slate-700">Dados pessoais</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-700">Nome completo</label>
              <input id="name" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
            </div>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">E-mail</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
            </div>
            <div>
              <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-slate-700">Telefone / WhatsApp</label>
              <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
            </div>
            <div>
              <label htmlFor="memberSince" className="mb-1.5 block text-sm font-medium text-slate-700">Sócio desde</label>
              <input id="memberSince" type="month" value={memberSince} onChange={(e) => setMemberSince(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
            </div>
            <div>
              <label htmlFor="position" className="mb-1.5 block text-sm font-medium text-slate-700">Posição padrão</label>
              <select id="position" value={defaultPosition} onChange={(e) => setDefaultPosition(e.target.value as 'GOLEIRO' | 'LINHA')} className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30">
                <option value="LINHA">Linha</option>
                <option value="GOLEIRO">Goleiro</option>
              </select>
            </div>
          </div>
        </form>

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link href="/socios" className="flex items-center justify-center rounded-full border border-slate-300 px-6 py-2.5 font-display text-sm font-semibold text-slate-600 hover:bg-slate-50">
            Cancelar
          </Link>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center justify-center gap-2 rounded-full bg-navy-600 px-6 py-2.5 font-display text-sm font-semibold text-white hover:bg-navy-700 disabled:opacity-70"
          >
            {saving && <LoaderCircle className="h-4 w-4 animate-spin" />}
            Cadastrar sócio
          </button>
        </div>
      </div>
    </DiretorShell>
  );
}
