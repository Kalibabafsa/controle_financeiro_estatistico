'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';

export default function RootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
    } else {
      router.replace(user.role === 'DIRETOR' ? '/dashboard' : '/inicio');
    }
  }, [loading, user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <LoaderCircle className="h-8 w-8 animate-spin text-navy-600" />
    </div>
  );
}
