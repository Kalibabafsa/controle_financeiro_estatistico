'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Lock, ShieldCheck, LoaderCircle } from 'lucide-react';
import { DiretorShell } from '@/components/layout/DiretorShell';
import { Alert } from '@/components/ui/Alert';
import { configService } from '@/features/config/services';
import { financeiroService } from '@/features/financeiro/services';
import type { SystemConfig } from '@/features/config/types';
import { ApiError } from '@/lib/api-client';

// Tradução de prototipo/configuracoes.html (RF36/RF37/ADR-05).
export default function ConfiguracoesPage() {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [defaultMonthlyFee, setDefaultMonthlyFee] = useState('');
  const [defaultGuestFee, setDefaultGuestFee] = useState('');
  const [currentSeason, setCurrentSeason] = useState(new Date().getFullYear());
  const [pixKey, setPixKey] = useState('');
  const [pixBeneficiaryName, setPixBeneficiaryName] = useState('');
  const [pixBankName, setPixBankName] = useState('');
  const [pixCity, setPixCity] = useState('');
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    configService.get().then((c) => {
      setConfig(c);
      setDefaultMonthlyFee(c.defaultMonthlyFee);
      setDefaultGuestFee(c.defaultGuestFee);
      setCurrentSeason(c.currentSeason);
      setPixKey(c.pixKey ?? '');
      setPixBeneficiaryName(c.pixBeneficiaryName ?? '');
      setPixBankName(c.pixBankName ?? '');
      setPixCity(c.pixCity ?? '');
    });
  }, []);

  useEffect(() => {
    if (!config?.pixKey) return;
    financeiroService.getPixPayload().then((r) => QRCode.toDataURL(r.emvPayload, { width: 120 })).then(setQrPreview).catch(() => setQrPreview(null));
  }, [config]);

  function notifySuccess(message: string) {
    setSuccess(message);
    setError(null);
    setTimeout(() => setSuccess(null), 3000);
  }

  async function handleSaveValores() {
    setSaving('valores');
    try {
      await configService.updateValoresPadrao({
        defaultMonthlyFee: Number(defaultMonthlyFee.replace(',', '.')),
        defaultGuestFee: Number(defaultGuestFee.replace(',', '.')),
      });
      notifySuccess('Valores padrão salvos com sucesso.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível salvar os valores.');
    } finally {
      setSaving(null);
    }
  }

  async function handleSaveTemporada() {
    setSaving('temporada');
    try {
      await configService.updateTemporada({ currentSeason });
      notifySuccess('Temporada salva com sucesso.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível salvar a temporada.');
    } finally {
      setSaving(null);
    }
  }

  async function handleSavePix() {
    setSaving('pix');
    try {
      const updated = await configService.updatePix({ pixKey, pixBeneficiaryName, pixBankName, pixCity });
      setConfig(updated);
      notifySuccess('Dados do Pix salvos com sucesso.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível salvar os dados do Pix.');
    } finally {
      setSaving(null);
    }
  }

  if (!config) {
    return (
      <DiretorShell eyebrow="Configurações" title="Configurações Gerais">
        <div className="flex justify-center py-16"><LoaderCircle className="h-8 w-8 animate-spin text-navy-600" /></div>
      </DiretorShell>
    );
  }

  return (
    <DiretorShell eyebrow="Configurações" title="Configurações Gerais">
      <div className="mx-auto max-w-3xl">
        {success && <div className="mb-4"><Alert type="success" title={success} /></div>}
        {error && <div className="mb-4"><Alert type="error" title="Não foi possível salvar" description={error} /></div>}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="font-display text-sm font-semibold text-slate-700">Valores padrão</p>
          <p className="mt-1 text-xs text-slate-400">Usados como sugestão nos lançamentos — podem ser editados individualmente em cada pagamento.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="valor-mensalidade" className="mb-1.5 block text-sm font-medium text-slate-700">Mensalidade de sócio</label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm text-slate-400">R$</span>
                <input id="valor-mensalidade" type="text" value={defaultMonthlyFee} onChange={(e) => setDefaultMonthlyFee(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
              </div>
            </div>
            <div>
              <label htmlFor="valor-convidado" className="mb-1.5 block text-sm font-medium text-slate-700">Pagamento de convidado</label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm text-slate-400">R$</span>
                <input id="valor-convidado" type="text" value={defaultGuestFee} onChange={(e) => setDefaultGuestFee(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
              </div>
            </div>
          </div>
          <button onClick={handleSaveValores} disabled={saving === 'valores'} className="mt-4 rounded-full bg-navy-600 px-5 py-2 text-sm font-semibold text-white hover:bg-navy-700 disabled:opacity-70">
            {saving === 'valores' ? 'Salvando...' : 'Salvar valores'}
          </button>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="font-display text-sm font-semibold text-slate-700">Temporada</p>
          <p className="mt-1 text-xs text-slate-400">Define o ano usado nos rankings de artilheiros, cartões e presença.</p>
          <div className="mt-4 max-w-xs">
            <label htmlFor="temporada" className="mb-1.5 block text-sm font-medium text-slate-700">Temporada atual</label>
            <select id="temporada" value={currentSeason} onChange={(e) => setCurrentSeason(Number(e.target.value))} className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30">
              {[currentSeason - 1, currentSeason, currentSeason + 1].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <button onClick={handleSaveTemporada} disabled={saving === 'temporada'} className="mt-4 rounded-full bg-navy-600 px-5 py-2 text-sm font-semibold text-white hover:bg-navy-700 disabled:opacity-70">
            {saving === 'temporada' ? 'Salvando...' : 'Salvar temporada'}
          </button>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="font-display text-sm font-semibold text-slate-700">Dados do Pix</p>
          <p className="mt-1 text-xs text-slate-400">Usados para gerar o QR Code exibido aos sócios na tela &quot;Pagar Mensalidade&quot;.</p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="chave-pix" className="mb-1.5 block text-sm font-medium text-slate-700">Chave Pix</label>
              <input id="chave-pix" type="text" value={pixKey} onChange={(e) => setPixKey(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
            </div>
            <div>
              <label htmlFor="beneficiario" className="mb-1.5 block text-sm font-medium text-slate-700">Nome do beneficiário</label>
              <input id="beneficiario" type="text" value={pixBeneficiaryName} onChange={(e) => setPixBeneficiaryName(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
            </div>
            <div>
              <label htmlFor="banco" className="mb-1.5 block text-sm font-medium text-slate-700">Banco</label>
              <input id="banco" type="text" value={pixBankName} onChange={(e) => setPixBankName(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
            </div>
            <div>
              <label htmlFor="cidade" className="mb-1.5 block text-sm font-medium text-slate-700">Cidade</label>
              <input id="cidade" type="text" value={pixCity} onChange={(e) => setPixCity(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
            </div>
          </div>

          {qrPreview && (
            <div className="mt-4 flex flex-col items-center gap-3 rounded-xl bg-slate-50 p-4 sm:flex-row">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrPreview} alt="Pré-visualização do QR Code Pix" className="h-24 w-24 rounded-lg border border-slate-200 bg-white p-1" />
              <div>
                <p className="text-sm font-medium text-slate-700">Pré-visualização do QR Code</p>
                <p className="text-xs text-slate-400">É este QR Code que os sócios verão na tela de pagamento.</p>
              </div>
            </div>
          )}

          <button onClick={handleSavePix} disabled={saving === 'pix'} className="mt-4 rounded-full bg-navy-600 px-5 py-2 text-sm font-semibold text-white hover:bg-navy-700 disabled:opacity-70">
            {saving === 'pix' ? 'Salvando...' : 'Salvar dados do Pix'}
          </button>
        </div>

        <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-5">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-slate-400" />
            <p className="font-display text-sm font-semibold text-slate-500">Integração automática via API do Banco Inter</p>
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-500">Em breve</span>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Confirmação automática de pagamento Pix (webhook), sujeita a viabilidade técnica com conta PJ do Banco Inter (ADR-05).
            Enquanto isso, o diretor confirma pagamentos manualmente.
          </p>
          <div className="mt-4 grid gap-4 opacity-60 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-500">Client ID</label>
              <input type="text" disabled placeholder="Disponível quando a integração for habilitada" className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm text-slate-400 placeholder:text-slate-400" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-500">Client Secret</label>
              <input type="password" disabled placeholder="••••••••" className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm text-slate-400" />
            </div>
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            Credenciais nunca são armazenadas no navegador — ficam apenas em variáveis de ambiente seguras no backend.
          </p>
        </div>
      </div>
    </DiretorShell>
  );
}
