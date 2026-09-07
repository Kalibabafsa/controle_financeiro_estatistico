import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth/AuthContext';

// Tipografia do design system (docs/design-system.md): Poppins para títulos/destaques,
// Inter para corpo de texto — carregadas via next/font (self-hosted, sem CDN externo).
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-inter' });
const poppins = Poppins({ subsets: ['latin'], weight: ['600', '700', '800'], variable: '--font-poppins' });

export const metadata: Metadata = {
  title: 'Sistema Kalibaba',
  description: 'Controle financeiro e esportivo da Associação Kalibaba.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${poppins.variable}`}>
      <body className="min-h-screen bg-slate-50 font-sans text-slate-800 antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
