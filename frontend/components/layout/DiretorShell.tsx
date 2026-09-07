'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, CreditCard, Banknote, Receipt, Tags, UserX, FileText, Users, UserPlus,
  Calendar, Shuffle, ClipboardList, ShieldAlert, Settings, LogOut, Menu, X, Bell,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { initials } from '@/lib/format';

const NAV_SECTIONS = [
  {
    label: 'Visão geral',
    items: [{ href: '/dashboard', label: 'Dashboard Financeiro', icon: LayoutDashboard }],
  },
  {
    label: 'Financeiro',
    items: [
      { href: '/lancamento-mensalidade', label: 'Lançamento de Mensalidades', icon: CreditCard },
      { href: '/lancamento-convidado', label: 'Pagamento de Convidado', icon: Banknote },
      { href: '/despesas', label: 'Gestão de Despesas', icon: Receipt },
      { href: '/categorias', label: 'Gestão de Categorias', icon: Tags },
      { href: '/inadimplencia', label: 'Gestão de Inadimplência', icon: UserX },
      { href: '/prestacao-contas-geracao', label: 'Prestação de Contas', icon: FileText },
    ],
  },
  {
    label: 'Associados',
    items: [
      { href: '/socios', label: 'Sócios', icon: Users },
      { href: '/convidados', label: 'Convidados', icon: UserPlus },
    ],
  },
  {
    label: 'Futebol',
    items: [
      { href: '/baba-dia', label: 'Baba do Dia', icon: Calendar },
      { href: '/sorteio-times', label: 'Sorteio de Times', icon: Shuffle },
      { href: '/gols-cartoes', label: 'Gols e Cartões', icon: ClipboardList },
      { href: '/suspensoes', label: 'Suspensões Ativas', icon: ShieldAlert },
    ],
  },
  {
    label: 'Configurações',
    items: [{ href: '/configuracoes', label: 'Configurações Gerais', icon: Settings }],
  },
];

interface DiretorShellProps {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}

// Shell desktop-first do diretor — tradução 1:1 do padrão em prototipo/dashboard-financeiro.html
// (sidebar fixa agrupada por seção + drawer/topbar mobile).
export function DiretorShell({ eyebrow, title, children }: DiretorShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const name = user?.socio?.name ?? 'Diretor';

  return (
    <div className="flex min-h-screen lg:flex-row">
      <aside className="hidden lg:flex lg:w-72 lg:flex-shrink-0 lg:flex-col lg:overflow-y-auto lg:border-r lg:border-slate-200 lg:bg-white lg:px-5 lg:py-6">
        <div className="flex items-center gap-2 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-600 text-lg">⚽</div>
          <div>
            <p className="font-display text-sm font-extrabold text-navy-600">KALI BABA</p>
            <p className="text-[11px] uppercase tracking-wide text-slate-400">Painel do diretor</p>
          </div>
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-5">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{section.label}</p>
              <div className="flex flex-col gap-1">
                {section.items.map((item) => {
                  const active = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                        active ? 'bg-navy-50 font-semibold text-navy-600' : 'text-slate-500 hover:bg-slate-50 hover:text-navy-600'
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <button onClick={() => logout()} className="mt-6 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-red-50 hover:text-red-600">
          <LogOut className="h-5 w-5" />
          Sair
        </button>
      </aside>

      <div className="flex-1">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
          <button aria-label="Abrir menu" onClick={() => setDrawerOpen(true)} className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-1.5">
            <span className="text-lg">⚽</span>
            <span className="font-display text-sm font-bold text-navy-600">Kali Baba</span>
          </div>
          <button aria-label="Notificações" className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-sun-400" />
          </button>
        </header>

        <header className="hidden items-center justify-between border-b border-slate-200 bg-white px-8 py-5 lg:flex">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{eyebrow}</p>
            <h1 className="font-display text-xl font-bold text-navy-600">{title}</h1>
          </div>
          <div className="flex items-center gap-4">
            <button aria-label="Notificações" className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-sun-400" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-600 font-display text-xs font-bold text-white">
                {initials(name)}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold leading-tight text-slate-800">{name}</p>
                <p className="text-[11px] leading-tight text-slate-400">Diretor</p>
              </div>
            </div>
          </div>
        </header>

        {drawerOpen && <div className="fixed inset-0 z-50 bg-slate-900/40 lg:hidden" onClick={() => setDrawerOpen(false)} />}
        <aside
          className={`fixed inset-y-0 left-0 z-[55] w-72 overflow-y-auto bg-white shadow-xl transition-transform duration-200 ease-out lg:hidden ${
            drawerOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy-600 text-base">⚽</div>
              <p className="font-display text-sm font-extrabold text-navy-600">KALI BABA</p>
            </div>
            <button aria-label="Fechar menu" onClick={() => setDrawerOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100">
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex flex-col gap-4 px-3 py-4">
            {NAV_SECTIONS.map((section) => (
              <div key={section.label}>
                <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{section.label}</p>
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className={`block rounded-xl px-3 py-2.5 text-sm font-medium ${
                      pathname.startsWith(item.href) ? 'bg-navy-50 font-semibold text-navy-600' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            ))}
            <div className="mt-2 border-t border-slate-100 pt-3">
              <button onClick={() => logout()} className="block w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-500 hover:bg-red-50">
                Sair
              </button>
            </div>
          </nav>
        </aside>

        <main className="mx-auto max-w-7xl px-4 py-5 lg:px-8 lg:py-8">
          <div className="mb-5 lg:hidden">
            <h1 className="font-display text-xl font-bold text-slate-800">{title}</h1>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
