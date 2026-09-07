'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import { Copy, Clock, LoaderCircle, AlertTriangle, CheckCircle } from 'lucide-react';
import { SocioShell } from '@/components/layout/SocioShell';
import { financeiroService } from '@/features/financeiro/services';
import type { SituacaoResponse } from '@/features/financeiro/types';
import { formatBRL, formatDateBR, formatMonthLabel } from '@/lib/format';

// Tradução 1:1 de prototipo/pagar-mensalidade.html. O QR Code é gerado no
// client a partir do payload EMV retornado pelo backend (ADR-05) — nunca de
// um serviço de terceiros como no protótipo (api.qrserver.com).
//
// QA (qa-report.md 🟢 #6): a tela agora também consulta /me/situacao e mostra o 2º estado
// do protótipo ("pagamento confirmado") quando a mensalidade do mês corrente já foi
// registrada pelo diretor, em vez de sempre exibir o QR Code mesmo para quem já está em dia.
export default function PagarMensalidadePage() {
  const [situacao, setSituacao] = useState<SituacaoResponse | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [pixKey, setPixKey] = useState<string | null>(null);
  const [emvPayload, setEmvPayload] = useState<string | null>(null);
  const [copyLabel, setCopyLabel] = useState('Copiar');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const situacaoResult = await financeiroService.getSituacao();
        setSituacao(situacaoResult);

        if (situacaoResult.emDia && situacaoResult.payment) {
          return; // já confirmado — não precisa carregar o Pix
        }

        const result = await financeiroService.getPixPayload();
        setPixKey(result.pixKey);
        setEmvPayload(result.emvPayload);
        const dataUrl = await QRCode.toDataURL(result.emvPayload, { width: 220, margin: 1 });
        setQrDataUrl(dataUrl);
      } catch {
        setError('Não foi possível carregar os dados do Pix. Tente novamente mais tarde.');
      }
    })();
  }, []);

  async function handleCopy() {
    if (!emvPayload) return;
    try {
      await navigator.clipboard.writeText(emvPayload);
    } catch {
      // navegador sem suporte a clipboard — sem ação adicional necessária aqui
    }
    setCopyLabel('Copiado!');
    setTimeout(() => setCopyLabel('Copiar'), 2000);
  }

  const jaConfirmado = situacao?.emDia && situacao.payment;

  return (
    <SocioShell eyebrow="Financeiro" title="Pagar Mensalidade (Pix)">
      <div className="mx-auto max-w-md">
        {jaConfirmado && situacao.payment ? (
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 text-teal-600">
              <CheckCircle className="h-8 w-8" />
            </div>
            <h2 className="mt-4 font-display text-xl font-bold text-navy-600">Pagamento confirmado!</h2>
            <p className="mt-2 text-sm text-slate-500">
              Sua mensalidade de <span className="font-medium text-slate-700">{formatMonthLabel(situacao.referenceMonth)}</span> no
              valor de <span className="font-medium text-slate-700">{formatBRL(situacao.payment.amount)}</span> foi confirmada em{' '}
              {formatDateBR(situacao.payment.paidAt)} pelo diretor.
            </p>
            <Link href="/inicio" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-navy-600 py-3 font-display text-sm font-semibold text-white hover:bg-navy-700">
              Voltar para o início
            </Link>
          </div>
        ) : (
          <>
            <div className="rounded-2xl bg-gradient-to-br from-navy-600 to-teal-600 p-5 text-center text-white shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-50/90">
                Mensalidade de {formatMonthLabel(new Date())}
              </p>
            </div>

            {error ? (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            ) : (
              <>
                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
                  <p className="font-display text-sm font-semibold text-slate-700">Escaneie com o app do seu banco</p>
                  <div className="mx-auto mt-4 flex h-56 w-56 items-center justify-center rounded-2xl border border-slate-200 bg-white p-2">
                    {qrDataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={qrDataUrl} alt="QR Code Pix para pagamento da mensalidade" className="h-full w-full" />
                    ) : (
                      <LoaderCircle className="h-8 w-8 animate-spin text-navy-600" />
                    )}
                  </div>
                  {pixKey && <p className="mt-3 text-xs text-slate-400">Chave Pix: {pixKey}</p>}
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="font-display text-sm font-semibold text-slate-700">Ou use o Pix copia-e-cola</p>
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={emvPayload ?? ''}
                      className="w-full truncate rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-xs text-slate-600"
                    />
                    <button
                      onClick={handleCopy}
                      className="flex flex-shrink-0 items-center gap-1.5 rounded-xl bg-navy-600 px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-navy-700"
                    >
                      <Copy className="h-4 w-4" />
                      <span>{copyLabel}</span>
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-sun-100 bg-sun-50 px-4 py-3.5 text-sm text-sun-500">
                  <Clock className="mt-0.5 h-5 w-5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-700">Aguardando confirmação</p>
                    <p className="mt-0.5 text-slate-500">
                      Depois de pagar, o diretor confirma manualmente o recebimento — isso pode levar algumas horas. Seu status
                      será atualizado automaticamente aqui assim que confirmado.
                    </p>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </SocioShell>
  );
}
