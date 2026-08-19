import fs from 'fs';
import path from 'path';

// Types
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
  purchasePrice: number;
  salePrice: number;
  minStock?: number;
}

export interface StoreData {
  products: Product[];
  services: Service[];
  workOrders: any[];
  directSales: any[];
  expenses: any[];
  balanceAdjustments: any[];
  salaryAdvances: any[];
  employees: any[];
  baseBalance: number;
  lastUpdated: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'bikeone_db.json');

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Câmara de Ar Continental 29x2.0-2.5 SV',
    category: 'Pneus/Câmaras',
    quantity: 45,
    purchasePrice: 2500,
    salePrice: 4500,
    minStock: 10
  },
  {
    id: 'p2',
    name: 'Pneu Maxxis Ikon 29x2.20 Tubeless Ready',
    category: 'Pneus/Câmaras',
    quantity: 12,
    purchasePrice: 22000,
    salePrice: 35000,
    minStock: 4
  },
  {
    id: 'p3',
    name: 'Corrente Shimano Deore HG54 10 velocidades',
    category: 'Peças',
    quantity: 8,
    purchasePrice: 12000,
    salePrice: 19500,
    minStock: 3
  },
  {
    id: 'p4',
    name: 'Pastilhas de Travão Shimano B05S Resina',
    category: 'Peças',
    quantity: 24,
    purchasePrice: 3500,
    salePrice: 6500,
    minStock: 8
  },
  {
    id: 'p5',
    name: 'Líquido Selante Joe\'s No Flats 240ml',
    category: 'Acessórios',
    quantity: 15,
    purchasePrice: 6000,
    salePrice: 10500,
    minStock: 5
  },
  {
    id: 'p6',
    name: 'Capacete Lazer Compact Matte Black',
    category: 'Equipamento',
    quantity: 6,
    purchasePrice: 18000,
    salePrice: 28000,
    minStock: 2
  },
  {
    id: 'p7',
    name: 'Lubrificante de Corrente Squirt Dry Lube 120ml',
    category: 'Acessórios',
    quantity: 20,
    purchasePrice: 7500,
    salePrice: 12000,
    minStock: 6
  },
  {
    id: 'p8',
    name: 'Pedais de Plataforma Rockbros Alumínio',
    category: 'Acessórios',
    quantity: 4,
    purchasePrice: 11000,
    salePrice: 18500,
    minStock: 2
  },
  {
    id: 'p9',
    name: 'Cassete Shimano Deore M5100 11-51T 11v',
    category: 'Peças',
    quantity: 5,
    purchasePrice: 31000,
    salePrice: 48000,
    minStock: 2
  }
];

const INITIAL_SERVICES: Service[] = [
  {
    id: 's1',
    name: 'Revisão Geral (BTT/Estrada)',
    description: 'Desmontagem completa, limpeza, lubrificação de rolamentos, afinação de travões e mudanças, e lavagem.',
    laborValue: 25000,
    estimatedTime: '4 horas',
    status: 'Ativo'
  },
  {
    id: 's2',
    name: 'Afinação de Mudanças',
    description: 'Regulação dos desviadores dianteiro e traseiro, alinhamento do dropout e lubrificação dos cabos.',
    laborValue: 5000,
    estimatedTime: '30 min',
    status: 'Ativo'
  },
  {
    id: 's3',
    name: 'Sangramento de Travões Hidráulicos',
    description: 'Substituição de óleo mineral ou DOT e eliminação de bolhas de ar nos travões dianteiro e traseiro.',
    laborValue: 8000,
    estimatedTime: '1 hora',
    status: 'Ativo'
  },
  {
    id: 's4',
    name: 'Centragem de Roda',
    description: 'Ajuste de tensão dos raios para eliminação de empenos e verificação de saltos na roda.',
    laborValue: 6000,
    estimatedTime: '45 min',
    status: 'Ativo'
  },
  {
    id: 's5',
    name: 'Montagem de Bicicleta na Caixa',
    description: 'Montagem completa de bicicleta nova vinda na caixa de fábrica, com lubrificação e afinação inicial.',
    laborValue: 15000,
    estimatedTime: '2 horas',
    status: 'Ativo'
  },
  {
    id: 's6',
    name: 'Substituição de Câmara de Ar / Pneu',
    description: 'Troca rápida de câmara de ar ou pneu com lubrificação dos flancos e ajuste de pressão.',
    laborValue: 2500,
    estimatedTime: '15 min',
    status: 'Ativo'
  },
  {
    id: 's7',
    name: 'Conversão para Tubeless (por roda)',
    description: 'Aplicação de fita de aro, válvula tubeless e líquido selante para proteção contra furos.',
    laborValue: 7000,
    estimatedTime: '45 min',
    status: 'Ativo'
  }
];

const INITIAL_EMPLOYEES = [
  {
    id: 'emp1',
    name: 'Mateus Gaspar',
    phone: '923112233',
    role: 'Mecânico',
    salary: 180000,
    status: 'Ativo',
    hiredAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'emp2',
    name: 'Helena da Silva',
    phone: '931445566',
    role: 'Atendente',
    salary: 120000,
    status: 'Ativo',
    hiredAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// In-memory cache
let memoryStore: StoreData = {
  products: INITIAL_PRODUCTS,
  services: INITIAL_SERVICES,
  workOrders: [],
  directSales: [],
  expenses: [],
  balanceAdjustments: [],
  salaryAdvances: [],
  employees: INITIAL_EMPLOYEES,
  baseBalance: 0,
  lastUpdated: new Date().toISOString()
};

// Ensure directory and initialize store
export function initStore(): StoreData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      memoryStore = {
        products: Array.isArray(parsed.products) ? parsed.products : INITIAL_PRODUCTS,
        services: Array.isArray(parsed.services) ? parsed.services : INITIAL_SERVICES,
        workOrders: Array.isArray(parsed.workOrders) ? parsed.workOrders : [],
        directSales: Array.isArray(parsed.directSales) ? parsed.directSales : [],
        expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
        balanceAdjustments: Array.isArray(parsed.balanceAdjustments) ? parsed.balanceAdjustments : [],
        salaryAdvances: Array.isArray(parsed.salaryAdvances) ? parsed.salaryAdvances : [],
        employees: Array.isArray(parsed.employees) ? parsed.employees : INITIAL_EMPLOYEES,
        baseBalance: typeof parsed.baseBalance === 'number' ? parsed.baseBalance : 0,
        lastUpdated: parsed.lastUpdated || new Date().toISOString()
      };
    } else {
      saveStoreToFile();
    }
  } catch (err) {
    console.error('Error initializing store file:', err);
  }
  return memoryStore;
}

function saveStoreToFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    memoryStore.lastUpdated = new Date().toISOString();
    const tempFile = `${DATA_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(memoryStore, null, 2), 'utf-8');
    fs.renameSync(tempFile, DATA_FILE);
  } catch (err) {
    console.error('Error saving store to file:', err);
  }
}

// -------------------------------------------------------------
// PRODUCTS CRUD OPERATIONS
// -------------------------------------------------------------

export function getProducts(): Product[] {
  return memoryStore.products;
}

export function getProductById(id: string): Product | undefined {
  return memoryStore.products.find(p => p.id === id);
}

export function createProduct(productData: Omit<Product, 'id'> | Product): Product {
  const id = ('id' in productData && productData.id) ? productData.id : `p_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const newProduct: Product = {
    id,
    name: productData.name,
    category: productData.category || 'Geral',
    quantity: Number(productData.quantity) || 0,
    purchasePrice: Number(productData.purchasePrice) || 0,
    salePrice: Number(productData.salePrice) || 0,
    minStock: productData.minStock !== undefined ? Number(productData.minStock) : 2
  };

  // Remove existing with same id if any, then push
  memoryStore.products = memoryStore.products.filter(p => p.id !== id);
  memoryStore.products.push(newProduct);
  saveStoreToFile();
  return newProduct;
}

export function updateProduct(id: string, updates: Partial<Product>): Product | null {
  const index = memoryStore.products.findIndex(p => p.id === id);
  if (index === -1) return null;

  const current = memoryStore.products[index];
  const updated: Product = {
    ...current,
    ...updates,
    id: current.id, // preserve id
    quantity: updates.quantity !== undefined ? Number(updates.quantity) : current.quantity,
    purchasePrice: updates.purchasePrice !== undefined ? Number(updates.purchasePrice) : current.purchasePrice,
    salePrice: updates.salePrice !== undefined ? Number(updates.salePrice) : current.salePrice,
    minStock: updates.minStock !== undefined ? Number(updates.minStock) : current.minStock
  };

  memoryStore.products[index] = updated;
  saveStoreToFile();
  return updated;
}

export function deleteProduct(id: string): boolean {
  const initialLen = memoryStore.products.length;
  memoryStore.products = memoryStore.products.filter(p => p.id !== id);
  if (memoryStore.products.length !== initialLen) {
    saveStoreToFile();
    return true;
  }
  return false;
}

export function addStockEntry(id: string, quantityToAdd: number, newPurchasePrice?: number): Product | null {
  const index = memoryStore.products.findIndex(p => p.id === id);
  if (index === -1) return null;

  const current = memoryStore.products[index];
  const updated: Product = {
    ...current,
    quantity: Math.max(0, current.quantity + (Number(quantityToAdd) || 0)),
    purchasePrice: (newPurchasePrice !== undefined && Number(newPurchasePrice) > 0) ? Number(newPurchasePrice) : current.purchasePrice
  };

  memoryStore.products[index] = updated;
  saveStoreToFile();
  return updated;
}

export function bulkSetProducts(products: Product[]): Product[] {
  if (Array.isArray(products)) {
    memoryStore.products = products.map(p => ({
      ...p,
      quantity: Number(p.quantity) || 0,
      purchasePrice: Number(p.purchasePrice) || 0,
      salePrice: Number(p.salePrice) || 0,
    }));
    saveStoreToFile();
  }
  return memoryStore.products;
}

// -------------------------------------------------------------
// FULL STORE & SYNC OPERATIONS
// -------------------------------------------------------------

export function getFullStore(): StoreData {
  return memoryStore;
}

export function updateFullStore(incoming: Partial<StoreData>): StoreData {
  if (incoming.products && Array.isArray(incoming.products)) {
    memoryStore.products = incoming.products;
  }
  if (incoming.services && Array.isArray(incoming.services)) {
    memoryStore.services = incoming.services;
  }
  if (incoming.workOrders && Array.isArray(incoming.workOrders)) {
    memoryStore.workOrders = incoming.workOrders;
  }
  if (incoming.directSales && Array.isArray(incoming.directSales)) {
    memoryStore.directSales = incoming.directSales;
  }
  if (incoming.expenses && Array.isArray(incoming.expenses)) {
    memoryStore.expenses = incoming.expenses;
  }
  if (incoming.balanceAdjustments && Array.isArray(incoming.balanceAdjustments)) {
    memoryStore.balanceAdjustments = incoming.balanceAdjustments;
  }
  if (incoming.salaryAdvances && Array.isArray(incoming.salaryAdvances)) {
    memoryStore.salaryAdvances = incoming.salaryAdvances;
  }
  if (incoming.employees && Array.isArray(incoming.employees)) {
    memoryStore.employees = incoming.employees;
  }
  if (typeof incoming.baseBalance === 'number') {
    memoryStore.baseBalance = incoming.baseBalance;
  }

  saveStoreToFile();
  return memoryStore;
}
