import { Product, Service, WorkOrder, DirectSale, Expense, BalanceAdjustment, SalaryAdvance, Employee } from '../types';

export interface FullSyncData {
  products: Product[];
  services: Service[];
  workOrders: WorkOrder[];
  directSales: DirectSale[];
  expenses: Expense[];
  balanceAdjustments: BalanceAdjustment[];
  salaryAdvances: SalaryAdvance[];
  employees: Employee[];
  baseBalance: number;
  lastUpdated?: string;
}

export interface ApiStatus {
  online: boolean;
  message?: string;
}

// -------------------------------------------------------------
// CENTRAL API CLIENT (/api/*)
// -------------------------------------------------------------

export async function checkServerHealth(): Promise<boolean> {
  try {
    const res = await fetch('/api/health', { cache: 'no-store' });
    return res.ok;
  } catch (err) {
    return false;
  }
}

// Products API
export async function apiFetchProducts(): Promise<Product[]> {
  const res = await fetch('/api/products', { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Falha ao obter produtos do servidor (${res.status})`);
  }
  return res.json();
}

export async function apiCreateProduct(product: Omit<Product, 'id'> | Product): Promise<Product> {
  const res = await fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product),
  });
  if (!res.ok) {
    throw new Error(`Falha ao criar produto no servidor (${res.status})`);
  }
  return res.json();
}

export async function apiUpdateProduct(product: Product): Promise<Product> {
  const res = await fetch(`/api/products/${product.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product),
  });
  if (!res.ok) {
    throw new Error(`Falha ao atualizar produto no servidor (${res.status})`);
  }
  return res.json();
}

export async function apiDeleteProduct(id: string): Promise<boolean> {
  const res = await fetch(`/api/products/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error(`Falha ao eliminar produto no servidor (${res.status})`);
  }
  const data = await res.json();
  return data.success;
}

export async function apiAddStockEntry(id: string, quantityToAdd: number, newPurchasePrice?: number): Promise<Product> {
  const res = await fetch(`/api/products/${id}/stock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantityToAdd, newPurchasePrice }),
  });
  if (!res.ok) {
    throw new Error(`Falha ao adicionar entrada de stock (${res.status})`);
  }
  return res.json();
}

export async function apiBulkSaveProducts(products: Product[]): Promise<Product[]> {
  const res = await fetch('/api/products/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ products }),
  });
  if (!res.ok) {
    throw new Error(`Falha ao sincronizar produtos em lote (${res.status})`);
  }
  return res.json();
}

// Full Sync API
export async function apiGetFullSync(): Promise<FullSyncData> {
  const res = await fetch('/api/sync', { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Falha ao obter sincronização total (${res.status})`);
  }
  return res.json();
}

export async function apiPushFullSync(data: Partial<FullSyncData>): Promise<FullSyncData> {
  const res = await fetch('/api/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(`Falha ao enviar sincronização para o servidor (${res.status})`);
  }
  return res.json();
}
