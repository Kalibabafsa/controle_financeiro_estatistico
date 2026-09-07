export interface ProximoBabaResponse {
  proximoBaba: { id: string; date: string; time: string | null; location: string | null } | null;
  apto: boolean;
}

export interface Participant {
  id: string;
  participantType: 'SOCIO' | 'CONVIDADO';
  socioId: string | null;
  convidadoId: string | null;
  position: 'GOLEIRO' | 'LINHA';
  socio?: { id: string; name: string } | null;
  convidado?: { id: string; name: string } | null;
}

export interface BabaDetail {
  id: string;
  date: string;
  time: string | null;
  location: string | null;
  presencas: Participant[];
  teams: Array<{ id: string; number: number; members: Array<{ presenca: Participant }> }>;
  events: GameEvent[];
}

export interface GameEvent {
  id: string;
  type: 'GOL' | 'CARTAO_AMARELO' | 'CARTAO_AZUL' | 'CARTAO_VERMELHO';
  teamId: string | null;
  presenca: Participant;
  createdAt: string;
}

export interface ArtilheiroRow {
  socioId: string;
  name: string;
  value: number;
}

export interface CartaoRankingRow {
  socioId: string;
  name: string;
  amarelo: number;
  azul: number;
  vermelho: number;
}

export interface PresencaRankingRow {
  socioId: string;
  name: string;
  value: number;
  totalBabas: number;
  percentual: number;
}

export interface SuspensionItem {
  id: string;
  effectiveDate: string;
  liftedAt: string | null;
  socio?: { id: string; name: string } | null;
  convidado?: { id: string; name: string } | null;
  originEvent: { babaDoDia: { date: string } };
}
