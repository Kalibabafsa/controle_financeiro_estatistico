'use client';

import { RequireRole } from '@/lib/auth/RequireRole';

export default function SocioLayout({ children }: { children: React.ReactNode }) {
  return <RequireRole role="SOCIO">{children}</RequireRole>;
}
