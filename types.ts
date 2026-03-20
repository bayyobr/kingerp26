
export enum OSStatus {
  ABERTO = 'Aberto',
  EM_ANALISE = 'Em Análise',
  AGUARDANDO_PECAS = 'Aguardando Peças',
  PRONTO = 'Pronto p/ Retirada',
  CONCLUIDO = 'Concluído',
  CANCELADO = 'Cancelado'
}

export interface Checklist {
  faceId: boolean | null;
  frontCamera: boolean | null;
  backCamera: boolean | null;
  mic: boolean | null;
  speaker: boolean | null;
  earpiece: boolean | null; // Auricular
  flash: boolean | null;
  nfc: boolean | null;
  connector: boolean | null;
  signal: boolean | null; // Chip/Sinal
  display: boolean | null;
  proxSensor: boolean | null; // Sensor de prox
  buttons: boolean | null;
  others: boolean | null;
  wifi: boolean | null;
  battery: boolean | null;
  touch: boolean | null;
}

export interface ServiceOrder {
  id: string;
  osNumber: string;
  status: OSStatus;
  entryDate: string;
  expectedExitDate: string;
  client: {
    name: string;
    cpf: string;
    phone: string;
  };
  device: {
    brand: string;
    model: string;
    color: string;
    imei: string;
    password?: string;
  };
  problemReported: string; // Keep for internal, hide in PDF if empty
  technicalDiagnosis: string; // Keep for internal
  services?: string; // New
  items?: string; // New
  checklist: Checklist;
  warrantyDays: number;
  priceParts: number;
  priceTotal: number;
  technicianId?: string;
}

export interface Variation {
  id: string;
  name: string;
  stock: number;
  sku?: string;
  price?: number;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  type: 'simple' | 'kit' | 'variation';
  category: string;
  costPrice: number;
  salePrice: number;
  stockQuantity: number;
  // supplier fields removed
  imageUrl?: string;
  minStock?: number;
  variations?: Variation[];
  salesCount?: number;
}

export interface Vendedor {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  cargo: string;
  data_admissao?: string; // Mantido para compatibilidade
  data_entrada?: string; // Novo campo
  salario?: number;
  comissao_percentual?: number;
  meta_vendas_mensal?: number;
  meta_pedidos_mensal?: number;
  ativo: boolean;
  foto_url?: string;
}

// Vendedor BI/Stats Interfaces
export interface TopProduct {
  name: string;
  quantity: number;
  totalGenerated: number;
  percentOfTotal: number;
}

export interface VendedorStats {
  totalSold: number;
  orderCount: number;
  averageTicket: number;
  totalCommission: number;
  
  // Variacoes em relacao ao periodo anterior
  totalSoldDiff: number; // Percentual ex: 12.5 (em %)
  orderCountDiff: number;
  averageTicketDiff: number;
  totalCommissionDiff: number;

  salesEvolution: { month: string; value: number }[];
  topProducts: TopProduct[];
}

export interface Aparelho {
  id: string;
  tipo: string; // 'iPhone', 'Samsung' etc
  marca: string;
  modelo: string;
  capacidade: string;
  cor: string;
  imei: string;
  imei2?: string;
  condicao: 'Novo' | 'Usado';
  estado_bateria?: number;
  preco_custo: number;
  preco_venda: number;
  status: 'Disponível' | 'Vendido' | 'Reservado';
  observacoes?: string;
  fotos_urls?: string[];
  data_entrada?: string;
  data_venda?: string;
  created_at?: string;
  estoque: number; // Keep for compatibility, likely always 1 for unique devices
  checklist?: Checklist;
  vendedor_dados?: {
    nome: string;
    cpf: string;
    telefone: string;
  };
}

export type TipoItem = 'produto' | 'servico' | 'aparelho';

export type PaymentMethod = 'Dinheiro' | 'PIX' | 'Débito' | 'Crédito' | 'Múltiplo';

export interface VendaItem {
  id?: string;
  venda_id?: string;
  tipo_item: TipoItem;
  item_id: string;
  item_nome: string;
  variacao_id?: string | null;
  variacao_nome?: string | null;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
}

export interface Venda {
  id?: string;
  numero_venda?: string;
  vendedor_id: string;
  cliente_nome?: string;
  cliente_telefone?: string;
  cliente_cpf?: string;
  subtotal: number;
  desconto: number;
  total: number;
  forma_pagamento: PaymentMethod;
  status: 'Concluída' | 'Cancelada' | 'Reembolsada';
  refund_reason?: string;
  created_at?: string;
  itens?: VendaItem[];
  payment_details?: PaymentDetail[];
  sale_type?: 'Retirada' | 'Entrega';
  delivery_fee?: number;
}

export interface PaymentDetail {
  method: PaymentMethod;
  amount: number;
  installments?: number; // 1X to 12X
  fee?: number; // Juros/Taxa added to amount
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'entrada' | 'saida';
  quantity: number;
  reason: string;
  date: string; // ISO string
  userId?: string;
  userName?: string;
  costPrice?: number;
  salePrice?: number;
}

export interface PurchaseOrderPackage {
  id: string;
  aliexpressId: string;
  taxUsd: number;
}

export interface PurchaseOrderProduct {
  id: string;
  productId?: string; // If empty, it's just a text entry
  productName: string;
  quantity: number;
  unitPriceUsd: number;
  totalProductUsd: number;
  finalUnitCostBrl: number; // Calculated after apportioning all fees
}

export interface PurchaseOrder {
  id: string;
  date: string;
  supplier: string;
  usdQuote: number;
  shippingUsd: number;
  packageCount: number;
  packages: PurchaseOrderPackage[];
  factoryFeeUsd: number;
  products: PurchaseOrderProduct[];
  totalProductsUsd: number;
  totalOrderUsd: number;
  status: 'Concluído';
  createdAt: string;
}

// CRM Interfaces
export interface Client {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  cpf?: string;
  endereco?: string;
  is_vip_manual: boolean;
  vip_justification?: string;
  created_at: string;
  ultimo_acesso: string;
}

export interface PurchaseHistoryItem {
  id: string; // Venda ID or OS ID
  type: 'PDV' | 'OS';
  date: string;
  total: number;
  itemsDescription: string;
  status: string;
}

export type FrequencyStatus = 'Ativo' | 'Regular' | 'Em Risco' | 'Inativo' | 'Novo';

export interface ClientProfileStats {
  totalSpent: number;
  orderCount: number;
  averageDaysBetweenPurchases: number | null;
  frequencyStatus: FrequencyStatus;
  lastPurchaseDate: string | null;
  estimatedNextPurchaseDate: string | null;
  isVip: boolean; // Computed or manual
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  type: 'Desconto' | 'Brinde' | 'Reativação' | 'Informativo' | 'Outro';
  start_date?: string;
  end_date?: string;
  status: 'Ativa' | 'Encerrada';
  created_at: string;
}

export interface ClientCampaign {
  id: string;
  client_id: string;
  campaign_id: string;
  date_sent: string;
  converted: boolean;
}

// Packaging Interfaces
export interface Embalagem {
  id: string;
  nome: string;
  tipo: string;
  largura?: number;
  altura?: number;
  profundidade?: number;
  foto_url?: string;
  status: 'Ativo' | 'Inativo';
  estoque_atual: number;
  estoque_minimo: number;
  preco_unitario_usd: number;
  preco_unitario_brl: number;
  unidades_por_pacote: number;
  custo_material_adicional: number;
  created_at?: string;
}

export interface EmbalagemMovimentacao {
  id: string;
  embalagem_id: string;
  tipo_movimentacao: 'entrada' | 'saida';
  quantidade: number;
  valor_pago?: number;
  fornecedor?: string;
  motivo?: string;
  data: string;
  created_at?: string;
}

// Strategic Hub Interfaces
export interface StrategicGoal {
  id: string;
  nome: string;
  descricao?: string;
  valor_alvo: number;
  valor_atual: number;
  unidade: string;
  periodicidade: 'mensal' | 'trimestral' | 'anual';
  responsavel?: string;
  prazo?: string;
  status: 'no_prazo' | 'em_risco' | 'atrasada' | 'concluida';
  created_at?: string;
}

export interface StrategicIdea {
  id: string;
  titulo: string;
  descricao?: string;
  categoria?: string;
  prioridade: 'alta' | 'media' | 'low';
  status: 'ideia' | 'em_avaliação' | 'aprovada' | 'descartada' | 'em_execução';
  notas_internas?: string;
  created_at?: string;
}

export interface StrategicAction {
  id: string;
  descricao: string;
  responsavel?: string;
  prazo?: string;
  prioridade: 'alta' | 'media' | 'low';
  status: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';
  meta_id?: string;
  ideia_id?: string;
  checklist: any[];
  created_at?: string;
}

export interface StrategicEvent {
  id: string;
  titulo: string;
  tipo: string;
  data: string;
  descricao?: string;
  created_at?: string;
}

export interface StrategicNote {
  id: string;
  titulo: string;
  conteudo?: string;
  data: string;
  is_pinned: boolean;
  created_at?: string;
}

export interface Competitor {
  id: string;
  nome: string;
  canal_venda?: string;
  pontos_fortes?: string;
  pontos_fracos?: string;
  faixa_preco?: string;
  observacoes?: string;
  ultima_atualizacao?: string;
  created_at?: string;
}

