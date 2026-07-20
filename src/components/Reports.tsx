import React, { useState } from 'react';
import { motion } from 'motion/react';
import { WorkOrder, DirectSale, Product, Expense, BalanceAdjustment } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  TrendingUp, 
  Calendar, 
  Wrench, 
  Package, 
  Coins, 
  Printer, 
  DollarSign,
  PieChartIcon,
  BarChart4,
  ArrowRight,
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  CheckCircle,
  AlertTriangle,
  Wallet,
  CheckSquare,
  Clock,
  User,
  ShoppingBag,
  Info
} from 'lucide-react';

interface ReportsProps {
  workOrders: WorkOrder[];
  directSales: DirectSale[];
  products: Product[];
  expenses?: Expense[];
  balanceAdjustments?: BalanceAdjustment[];
  onAddBalanceAdjustment?: (adj: Omit<BalanceAdjustment, 'id' | 'createdAt'>) => void;
}

export default function Reports({ 
  workOrders, 
  directSales, 
  products, 
  expenses = [], 
  balanceAdjustments = [],
  onAddBalanceAdjustment 
}: ReportsProps) {
  // Navigation & Tabs
  const [activeTab, setActiveTab] = useState<'analise' | 'fecho'>('analise');

  // Date filters for Tab 1 - default to last 30 days
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const [startDateStr, setStartDateStr] = useState(thirtyDaysAgo.toISOString().split('T')[0]);
  const [endDateStr, setEndDateStr] = useState(today.toISOString().split('T')[0]);

  // Date filter for Tab 2 - Fecho do Dia (default to today)
  const [closingDate, setClosingDate] = useState(today.toISOString().split('T')[0]);
  const [countedCash, setCountedCash] = useState<string>('');
  const [reconcileSuccessMsg, setReconcileSuccessMsg] = useState<string>('');

  // Currency helper
  const formatKz = (value: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .format(value)
      .replace('Kz', '')
      .trim() + ' Kz';
  };

  // --------------------------------------------------------------------------------------
  // TAB 1: RESULTADOS & LUCRATIVIDADE CALCULATIONS
  // --------------------------------------------------------------------------------------

  // Filter delivered work orders and direct sales within range
  const deliveredWOsInRange = workOrders.filter((wo) => {
    if (wo.status !== 'Entregue') return false;
    const date = wo.updatedAt.split('T')[0];
    return date >= startDateStr && date <= endDateStr;
  });

  const directSalesInRange = directSales.filter((sale) => {
    const date = sale.createdAt.split('T')[0];
    return date >= startDateStr && date <= endDateStr;
  });

  // Calculate stats
  const laborBilled = deliveredWOsInRange.reduce((sum, wo) => sum + wo.laborTotal, 0);
  
  // Products billing is parts in OS + direct sales
  const partsBilled = deliveredWOsInRange.reduce((sum, wo) => sum + wo.partsTotal, 0);
  const directSalesBilled = directSalesInRange.reduce((sum, s) => sum + s.total, 0);
  const productsBilled = partsBilled + directSalesBilled;

  const totalBilled = laborBilled + productsBilled;

  const totalServicesCount = deliveredWOsInRange.reduce((sum, wo) => sum + wo.services.length, 0);
  
  const partsSoldQuantity = deliveredWOsInRange.reduce(
    (sum, wo) => sum + wo.parts.reduce((pSum, p) => pSum + p.quantity, 0),
    0
  );
  const directSalesQuantity = directSalesInRange.reduce(
    (sum, s) => sum + s.items.reduce((iSum, i) => iSum + i.quantity, 0),
    0
  );
  const totalProductsSold = partsSoldQuantity + directSalesQuantity;

  // PROFITS calculation
  const osPartsProfit = deliveredWOsInRange.reduce(
    (sum, wo) => sum + wo.parts.reduce((pSum, p) => pSum + (p.quantity * (p.unitPrice - p.purchasePrice)), 0),
    0
  );
  const directSalesProfit = directSalesInRange.reduce(
    (sum, s) => sum + s.items.reduce((iSum, i) => iSum + (i.quantity * (i.unitPrice - i.purchasePrice)), 0),
    0
  );
  const totalProfitFromProducts = osPartsProfit + directSalesProfit;

  // Profit Today, This Week, This Month (based on current date)
  const todayStr = new Date().toISOString().split('T')[0];
  
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(today.getDate() - 7);
  const weekAgoStr = oneWeekAgo.toISOString().split('T')[0];

  const oneMonthAgo = new Date();
  oneMonthAgo.setDate(today.getDate() - 30);
  const monthAgoStr = oneMonthAgo.toISOString().split('T')[0];

  const calculateProductProfitForPeriod = (start: string, end: string) => {
    const wos = workOrders.filter((wo) => {
      if (wo.status !== 'Entregue') return false;
      const d = wo.updatedAt.split('T')[0];
      return d >= start && d <= end;
    });

    const sales = directSales.filter((s) => {
      const d = s.createdAt.split('T')[0];
      return d >= start && d <= end;
    });

    const p1 = wos.reduce(
      (sum, wo) => sum + wo.parts.reduce((pSum, p) => pSum + (p.quantity * (p.unitPrice - p.purchasePrice)), 0),
      0
    );
    const p2 = sales.reduce(
      (sum, s) => sum + s.items.reduce((iSum, i) => iSum + (i.quantity * (i.unitPrice - i.purchasePrice)), 0),
      0
    );

    return p1 + p2;
  };

  const profitToday = calculateProductProfitForPeriod(todayStr, todayStr);
  const profitThisWeek = calculateProductProfitForPeriod(weekAgoStr, todayStr);
  const profitThisMonth = calculateProductProfitForPeriod(monthAgoStr, todayStr);

  const getChartDataByDay = () => {
    const dataMap: { [day: string]: { date: string; labor: number; sales: number; total: number; profit: number } } = {};

    let current = new Date(startDateStr);
    const end = new Date(endDateStr);
    while (current <= end) {
      const dayStr = current.toISOString().split('T')[0];
      dataMap[dayStr] = {
        date: dayStr.split('-').slice(1).reverse().join('/'), // DD/MM format
        labor: 0,
        sales: 0,
        total: 0,
        profit: 0
      };
      current.setDate(current.getDate() + 1);
    }

    deliveredWOsInRange.forEach((wo) => {
      const day = wo.updatedAt.split('T')[0];
      if (dataMap[day]) {
        dataMap[day].labor += wo.laborTotal;
        dataMap[day].sales += wo.partsTotal;
        dataMap[day].total += wo.total;
        const pProfit = wo.parts.reduce((pSum, p) => pSum + (p.quantity * (p.unitPrice - p.purchasePrice)), 0);
        dataMap[day].profit += pProfit;
      }
    });

    directSalesInRange.forEach((sale) => {
      const day = sale.createdAt.split('T')[0];
      if (dataMap[day]) {
        dataMap[day].sales += sale.total;
        dataMap[day].total += sale.total;
        const sProfit = sale.items.reduce((iSum, i) => iSum + (i.quantity * (i.unitPrice - i.purchasePrice)), 0);
        dataMap[day].profit += sProfit;
      }
    });

    return Object.values(dataMap);
  };

  const dailyChartData = getChartDataByDay();

  const getCategoryShareData = () => {
    const catMap: { [cat: string]: { name: string; value: number } } = {
      'Peças': { name: 'Peças', value: 0 },
      'Acessórios': { name: 'Acessórios', value: 0 },
      'Pneus/Câmaras': { name: 'Pneus/Câmaras', value: 0 },
      'Equipamento': { name: 'Equipamento', value: 0 },
      'Outros': { name: 'Outros', value: 0 },
    };

    deliveredWOsInRange.forEach((wo) => {
      wo.parts.forEach((p) => {
        const prod = products.find((prod) => prod.id === p.productId);
        const cat = prod?.category || 'Outros';
        if (catMap[cat]) {
          catMap[cat].value += (p.unitPrice * p.quantity);
        } else {
          catMap['Outros'].value += (p.unitPrice * p.quantity);
        }
      });
    });

    directSalesInRange.forEach((s) => {
      s.items.forEach((i) => {
        const prod = products.find((prod) => prod.id === i.productId);
        const cat = prod?.category || 'Outros';
        if (catMap[cat]) {
          catMap[cat].value += (i.unitPrice * i.quantity);
        } else {
          catMap['Outros'].value += (i.unitPrice * i.quantity);
        }
      });
    });

    return Object.values(catMap).filter(item => item.value > 0);
  };

  const categoryChartData = getCategoryShareData();
  const PIE_COLORS = ['#F59E0B', '#D97706', '#B45309', '#FBBF24', '#78350F'];

  const handlePrintReport = () => {
    window.print();
  };

  // --------------------------------------------------------------------------------------
  // TAB 2: FECHO DO DIA & CAIXA CALCULATIONS
  // --------------------------------------------------------------------------------------
  const BASE_BALANCE = 350000;

  // Filter transactions exactly on the selected date
  const closingSales = directSales.filter((s) => s.createdAt.startsWith(closingDate));
  
  const closingWOs = workOrders.filter((w) => {
    // Delivered on this date, OR custom payments on this date
    const formattedDate = w.updatedAt.split('T')[0];
    return formattedDate === closingDate && (w.paymentStatus === 'Pago Integral' || w.paymentStatus === 'Pago 50%');
  });

  const closingExpenses = expenses.filter((e) => e.createdAt.startsWith(closingDate));
  const closingAdjustments = balanceAdjustments.filter((a) => a.createdAt.startsWith(closingDate));

  // Determine Balance BEFORE the selected closing Date
  const getBalancePriorToDate = (targetDate: string) => {
    let priorBalance = BASE_BALANCE;
    let priorCash = BASE_BALANCE;

    // Prior Direct Sales
    directSales.forEach((s) => {
      if (s.createdAt < targetDate + 'T00:00:00') {
        priorBalance += s.total;
        if (s.paymentMethod !== 'Transferência') {
          priorCash += s.total;
        }
      }
    });

    // Prior Work Orders
    workOrders.forEach((w) => {
      if (w.updatedAt < targetDate + 'T00:00:00') {
        const paid = w.amountPaid || (w.status === 'Entregue' ? w.total : 0);
        priorBalance += paid;
        if (w.paymentMethod !== 'Transferência') {
          priorCash += paid;
        }
      }
    });

    // Prior Expenses
    expenses.forEach((e) => {
      if (e.createdAt < targetDate + 'T00:00:00') {
        priorBalance -= e.amount;
        if (e.paymentMethod !== 'Transferência') {
          priorCash -= e.amount;
        }
      }
    });

    // Prior Adjustments
    balanceAdjustments.forEach((adj) => {
      if (adj.createdAt < targetDate + 'T00:00:00') {
        const isAddition = adj.type === 'entrada';
        if (isAddition) {
          priorBalance += adj.amount;
          priorCash += adj.amount;
        } else {
          priorBalance -= adj.amount;
          priorCash -= adj.amount;
        }
      }
    });

    return { total: priorBalance, cash: priorCash };
  };

  const priorBalances = getBalancePriorToDate(closingDate);
  const initialTotalBalance = priorBalances.total;
  const initialCashBalance = priorBalances.cash;

  // Day's Inflow (Entries)
  let cashInflow = 0;
  let transferInflow = 0;

  closingSales.forEach((s) => {
    if (s.paymentMethod === 'Transferência') {
      transferInflow += s.total;
    } else {
      cashInflow += s.total;
    }
  });

  closingWOs.forEach((w) => {
    const paid = w.amountPaid || (w.status === 'Entregue' ? w.total : 0);
    if (w.paymentMethod === 'Transferência') {
      transferInflow += paid;
    } else {
      cashInflow += paid;
    }
  });

  // Day's Outflow (Exits/Expenses)
  let cashOutflow = 0;
  let transferOutflow = 0;

  closingExpenses.forEach((e) => {
    if (e.paymentMethod === 'Transferência') {
      transferOutflow += e.amount;
    } else {
      cashOutflow += e.amount;
    }
  });

  closingAdjustments.forEach((adj) => {
    const isAddition = adj.type === 'entrada';
    if (!isAddition) {
      cashOutflow += adj.amount; // Manual withdrawals are cash-reductive
    } else {
      cashInflow += adj.amount; // Manual deposits are cash-positive
    }
  });

  const dailyTotalInflow = cashInflow + transferInflow;
  const dailyTotalOutflow = cashOutflow + transferOutflow;

  const estimatedEndingCash = initialCashBalance + cashInflow - cashOutflow;
  const estimatedEndingTotal = initialTotalBalance + dailyTotalInflow - dailyTotalOutflow;

  // Reconciliation Variance
  const hasCountedInput = countedCash.trim() !== '';
  const parsedCountedCash = hasCountedInput ? Number(countedCash) : 0;
  const variance = parsedCountedCash - estimatedEndingCash;

  // Handle Recording Reconciliation Adjustment
  const handleRecordDiscrepancy = () => {
    if (!onAddBalanceAdjustment || variance === 0) return;

    const discrepancyAmount = Math.abs(variance);
    const type = variance < 0 ? 'falta_valor' : 'entrada';
    const description = variance < 0 
      ? `Ajuste de Fecho: Falta de Valores no Caixa (${closingDate})` 
      : `Ajuste de Fecho: Sobra no Caixa (${closingDate})`;

    onAddBalanceAdjustment({
      type,
      amount: discrepancyAmount,
      description
    });

    setCountedCash('');
    setReconcileSuccessMsg(`✓ Reconciliação gravada com sucesso! Lançado um ajuste de ${formatKz(discrepancyAmount)}.`);
    setTimeout(() => setReconcileSuccessMsg(''), 5000);
  };

  return (
    <div className="space-y-6" id="reports-view">
      
      {/* HEADER - Hidden during printing */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-xl font-sans font-black text-slate-100 flex items-center gap-2.5">
            <TrendingUp className="h-5 w-5 text-amber-500" />
            Bike One — Relatórios & Fecho de Caixa
          </h1>
          <p className="text-xs text-slate-400">
            {activeTab === 'analise' 
              ? 'Analise faturamentos, lucros de peças e margens de venda' 
              : 'Verifique a contagem de caixa físico diário, entradas e saídas'}
          </p>
        </div>
        
        {/* Tab Selector Buttons */}
        <div className="flex bg-[#111216] border border-slate-800 p-1 rounded-2xl shrink-0">
          <button
            onClick={() => setActiveTab('analise')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'analise' 
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10' 
                : 'text-slate-450 hover:text-slate-200'
            }`}
          >
            Análise Geral
          </button>
          <button
            onClick={() => setActiveTab('fecho')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'fecho' 
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10' 
                : 'text-slate-450 hover:text-slate-200'
            }`}
          >
            Fecho do Dia
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------------------------------------- */}
      {/* TAB 1 CONTENT: GENERAL ANALYTICS */}
      {/* ---------------------------------------------------------------------------------- */}
      {activeTab === 'analise' && (
        <div className="space-y-6 print:hidden">
          {/* FILTER CONTROLS */}
          <div className="bg-[#111216]/60 border border-slate-800/60 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-amber-500" /> Filtrar Período de Análise
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">Desde</label>
                <input
                  type="date"
                  value={startDateStr}
                  onChange={(e) => setStartDateStr(e.target.value)}
                  className="w-full bg-slate-800/40 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">Até</label>
                <input
                  type="date"
                  value={endDateStr}
                  onChange={(e) => setEndDateStr(e.target.value)}
                  className="w-full bg-slate-800/40 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2 md:col-span-1 flex items-end justify-between">
                <div className="text-slate-500 text-[11px] font-medium leading-relaxed pb-1">
                  Exibindo dados de <strong className="text-slate-300">{dailyChartData.length} dias</strong> selecionados.
                </div>
                <button
                  onClick={handlePrintReport}
                  className="flex items-center gap-1.5 px-4 py-2 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Imprimir
                </button>
              </div>
            </div>
          </div>

          {/* THREE QUICK ANALYTICS CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-[#111216] to-[#111216]/60 border border-slate-800/60 rounded-3xl p-5 shadow-lg relative overflow-hidden">
              <div className="absolute right-[-10px] bottom-[-10px] opacity-10 text-slate-500">
                <Coins className="h-28 w-28" />
              </div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Lucro de Peças Hoje</span>
              <span className="text-2xl font-black text-amber-500 block font-mono mt-1">
                {formatKz(profitToday)}
              </span>
              <p className="text-[10px] text-slate-500 mt-2">Fechamento do dia {new Date().toLocaleDateString('pt-AO')}</p>
            </div>

            <div className="bg-gradient-to-br from-[#111216] to-[#111216]/60 border border-slate-800/60 rounded-3xl p-5 shadow-lg relative overflow-hidden">
              <div className="absolute right-[-10px] bottom-[-10px] opacity-10 text-slate-500">
                <Coins className="h-28 w-28" />
              </div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Lucro de Peças 7 Dias</span>
              <span className="text-2xl font-black text-amber-400 block font-mono mt-1">
                {formatKz(profitThisWeek)}
              </span>
              <p className="text-[10px] text-slate-500 mt-2">Soma móvel do faturamento semanal</p>
            </div>

            <div className="bg-gradient-to-br from-[#111216] to-[#111216]/60 border border-slate-800/60 rounded-3xl p-5 shadow-lg relative overflow-hidden">
              <div className="absolute right-[-10px] bottom-[-10px] opacity-10 text-slate-500">
                <Coins className="h-28 w-28" />
              </div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Lucro de Peças 30 Dias</span>
              <span className="text-2xl font-black text-amber-300 block font-mono mt-1">
                {formatKz(profitThisMonth)}
              </span>
              <p className="text-[10px] text-slate-500 mt-2">Acompanhamento de lucro mensal</p>
            </div>
          </div>

          {/* PERIOD PERFORMANCE METRICS */}
          <div className="bg-[#111216]/60 border border-slate-800/60 rounded-3xl p-6 shadow-md space-y-6">
            <div className="pb-3 border-b border-slate-850">
              <h2 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <BarChart4 className="h-4.5 w-4.5 text-amber-500" />
                Balanço Consolidado do Período
              </h2>
              <p className="text-[10px] text-slate-500">Total faturado e lucratividade real no intervalo de datas selecionado</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-[#0a0b0d]/50 rounded-2xl border border-slate-850/40 space-y-1">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Wrench className="h-3 w-3 text-amber-500" /> Faturação Mão de Obra
                </span>
                <span className="text-lg font-black text-slate-100 block font-mono">
                  {formatKz(laborBilled)}
                </span>
                <span className="text-[10px] text-slate-400 block font-medium">
                  {totalServicesCount} serviços concluídos
                </span>
              </div>

              <div className="p-4 bg-[#0a0b0d]/50 rounded-2xl border border-slate-850/40 space-y-1">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Package className="h-3 w-3 text-amber-500" /> Faturação de Produtos
                </span>
                <span className="text-lg font-black text-slate-100 block font-mono">
                  {formatKz(productsBilled)}
                </span>
                <span className="text-[10px] text-slate-400 block font-medium">
                  {totalProductsSold} produtos vendidos
                </span>
              </div>

              <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20 space-y-1">
                <span className="text-[9px] text-amber-500 font-bold uppercase tracking-wider block">Faturação Bruta Total</span>
                <span className="text-lg font-black text-amber-400 block font-mono">
                  {formatKz(totalBilled)}
                </span>
                <span className="text-[10px] text-slate-400 block font-medium">
                  Mão de Obra + Peças + Vendas
                </span>
              </div>

              <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 space-y-1">
                <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Coins className="h-3.5 w-3.5 text-emerald-400" /> Lucro Líquido Produtos
                </span>
                <span className="text-lg font-black text-emerald-400 block font-mono">
                  {formatKz(totalProfitFromProducts)}
                </span>
                {productsBilled > 0 && (
                  <span className="text-[10px] text-emerald-500 block font-bold">
                    {((totalProfitFromProducts / (productsBilled - totalProfitFromProducts)) * 100).toFixed(0)}% margem de lucro em stock
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* CHARTS GRAPHICS GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-[#111216]/60 border border-slate-800/60 rounded-3xl p-6 shadow-md space-y-4">
              <h3 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-850">
                <BarChart4 className="h-4.5 w-4.5 text-amber-500" /> Evolução de Faturação Diária
              </h3>
              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="date" stroke="#94A3B8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111216', borderColor: '#334155', borderRadius: '12px' }}
                      labelStyle={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '11px' }}
                      itemStyle={{ fontSize: '11px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                    <Bar name="Mão de Obra" dataKey="labor" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                    <Bar name="Venda Produtos" dataKey="sales" fill="#D97706" radius={[4, 4, 0, 0]} />
                    <Bar name="Lucro Líquido" dataKey="profit" fill="#FBBF24" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-[#111216]/60 border border-slate-800/60 rounded-3xl p-6 shadow-md space-y-4">
              <h3 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-850">
                <PieChartIcon className="h-4.5 w-4.5 text-amber-500" /> Faturação por Categoria
              </h3>
              {categoryChartData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-xs text-slate-500 text-center italic">
                  Nenhuma venda registrada no período para classificar.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="h-52 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={70}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {categoryChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#111216', borderColor: '#334155', borderRadius: '8px' }}
                          itemStyle={{ fontSize: '11px', color: '#e2e8f0' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 text-xs">
                    {categoryChartData.map((item, index) => (
                      <div key={item.name} className="flex justify-between items-center text-[11px]">
                        <div className="flex items-center gap-2">
                          <div 
                            className="h-2.5 w-2.5 rounded-full shrink-0" 
                            style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} 
                          />
                          <span className="font-bold text-slate-300">{item.name}</span>
                        </div>
                        <span className="font-mono text-slate-400">{formatKz(item.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------------------- */}
      {/* TAB 2 CONTENT: DAILY CLOSING (FECHO DO DIA) */}
      {/* ---------------------------------------------------------------------------------- */}
      {activeTab === 'fecho' && (
        <div className="space-y-6">
          
          {/* SEARCH & DATE SELECTION FOR CLOSING - Hidden when printing */}
          <div className="bg-[#111216]/60 border border-slate-800/60 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">Selecionar Dia do Fecho</h3>
                <p className="text-[10px] text-slate-550">Analise os fluxos de caixa e feche as contas para qualquer data.</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="date"
                value={closingDate}
                onChange={(e) => {
                  setClosingDate(e.target.value);
                  setCountedCash('');
                }}
                className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-200 font-bold focus:outline-none focus:border-amber-500/40"
              />
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl cursor-pointer transition-colors shadow-md shadow-amber-500/5 uppercase tracking-wider"
              >
                <Printer className="h-3.5 w-3.5" />
                Imprimir Fecho (PDF)
              </button>
            </div>
          </div>

          {/* RECONCILIATION SUMMARY BANNER SUCCESS */}
          {reconcileSuccessMsg && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-400 text-xs font-bold animate-pulse print:hidden">
              <CheckCircle className="h-5 w-5 shrink-0" />
              {reconcileSuccessMsg}
            </div>
          )}

          {/* RECONCILIATION CALCULATION AREA - Hidden when printing */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:hidden">
            
            {/* CASH IN DRAWER VS REAL COUNT */}
            <div className="bg-gradient-to-br from-[#111216] to-[#111216]/60 border border-slate-800/60 rounded-3xl p-6 shadow-md flex flex-col justify-between space-y-4">
              <div>
                <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                  <Wallet className="h-3.5 w-3.5 text-amber-500" />
                  Dinheiro Físico Estimado (Em Caixa)
                </span>
                <h3 className="text-3xl font-black text-slate-200 mt-1 font-mono">
                  {formatKz(estimatedEndingCash)}
                </h3>
                <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                  Baseado em: Saldo Inicial em Dinheiro ({formatKz(priorBalances.cash)}) + Entradas do dia em Dinheiro ({formatKz(cashInflow)}) - Saídas do dia em Dinheiro ({formatKz(cashOutflow)}).
                </p>
              </div>

              {/* Cash Input form */}
              <div className="space-y-3 pt-3 border-t border-slate-850/60">
                <div>
                  <label className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block mb-1">Contagem de Dinheiro Físico (Kz)</label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="Dinheiro contado na gaveta"
                      value={countedCash}
                      onChange={(e) => {
                        setCountedCash(e.target.value);
                      }}
                      className="w-full bg-[#0a0b0d] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-650 focus:outline-none focus:border-amber-500/40 font-mono font-bold"
                    />
                    <span className="absolute right-3 top-2 text-[10px] text-slate-500">Kz</span>
                  </div>
                </div>

                {hasCountedInput && (
                  <div className={`p-3 rounded-xl border space-y-2 ${
                    variance === 0 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                      : variance < 0 
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
                      : 'bg-sky-500/10 border-sky-500/20 text-sky-400'
                  }`}>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold">Diferença de Caixa:</span>
                      <span className="font-mono font-black">
                        {variance > 0 ? '+' : ''}{formatKz(variance)}
                      </span>
                    </div>
                    
                    <p className="text-[10px] leading-relaxed">
                      {variance === 0 
                        ? 'Excelente! O valor de caixa físico bate exatamente com a estimativa do sistema.' 
                        : variance < 0 
                        ? `Atenção: Faltam ${formatKz(Math.abs(variance))} no caixa (Quebra de Caixa / Falha).` 
                        : `Atenção: Sobram ${formatKz(variance)} no caixa (Sobra de Caixa).`}
                    </p>

                    {variance !== 0 && (
                      <button
                        onClick={handleRecordDiscrepancy}
                        className="w-full mt-1.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black rounded-lg transition-colors cursor-pointer uppercase tracking-wider"
                      >
                        Gravar Reconciliação em Ajustes
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* FLOW RECONCILIATION SUMMARY CARD */}
            <div className="lg:col-span-2 bg-[#111216]/60 border border-slate-800/60 rounded-3xl p-6 shadow-md space-y-4">
              <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-850">
                <Info className="h-4.5 w-4.5 text-amber-500" />
                Resumo de Saldos & Fluxos Diários
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Cash Drawer Box */}
                <div className="p-4 bg-[#0a0b0d]/50 border border-slate-850/40 rounded-2xl space-y-2">
                  <h4 className="text-[10px] text-slate-450 font-black uppercase tracking-wider flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                    Fluxo de Dinheiro Físico (Cash)
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs font-medium">
                    <span className="text-slate-500">Saldo Inicial:</span>
                    <span className="text-right text-slate-300 font-mono">{formatKz(initialCashBalance)}</span>
                    
                    <span className="text-slate-500">Entradas (+):</span>
                    <span className="text-right text-emerald-400 font-mono font-bold">+{formatKz(cashInflow)}</span>
                    
                    <span className="text-slate-500">Saídas (-):</span>
                    <span className="text-right text-rose-400 font-mono font-bold">-{formatKz(cashOutflow)}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                    <span className="font-extrabold text-slate-300">Estimativa Caixa:</span>
                    <span className="font-mono font-black text-amber-500">{formatKz(estimatedEndingCash)}</span>
                  </div>
                </div>

                {/* Combined / Total Balance Box */}
                <div className="p-4 bg-[#0a0b0d]/50 border border-slate-850/40 rounded-2xl space-y-2">
                  <h4 className="text-[10px] text-slate-450 font-black uppercase tracking-wider flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                    Balanço Total Integrado (Cash + Banco)
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs font-medium">
                    <span className="text-slate-500">Saldo Inicial:</span>
                    <span className="text-right text-slate-300 font-mono">{formatKz(initialTotalBalance)}</span>
                    
                    <span className="text-slate-500">Total Entradas:</span>
                    <span className="text-right text-emerald-400 font-mono font-bold">+{formatKz(dailyTotalInflow)}</span>
                    
                    <span className="text-slate-500">Total Saídas:</span>
                    <span className="text-right text-rose-400 font-mono font-bold">-{formatKz(dailyTotalOutflow)}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                    <span className="font-extrabold text-slate-300">Saldo Estimado:</span>
                    <span className="font-mono font-black text-amber-500">{formatKz(estimatedEndingTotal)}</span>
                  </div>
                </div>

              </div>

              {/* Detail on Inflow Payments channels */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-850/40">
                <div className="text-xs">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Entradas por Canal de Pagamento</span>
                  <div className="flex justify-between mt-1 text-[11px]">
                    <span className="text-slate-450">Dinheiro Físico:</span>
                    <span className="font-bold font-mono text-slate-300">{formatKz(cashInflow)}</span>
                  </div>
                  <div className="flex justify-between mt-0.5 text-[11px]">
                    <span className="text-slate-450">Transferências:</span>
                    <span className="font-bold font-mono text-slate-300">{formatKz(transferInflow)}</span>
                  </div>
                </div>

                <div className="text-xs">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Saídas por Canal de Pagamento</span>
                  <div className="flex justify-between mt-1 text-[11px]">
                    <span className="text-slate-450">Dinheiro Físico:</span>
                    <span className="font-bold font-mono text-slate-300">{formatKz(cashOutflow)}</span>
                  </div>
                  <div className="flex justify-between mt-0.5 text-[11px]">
                    <span className="text-slate-450">Transferências:</span>
                    <span className="font-bold font-mono text-slate-300">{formatKz(transferOutflow)}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* DETAILED DAILY TRANSACTION LOG TABLE - Hidden when printing */}
          <div className="bg-[#111216]/60 border border-slate-800/60 rounded-3xl p-6 shadow-md space-y-4 print:hidden">
            <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-850">
              <FileText className="h-4.5 w-4.5 text-amber-500" />
              Movimentações Detalhadas do Dia ({closingSales.length + closingWOs.length + closingExpenses.length + closingAdjustments.length})
            </h3>

            {(closingSales.length + closingWOs.length + closingExpenses.length + closingAdjustments.length) === 0 ? (
              <p className="text-xs text-slate-500 italic py-8 text-center">
                Nenhuma transação registada na Bike One para o dia {new Date(closingDate + 'T12:00:00').toLocaleDateString('pt-AO')}.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 uppercase text-[9px] font-black tracking-wider">
                      <th className="py-2.5 px-3">Hora / Tipo</th>
                      <th className="py-2.5 px-3">Descrição / Detalhe</th>
                      <th className="py-2.5 px-3">Canal de Pagamento</th>
                      <th className="py-2.5 px-3 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/60">
                    
                    {/* Render Sales */}
                    {closingSales.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-850/10">
                        <td className="py-3 px-3">
                          <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg font-bold">
                            Venda POS
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-350">Venda Direta a {s.customerName}</span>
                          <span className="block text-[10px] text-slate-500 mt-0.5">
                            {s.items.map((it) => `${it.quantity}x ${it.name}`).join(', ')}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${s.paymentMethod === 'Transferência' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/25' : 'bg-amber-500/10 text-amber-400 border border-amber-500/25'}`}>
                            {s.paymentMethod || 'Dinheiro'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-black text-emerald-400">
                          +{formatKz(s.total)}
                        </td>
                      </tr>
                    ))}

                    {/* Render Work Orders */}
                    {closingWOs.map((w) => {
                      const paid = w.amountPaid || (w.status === 'Entregue' ? w.total : 0);
                      return (
                        <tr key={w.id} className="hover:bg-slate-850/10">
                          <td className="py-3 px-3">
                            <span className="text-[10px] px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg font-bold">
                              Manutenção
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-slate-350">OS #{w.orderNumber} • {w.customer.name}</span>
                            <span className="block text-[10px] text-slate-500 mt-0.5">
                              Bicicleta: {w.bicycle.brand} {w.bicycle.model} ({w.paymentStatus})
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${w.paymentMethod === 'Transferência' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/25' : 'bg-amber-500/10 text-amber-400 border border-amber-500/25'}`}>
                              {w.paymentMethod || 'Dinheiro'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-black text-emerald-400">
                            +{formatKz(paid)}
                          </td>
                        </tr>
                      );
                    })}

                    {/* Render Expenses */}
                    {closingExpenses.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-850/10">
                        <td className="py-3 px-3">
                          <span className="text-[10px] px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-450 rounded-lg font-bold">
                            Saída / Despesa
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-350">{e.description}</span>
                          <span className="block text-[10px] text-slate-500 mt-0.5">Categoria: {e.category}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${e.paymentMethod === 'Transferência' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/25' : 'bg-amber-500/10 text-amber-400 border border-amber-500/25'}`}>
                            {e.paymentMethod || 'Dinheiro'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-black text-rose-450">
                          -{formatKz(e.amount)}
                        </td>
                      </tr>
                    ))}

                    {/* Render Manual Adjustments */}
                    {closingAdjustments.map((adj) => {
                      const isAddition = adj.type === 'entrada';
                      return (
                        <tr key={adj.id} className="hover:bg-slate-850/10">
                          <td className="py-3 px-3">
                            <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold uppercase ${isAddition ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'}`}>
                              {isAddition ? 'Depósito Caixa' : 'Ajuste Caixa'}
                            </span>
                          </td>
                          <td className="py-3 px-3" colSpan={2}>
                            <span className="font-bold text-slate-350">{adj.description}</span>
                          </td>
                          <td className={`py-3 px-3 text-right font-mono font-black ${isAddition ? 'text-emerald-400' : 'text-rose-450'}`}>
                            {isAddition ? '+' : '-'}{formatKz(adj.amount)}
                          </td>
                        </tr>
                      );
                    })}

                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ---------------------------------------------------------------------------------- */}
      {/* PRINT-ONLY HIGH FIDELITY DAILY CLOSING REPORT TEMPLATE */}
      {/* ---------------------------------------------------------------------------------- */}
      <div className="hidden print:block text-black bg-white p-8 max-w-4xl mx-auto space-y-6 font-sans">
        
        {/* Invoice Header */}
        <div className="border-b-2 border-black pb-4 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black tracking-tight uppercase">BIKE ONE</h1>
            <p className="text-xs text-gray-600 mt-1">Especialistas em Duas Rodas & Manutenção</p>
            <p className="text-[10px] text-gray-500">Luanda, Angola</p>
          </div>
          <div className="text-right">
            <h2 className="text-sm font-extrabold uppercase tracking-widest text-gray-800">Fecho de Caixa Diário</h2>
            <p className="text-xs font-mono font-bold mt-1">Data: {new Date(closingDate + 'T12:00:00').toLocaleDateString('pt-AO', { dateStyle: 'long' })}</p>
            <p className="text-[9px] text-gray-500">Gerado às {new Date().toLocaleTimeString('pt-AO')}</p>
          </div>
        </div>

        {/* Audit Core Balances */}
        <div className="grid grid-cols-2 gap-6 py-4 border-b border-gray-300">
          <div className="space-y-1">
            <h3 className="text-xs font-extrabold text-gray-700 uppercase">Resumo de Dinheiro Físico (Gaveta)</h3>
            <div className="text-xs space-y-1 mt-2">
              <div className="flex justify-between">
                <span>Saldo Inicial em Dinheiro:</span>
                <span className="font-mono font-bold">{formatKz(initialCashBalance)}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>(+) Entradas de Dinheiro Físico:</span>
                <span className="font-mono font-bold">+{formatKz(cashInflow)}</span>
              </div>
              <div className="flex justify-between text-red-700">
                <span>(-) Saídas de Dinheiro Físico:</span>
                <span className="font-mono font-bold">-{formatKz(cashOutflow)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-300 pt-1 text-sm font-black text-gray-950">
                <span>Dinheiro Físico Estimado:</span>
                <span className="font-mono">{formatKz(estimatedEndingCash)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="text-xs font-extrabold text-gray-700 uppercase">Resumo Financeiro Consolidado</h3>
            <div className="text-xs space-y-1 mt-2">
              <div className="flex justify-between">
                <span>Saldo Inicial Total:</span>
                <span className="font-mono font-bold">{formatKz(initialTotalBalance)}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>(+) Total Entradas (Cash + Banco):</span>
                <span className="font-mono font-bold">+{formatKz(dailyTotalInflow)}</span>
              </div>
              <div className="flex justify-between text-red-700">
                <span>(-) Total Saídas (Cash + Banco):</span>
                <span className="font-mono font-bold">-{formatKz(dailyTotalOutflow)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-300 pt-1 text-sm font-black text-gray-950">
                <span>Saldo Estimado de Fecho:</span>
                <span className="font-mono">{formatKz(estimatedEndingTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* counted cash audit discrepancy */}
        {hasCountedInput && (
          <div className="p-3 bg-gray-100 rounded border border-gray-300 text-xs flex justify-between items-center font-bold">
            <span>Dinheiro Físico Real Contado:</span>
            <div className="text-right">
              <span className="font-mono">{formatKz(parsedCountedCash)}</span>
              <span className="block text-[10px] text-gray-600 font-normal mt-0.5">
                Diferença (Desvio): {variance > 0 ? '+' : ''}{formatKz(variance)} ({variance === 0 ? 'Reconciliado' : variance < 0 ? 'Quebra' : 'Sobra'})
              </span>
            </div>
          </div>
        )}

        {/* Table of transactions */}
        <div className="space-y-2">
          <h3 className="text-xs font-black uppercase text-gray-700 tracking-wider">Historial de Transações do Dia</h3>
          
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-black text-gray-700 uppercase text-[9px] font-black tracking-wider">
                <th className="py-2">Tipo</th>
                <th className="py-2">Descrição</th>
                <th className="py-2">Canal</th>
                <th className="py-2 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {closingSales.map((s) => (
                <tr key={s.id} className="py-1">
                  <td className="py-2 font-bold uppercase text-[9px]">Venda POS</td>
                  <td className="py-2">Venda Direta a {s.customerName}</td>
                  <td className="py-2 font-semibold">{s.paymentMethod || 'Dinheiro'}</td>
                  <td className="py-2 text-right font-mono font-bold">+{formatKz(s.total)}</td>
                </tr>
              ))}
              {closingWOs.map((w) => {
                const paid = w.amountPaid || (w.status === 'Entregue' ? w.total : 0);
                return (
                  <tr key={w.id} className="py-1">
                    <td className="py-2 font-bold uppercase text-[9px]">Oficina OS</td>
                    <td className="py-2">OS #{w.orderNumber} — {w.customer.name}</td>
                    <td className="py-2 font-semibold">{w.paymentMethod || 'Dinheiro'}</td>
                    <td className="py-2 text-right font-mono font-bold">+{formatKz(paid)}</td>
                  </tr>
                );
              })}
              {closingExpenses.map((e) => (
                <tr key={e.id} className="py-1 text-red-700">
                  <td className="py-2 font-bold uppercase text-[9px]">Despesa / Saída</td>
                  <td className="py-2">{e.description} ({e.category})</td>
                  <td className="py-2 font-semibold">{e.paymentMethod || 'Dinheiro'}</td>
                  <td className="py-2 text-right font-mono font-bold">-{formatKz(e.amount)}</td>
                </tr>
              ))}
              {closingAdjustments.map((a) => {
                const isAddition = a.type === 'entrada';
                return (
                  <tr key={a.id} className={`py-1 ${isAddition ? 'text-emerald-700' : 'text-red-700'}`}>
                    <td className="py-2 font-bold uppercase text-[9px]">Ajuste Manual</td>
                    <td className="py-2">{a.description}</td>
                    <td className="py-2 font-semibold">Dinheiro</td>
                    <td className="py-2 text-right font-mono font-bold">
                      {isAddition ? '+' : '-'}{formatKz(a.amount)}
                    </td>
                  </tr>
                );
              })}
              {closingSales.length === 0 && closingWOs.length === 0 && closingExpenses.length === 0 && closingAdjustments.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-gray-500 italic">
                    Nenhuma transação efetuada nesta data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Signature areas */}
        <div className="pt-16 grid grid-cols-2 gap-12 text-center text-xs">
          <div className="space-y-1">
            <div className="border-t border-black pt-2 font-bold">Assinatura do Operador</div>
            <p className="text-[10px] text-gray-500">Bike One Staff</p>
          </div>
          <div className="space-y-1">
            <div className="border-t border-black pt-2 font-bold">Visto de Auditoria</div>
            <p className="text-[10px] text-gray-500">Gerente Responsável</p>
          </div>
        </div>

      </div>

    </div>
  );
}
