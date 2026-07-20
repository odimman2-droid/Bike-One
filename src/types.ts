export interface Service {
  id: string;
  name: string;
  description: string;
  laborValue: number;
  estimatedTime?: string;
  status: 'Ativo' | 'Inativo';
}

export interface Product {
  id: string;
  name: string;
  category: string;
  quantity: number;
  purchasePrice: number; // Preço de compra (custo)
  salePrice: number;     // Preço de venda
  minStock?: number;     // Alerta de stock baixo
}

export interface Customer {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string; // Observações do Cliente
}

export interface Bicycle {
  brand: string;
  model: string;
  color?: string;
  notes?: string;
}

export interface WorkOrderItemService {
  serviceId: string;
  name: string;
  laborValue: number;
  discount?: number; // Desconto em Kz
}

export interface WorkOrderItemPart {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;     // Preço de venda na altura
  purchasePrice: number; // Preço de compra na altura (para cálculo de lucro)
  discount?: number;     // Desconto em Kz por unidade
}

export type WorkOrderStatus = 'Orçamento' | 'Aprovado' | 'Em Execução' | 'Pronto' | 'Entregue';

export interface WorkOrder {
  id: string;
  orderNumber: number;
  customer: Customer;
  bicycle: Bicycle;
  services: WorkOrderItemService[];
  parts: WorkOrderItemPart[];
  laborTotal: number;
  partsTotal: number;
  total: number;
  status: WorkOrderStatus;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  paymentStatus?: 'Pendente' | 'Pago 50%' | 'Pago Integral';
  amountPaid?: number;
  paymentMethod?: 'Dinheiro' | 'Transferência';
}

export interface DirectSaleItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  purchasePrice: number;
  discount?: number;     // Desconto em Kz por unidade
}

export interface DirectSale {
  id: string;
  customerName: string;
  items: DirectSaleItem[];
  total: number;
  createdAt: string;
  paymentStatus?: 'Pendente' | 'Pago 50%' | 'Pago Integral';
  amountPaid?: number;
  paymentMethod?: 'Dinheiro' | 'Transferência';
}

export interface User {
  username: string;
  role: 'Administrador' | 'Mecânico' | 'Atendente';
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string; // e.g. "Almoço", "Transporte", "Consumíveis", "Outros"
  createdAt: string;
  paymentMethod?: 'Dinheiro' | 'Transferência';
}

export interface BalanceAdjustment {
  id: string;
  type: 'entrada' | 'saida' | 'falha_venda' | 'falta_valor';
  amount: number;
  description: string;
  createdAt: string;
}

export interface SalaryAdvance {
  id: string;
  employeeName: string;
  amount: number;
  status: 'Pendente' | 'Liquidado';
  createdAt: string;
  notes?: string;
}

export interface Employee {
  id: string;
  name: string;
  phone: string;
  role: 'Administrador' | 'Mecânico' | 'Atendente';
  salary: number;
  status: 'Ativo' | 'Inativo';
  hiredAt: string;
}

