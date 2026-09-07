'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, Wallet, CreditCard, Calendar, Trophy, FileText, User, LogOut, Menu, X, Bell,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { initials } from '@/lib/format';

const NAV_ITEMS = [
  { href: '/inicio', label: 'Início', icon: Home },
  { href: '/financeiro', label: 'Minha Situação Financeira', icon: Wallet },
  { href: '/pagar', label: 'Pagar Mensalidade', icon: CreditCard },
  { href: '/proximo-baba', label: 'Próximo Baba', icon: Calendar },
  { href: '/rankings', label: 'Rankings / Estatísticas', icon: Trophy },
  { href: '/prestacao-contas', label: 'Prestação de Contas', icon: FileText },
  { href: '/perfil', label: 'Meu Perfil', icon: User },
];

const BOTTOM_NAV_ITEMS = [
  { href: '/inicio', label: 'Início', icon: Home },
  { href: '/financeiro', label: 'Financeiro', icon: Wallet },
  { href: '/proximo-baba', label: 'Baba', icon: Calendar },
  { href: '/rankings', label: 'Rankings', icon: Trophy },
  { href: '/perfil', label: 'Perfil', icon: User },
];

interface SocioShellProps {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}

// Shell mobile-first do sócio — tradução 1:1 do padrão presente em prototipo/home-socio.html
// e demais telas do sócio (sidebar desktop + drawer + bottom nav mobile).
export function SocioShell({ eyebrow, title, children }: SocioShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const name = user?.socio?.name ?? 'Sócio';

  return (
    <div className="flex min-h-screen lg:flex-row">
      <aside className="hidden lg:flex lg:w-64 lg:flex-shrink-0 lg:flex-col lg:border-r lg:border-slate-200 lg:bg-white lg:px-5 lg:py-6">
        <div className="flex items-center gap-2 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-600 text-lg">⚽</div>
          <div>
            <p className="font-display text-sm font-extrabold text-navy-600">KALI BABA</p>
            <p className="text-[11px] uppercase tracking-wide text-slate-400">Área do sócio</p>
          </div>
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
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
        </nav>

        <button
          onClick={() => logout()}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-5 w-5" />
          Sair
        </button>
      </aside>

      <div className="flex-1 pb-24 lg:pb-0">
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
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-600 font-display text-xs font-bold text-white">
              {initials(name)}
            </div>
          </div>
        </header>

        {drawerOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 lg:hidden" onClick={() => setDrawerOpen(false)} />
        )}
        <aside
          className={`fixed inset-y-0 left-0 z-[55] w-72 bg-white shadow-xl transition-transform duration-200 ease-out lg:hidden ${
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
          <nav className="flex flex-col gap-1 px-3 py-4">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setDrawerOpen(false)}
                className={`rounded-xl px-3 py-2.5 text-sm font-medium ${
                  pathname === item.href ? 'bg-navy-50 font-semibold text-navy-600' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="my-2 border-t border-slate-100" />
            <button onClick={() => logout()} className="rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-500 hover:bg-red-50">
              Sair
            </button>
          </nav>
        </aside>

        <main className="mx-auto max-w-2xl px-4 py-5 lg:max-w-3xl lg:px-8 lg:py-8">
          <div className="mb-5 lg:hidden">
            <h1 className="font-display text-xl font-bold text-slate-800">{title}</h1>
          </div>
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-slate-200 bg-white px-2 py-2 lg:hidden">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={`flex flex-col items-center gap-0.5 px-3 py-1 ${active ? 'text-navy-600' : 'text-slate-400 hover:text-navy-600'}`}>
              <item.icon className="h-5 w-5" />
              <span className={`text-[10px] ${active ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
