export interface Socio {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  memberSince: string | null;
  defaultPosition: 'GOLEIRO' | 'LINHA';
  currentStatus: 'A' | 'DM' | 'I';
  observation?: string | null;
}

export interface SocioStatusRecord {
  id: string;
  referenceMonth: string;
  status: 'A' | 'DM' | 'I';
  observation?: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
