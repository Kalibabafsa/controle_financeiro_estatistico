'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';
import { DiretorShell } from '@/components/layout/DiretorShell';
import { babaService } from '@/features/baba/services';

// Atalho do menu (como no protótipo) — redireciona para os eventos do baba mais recente.
export default function GolsCartoesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    babaService.listBabas(1).then((r) => {
      if (r.data.length > 0) router.replace(`/baba-dia/${r.data[0].id}/eventos`);
      else router.replace('/baba-dia');
    });
  }, [router]);

  return (
    <DiretorShell eyebrow="Futebol" title="Gols e Cartões">
      <div className="flex justify-center py-16"><LoaderCircle className="h-8 w-8 animate-spin text-navy-600" /></div>
    </DiretorShell>
  );
}
