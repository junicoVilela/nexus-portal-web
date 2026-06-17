export interface GuiaPasso {
  id: number;
  titulo: string;
  resumo: string;
  icon: string;
  dicas: string[];
  rota?: string[];
  acaoLabel?: string;
}

export interface StatusGuia {
  status: string;
  label: string;
  descricao: string;
  cor: string;
}
