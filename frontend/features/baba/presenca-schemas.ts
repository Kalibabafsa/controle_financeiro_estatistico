export interface PresencaFormItem {
  key: string; // "SOCIO:<id>" ou "CONVIDADO:<id>"
  type: 'SOCIO' | 'CONVIDADO';
  id: string;
  name: string;
  position: 'GOLEIRO' | 'LINHA';
  present: boolean;
}
