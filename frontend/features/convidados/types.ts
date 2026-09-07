export interface Convidado {
  id: string;
  name: string;
  phone: string | null;
  invitedById: string | null;
  invitedBy?: { id: string; name: string } | null;
  contactRemovedAt: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
