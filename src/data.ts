import { Service, Product, WorkOrder, DirectSale } from './types';

export const DEFAULT_SERVICES: Service[] = [
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

export const DEFAULT_PRODUCTS: Product[] = [
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

// Helper to get formatted date string relative to current time
const getDateOffset = (daysAgo: number, hours: number = 10, minutes: number = 0): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
};

export const DEFAULT_WORK_ORDERS: WorkOrder[] = [
  {
    id: 'wo1',
    orderNumber: 1001,
    customer: {
      name: 'Manuel Gonçalves',
      phone: '923 456 789',
      email: 'manuel.gon@gmail.com',
      address: 'Vila Alice, Luanda'
    },
    bicycle: {
      brand: 'Specialized',
      model: 'Chisel Comp BTT',
      color: 'Vermelho Metálico',
      notes: 'Travão traseiro sem pressão, barulho na pedaleira ao pedalar em pé.'
    },
    services: [
      { serviceId: 's1', name: 'Revisão Geral (BTT/Estrada)', laborValue: 25000 },
      { serviceId: 's3', name: 'Sangramento de Travões Hidráulicos', laborValue: 8000 }
    ],
    parts: [
      { productId: 'p4', name: 'Pastilhas de Travão Shimano B05S Resina', quantity: 2, unitPrice: 6500, purchasePrice: 3500 },
      { productId: 'p7', name: 'Lubrificante de Corrente Squirt Dry Lube 120ml', quantity: 1, unitPrice: 12000, purchasePrice: 7500 }
    ],
    laborTotal: 33000,
    partsTotal: 25000,
    total: 58000,
    status: 'Entregue',
    createdAt: getDateOffset(2, 9, 30),
    updatedAt: getDateOffset(2, 17, 15),
    notes: 'Realizada revisão geral. Rolamentos de pedaleira limpos e lubrificados (resolvido o barulho). Sangrado travão traseiro e trocado pastilhas traseiras e dianteiras.'
  },
  {
    id: 'wo2',
    orderNumber: 1002,
    customer: {
      name: 'Ana Sofia Neto',
      phone: '931 987 654',
      email: 'ana.neto@hotmail.com',
      address: 'Talatona, Luanda'
    },
    bicycle: {
      brand: 'Trek',
      model: 'Domane SL5 Estrada',
      color: 'Azul Escuro',
      notes: 'Furo na roda de trás. Mudanças a saltar sob carga.'
    },
    services: [
      { serviceId: 's2', name: 'Afinação de Mudanças', laborValue: 5000 },
      { serviceId: 's6', name: 'Substituição de Câmara de Ar / Pneu', laborValue: 2500 }
    ],
    parts: [
      { productId: 'p1', name: 'Câmara de Ar Continental 29x2.0-2.5 SV', quantity: 1, unitPrice: 4500, purchasePrice: 2500 }
    ],
    laborTotal: 7500,
    partsTotal: 4500,
    total: 12000,
    status: 'Entregue',
    createdAt: getDateOffset(1, 10, 15),
    updatedAt: getDateOffset(1, 14, 0),
    notes: 'Trocada câmara de ar traseira (furo de espinho). Dropout alinhado e mudanças afinadas.'
  },
  {
    id: 'wo3',
    orderNumber: 1003,
    customer: {
      name: 'Carlos Santos',
      phone: '912 345 678',
      email: 'carlitos.santos@gmail.com',
      address: 'Maianga, Luanda'
    },
    bicycle: {
      brand: 'Scott',
      model: 'Scale 970 BTT',
      color: 'Amarelo/Preto',
      notes: 'Fazer conversão das duas rodas para tubeless, corrente desgastada.'
    },
    services: [
      { serviceId: 's7', name: 'Conversão para Tubeless (por roda)', laborValue: 7000 },
      { serviceId: 's7', name: 'Conversão para Tubeless (por roda)', laborValue: 7000 }
    ],
    parts: [
      { productId: 'p5', name: 'Líquido Selante Joe\'s No Flats 240ml', quantity: 1, unitPrice: 10500, purchasePrice: 6000 },
      { productId: 'p3', name: 'Corrente Shimano Deore HG54 10 velocidades', quantity: 1, unitPrice: 19500, purchasePrice: 12000 }
    ],
    laborTotal: 14000,
    partsTotal: 30000,
    total: 44000,
    status: 'Em Execução',
    createdAt: getDateOffset(0, 8, 45),
    updatedAt: getDateOffset(0, 11, 30),
    notes: 'Aros preparados e fitados. Selante aplicado. Falta instalar a corrente Shimano nova e testar a transmissão.'
  },
  {
    id: 'wo4',
    orderNumber: 1004,
    customer: {
      name: 'Eduardo Costa',
      phone: '944 888 777',
      address: 'Benfica, Luanda'
    },
    bicycle: {
      brand: 'Cannondale',
      model: 'F-Si BTT',
      color: 'Verde Acid',
      notes: 'Roda da frente empenada após queda leve.'
    },
    services: [
      { serviceId: 's4', name: 'Centragem de Roda', laborValue: 6000 }
    ],
    parts: [],
    laborTotal: 6000,
    partsTotal: 0,
    total: 6000,
    status: 'Pronto',
    createdAt: getDateOffset(0, 14, 0),
    updatedAt: getDateOffset(0, 15, 30),
    notes: 'Roda dianteira centrada, raios apertados com o aperto ideal.'
  }
];

export const DEFAULT_DIRECT_SALES: DirectSale[] = [
  {
    id: 'ds1',
    customerName: 'João Kanda',
    items: [
      { productId: 'p6', name: 'Capacete Lazer Compact Matte Black', quantity: 1, unitPrice: 28000, purchasePrice: 18000 },
      { productId: 'p7', name: 'Lubrificante de Corrente Squirt Dry Lube 120ml', quantity: 1, unitPrice: 12000, purchasePrice: 7500 }
    ],
    total: 40000,
    createdAt: getDateOffset(1, 16, 20)
  },
  {
    id: 'ds2',
    customerName: 'Cliente Final',
    items: [
      { productId: 'p1', name: 'Câmara de Ar Continental 29x2.0-2.5 SV', quantity: 2, unitPrice: 4500, purchasePrice: 2500 }
    ],
    total: 9000,
    createdAt: getDateOffset(0, 9, 15)
  },
  {
    id: 'ds3',
    customerName: 'Mário Pinto',
    items: [
      { productId: 'p8', name: 'Pedais de Plataforma Rockbros Alumínio', quantity: 1, unitPrice: 18500, purchasePrice: 11000 }
    ],
    total: 18500,
    createdAt: getDateOffset(0, 12, 45)
  }
];

export const DEFAULT_EXPENSES = [
  {
    id: 'exp1',
    description: 'Almoço da Equipa (Oficina)',
    amount: 15000,
    category: 'Almoço',
    createdAt: getDateOffset(0, 13, 0)
  },
  {
    id: 'exp2',
    description: 'Água mineral e Café p/ Receção',
    amount: 4500,
    category: 'Consumíveis',
    createdAt: getDateOffset(0, 10, 30)
  }
];

