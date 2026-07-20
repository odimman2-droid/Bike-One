import React, { useState } from 'react';
import { motion } from 'motion/react';
import { DirectSale, WorkOrder, Product, Expense } from '../types';
import { 
  Coins, 
  Calendar, 
  TrendingUp, 
  Package, 
  ClipboardList, 
  Search, 
  Printer, 
  X, 
  Bike, 
  ArrowUpRight, 
  CheckCircle, 
  User, 
  ArrowDownLeft,
  Briefcase,
  Layers,
  ArrowRight,
  Trash2,
  Plus,
  ArrowDownRight
} from 'lucide-react';

interface SalesProps {
  directSales: DirectSale[];
  workOrders: WorkOrder[];
  products: Product[];
  expenses: Expense[];
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onDeleteExpense: (id: string) => void;
  onEditDirectSale?: (sale: DirectSale) => void;
  onEditWorkOrder?: (wo: WorkOrder) => void;
  onOpenQuickSale?: () => void;
}

export default function Sales({ 
  directSales, 
  workOrders, 
  products, 
  expenses, 
  onAddExpense, 
  onDeleteExpense, 
  onEditDirectSale,
  onEditWorkOrder,
  onOpenQuickSale 
}: SalesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pos' | 'wo'>('all');
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<'today' | 'all'>('today');
  const [currentPage, setCurrentPage] = useState(1);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedFilter, selectedTimePeriod, targetDateStr]);

  // Selected date filter (defaults to today's date)
  const [targetDateStr, setTargetDateStr] = useState(new Date().toISOString().split('T')[0]);

  // Modal to view specific direct sale details
  const [viewingSale, setViewingSale] = useState<DirectSale | null>(null);
  // Modal to view specific Work Order details
  const [viewingWO, setViewingWO] = useState<WorkOrder | null>(null);

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

  // Helper to get date string in local YYYY-MM-DD format
  const getLocalDateString = (isoString: string) => {
    return isoString.split('T')[0];
  };

  // Filter direct sales and delivered work orders matching target date or all
  const filteredPOSSales = directSales.filter((sale) => {
    const saleDate = getLocalDateString(sale.createdAt);
    if (selectedTimePeriod === 'today' && saleDate !== targetDateStr) return false;
    
    const matchesSearch = sale.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
      
    return matchesSearch;
  });

  const filteredDeliveredWOs = workOrders.filter((wo) => {
    if (wo.status !== 'Entregue') return false;
    const woDate = getLocalDateString(wo.updatedAt);
    if (selectedTimePeriod === 'today' && woDate !== targetDateStr) return false;

    const matchesSearch = wo.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wo.bicycle.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wo.bicycle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wo.services.some(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      wo.parts.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesSearch;
  });

  // Consolidated Sales History List
  const consolidatedSales = [
    ...filteredPOSSales.map((sale) => ({
      id: sale.id,
      type: 'POS' as const,
      customerName: sale.customerName,
      createdAt: sale.createdAt,
      total: sale.total,
      description: sale.items.map(item => `${item.name} (x${item.quantity})`).join(', '),
      original: sale
    })),
    ...filteredDeliveredWOs.map((wo) => ({
      id: wo.id,
      type: 'WO' as const,
      customerName: wo.customer.name,
      createdAt: wo.updatedAt, // use payment/delivery date as sales trigger
      total: wo.total,
      description: `OS #${wo.orderNumber} - ${wo.bicycle.brand} ${wo.bicycle.model} (${wo.services.map(s => s.name).join(', ')})`,
      original: wo
    }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const displayedSales = consolidatedSales.filter(item => {
    if (selectedFilter === 'pos') return item.type === 'POS';
    if (selectedFilter === 'wo') return item.type === 'WO';
    return true;
  });

  const ITEMS_PER_PAGE = 4;
  const totalPages = Math.ceil(displayedSales.length / ITEMS_PER_PAGE);
  const paginatedSales = displayedSales.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // DAILY CASH INFLOW Calculation (based on actual amountPaid cash registered today)
  const posTotalToday = directSales
    .filter(sale => getLocalDateString(sale.createdAt) === targetDateStr)
    .reduce((sum, sale) => sum + (sale.amountPaid !== undefined ? sale.amountPaid : sale.total), 0);

  const woTotalToday = workOrders
    .filter(wo => wo.status === 'Entregue' && getLocalDateString(wo.updatedAt) === targetDateStr)
    .reduce((sum, wo) => sum + (wo.amountPaid !== undefined ? wo.amountPaid : wo.total), 0);

  const revenueToday = posTotalToday + woTotalToday;

  const posCountToday = directSales.filter(sale => getLocalDateString(sale.createdAt) === targetDateStr).length;
  const woCountToday = workOrders.filter(wo => wo.status === 'Entregue' && getLocalDateString(wo.updatedAt) === targetDateStr).length;
  const totalTransactionsToday = posCountToday + woCountToday;

  // Parts cost calculation for profit today
  const posPartsCostToday = directSales
    .filter(sale => getLocalDateString(sale.createdAt) === targetDateStr)
    .reduce((sum, s) => sum + s.items.reduce((itemSum, item) => itemSum + (item.quantity * item.purchasePrice), 0), 0);

  const woPartsCostToday = workOrders
    .filter(wo => wo.status === 'Entregue' && getLocalDateString(wo.updatedAt) === targetDateStr)
    .reduce((sum, wo) => sum + wo.parts.reduce((partSum, part) => partSum + (part.quantity * part.purchasePrice), 0), 0);

  const laborRevToday = workOrders
    .filter(wo => wo.status === 'Entregue' && getLocalDateString(wo.updatedAt) === targetDateStr)
    .reduce((sum, wo) => sum + wo.laborTotal, 0);

  const partsRevToday = workOrders
    .filter(wo => wo.status === 'Entregue' && getLocalDateString(wo.updatedAt) === targetDateStr)
    .reduce((sum, wo) => sum + wo.partsTotal, 0);

  const productProfitToday = (posTotalToday + partsRevToday) - (posPartsCostToday + woPartsCostToday);
  const totalProfitToday = laborRevToday + productProfitToday; // mão de obra is 100% profit for the shop

  // EXPENSE STATES
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Almoço');
  const [expensePaymentMethod, setExpensePaymentMethod] = useState<'Dinheiro' | 'Transferência'>('Dinheiro');

  // Filter expenses matching target date
  const filteredExpenses = expenses.filter(exp => {
    const expDate = getLocalDateString(exp.createdAt);
    if (selectedTimePeriod === 'today' && expDate !== targetDateStr) return false;
    return true;
  });

  const totalExpensesToday = expenses
    .filter(exp => getLocalDateString(exp.createdAt) === targetDateStr)
    .reduce((sum, exp) => sum + exp.amount, 0);

  // Net Cash Balance for Today (Revenue - Expenses)
  const netCashToday = revenueToday - totalExpensesToday;

  // Net Profit for Today (Total Profit - Expenses)
  const netProfitToday = totalProfitToday - totalExpensesToday;

  const handleAddExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseDescription.trim() || !expenseAmount) return;

    onAddExpense({
      description: expenseDescription.trim(),
      amount: Math.abs(parseFloat(expenseAmount)) || 0,
      category: expenseCategory,
      paymentMethod: expensePaymentMethod,
      createdAt: new Date().toISOString()
    });

    setExpenseDescription('');
    setExpenseAmount('');
    setExpensePaymentMethod('Dinheiro');
  };

  // SECTION: "O que entrou no dia" (What Entered Today)
  const bikesEnteredToday = workOrders.filter((wo) => getLocalDateString(wo.createdAt) === targetDateStr);

  const handlePrintDailyReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Top Heading */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-xl font-sans font-black text-slate-100 flex items-center gap-2.5">
            <Coins className="h-5 w-5 text-amber-500" />
            Vendas e Caixa do Dia
          </h1>
          <p className="text-xs text-slate-400">Controle financeiro diário, histórico de vendas de balcão e registos de caixa</p>
        </div>

        <div className="flex gap-2 shrink-0">
          {onOpenQuickSale && (
            <button
              onClick={onOpenQuickSale}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-full shadow-lg shadow-amber-500/10 uppercase tracking-wider cursor-pointer"
            >
              Nova Venda Direta (POS)
            </button>
          )}

          <button
            onClick={handlePrintDailyReport}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-850 text-slate-300 text-xs font-black rounded-full border border-slate-800 shadow-md cursor-pointer uppercase tracking-wider"
          >
            <Printer className="h-4 w-4" />
            Imprimir Relatório
          </button>
        </div>
      </div>

      {/* Select Target Date (Today or any selected day) - Print Hidden */}
      <div className="bg-[#111216]/60 border border-slate-800/60 rounded-3xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
          <Calendar className="h-4.5 w-4.5 text-amber-500" />
          <span>Visualizar relatório do dia:</span>
          <input
            type="date"
            value={targetDateStr}
            onChange={(e) => setTargetDateStr(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-bold focus:outline-none"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setSelectedTimePeriod('today')}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
              selectedTimePeriod === 'today'
                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                : 'text-slate-400 hover:bg-slate-800/40 border-transparent'
            }`}
          >
            Apenas Dia Selecionado
          </button>
          <button
            onClick={() => setSelectedTimePeriod('all')}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
              selectedTimePeriod === 'all'
                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                : 'text-slate-400 hover:bg-slate-800/40 border-transparent'
            }`}
          >
            Todo o Histórico
          </button>
        </div>
      </div>

      {/* 1. DAILY REPORT SECTION - "Relatório do Dia" */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Total Inflow Today */}
        <div className="bg-gradient-to-br from-[#111216] to-[#111216]/60 border border-slate-850 p-5 rounded-3xl relative overflow-hidden">
          <div className="absolute right-[-10px] bottom-[-10px] opacity-10 text-amber-500">
            <Coins className="h-24 w-24" />
          </div>
          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Dinheiro Entrado</span>
          <span className="text-2xl font-black text-amber-500 font-mono block mt-1.5">{formatKz(revenueToday)}</span>
          <p className="text-[10px] text-slate-450 mt-2">
            Recebido em caixa hoje ({totalTransactionsToday} transações)
          </p>
        </div>

        {/* Total Outflows (Expenses) Today */}
        <div className="bg-gradient-to-br from-[#111216] to-[#111216]/60 border border-slate-850 p-5 rounded-3xl relative overflow-hidden">
          <div className="absolute right-[-10px] bottom-[-10px] opacity-10 text-rose-500">
            <ArrowDownLeft className="h-24 w-24" />
          </div>
          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Saídas / Despesas</span>
          <span className="text-2xl font-black text-rose-450 font-mono block mt-1.5">{formatKz(totalExpensesToday)}</span>
          <p className="text-[10px] text-slate-450 mt-2">
            Dinheiro gasto hoje ({filteredExpenses.length} saídas)
          </p>
        </div>

        {/* Net Cash Balance today */}
        <div className="bg-gradient-to-br from-[#111216] to-[#111216]/60 border border-slate-850 p-5 rounded-3xl relative overflow-hidden">
          <div className="absolute right-[-10px] bottom-[-10px] opacity-10 text-sky-500">
            <TrendingUp className="h-24 w-24" />
          </div>
          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Saldo do Dia em Caixa</span>
          <span className={`text-2xl font-black font-mono block mt-1.5 ${netCashToday >= 0 ? 'text-sky-400' : 'text-rose-500'}`}>{formatKz(netCashToday)}</span>
          <p className="text-[10px] text-slate-450 mt-2">Faturação menos Despesas</p>
        </div>

        {/* Real Net Profit today */}
        <div className="bg-gradient-to-br from-[#111216] to-[#111216]/60 border border-slate-850 p-5 rounded-3xl relative overflow-hidden">
          <div className="absolute right-[-10px] bottom-[-10px] opacity-10 text-emerald-500">
            <CheckCircle className="h-24 w-24" />
          </div>
          <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider block">Lucro Líquido Real</span>
          <span className={`text-2xl font-black font-mono block mt-1.5 ${netProfitToday >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>{formatKz(netProfitToday)}</span>
          <p className="text-[10px] text-slate-450 mt-2">Lucro de peças + M.O. - Despesas</p>
        </div>

      </div>

      {/* Splits details of Daily Register */}
      <div className="bg-[#111216]/60 border border-slate-800/60 p-5 rounded-3xl space-y-4">
        <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider border-b border-slate-850 pb-2.5">
          Resumo do Fechamento de Caixa ({new Date(targetDateStr + 'T00:00:00').toLocaleDateString('pt-AO')})
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs font-medium">
          <div className="p-4 bg-[#0a0b0d]/50 border border-slate-850 rounded-2xl space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Venda Direta (Balcão POS)</span>
            <span className="text-sm font-black text-slate-200 block font-mono">{formatKz(posTotalToday)}</span>
            <span className="text-[10px] text-slate-455 block">{posCountToday} clientes atendidos</span>
          </div>

          <div className="p-4 bg-[#0a0b0d]/50 border border-slate-850 rounded-2xl space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Serviços Técnicos (Mão de Obra)</span>
            <span className="text-sm font-black text-slate-200 block font-mono">{formatKz(laborRevToday)}</span>
            <span className="text-[10px] text-slate-455 block">{woCountToday} entregas efetuadas</span>
          </div>

          <div className="p-4 bg-[#0a0b0d]/50 border border-slate-850 rounded-2xl space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Venda de Stock na Oficina</span>
            <span className="text-sm font-black text-slate-200 block font-mono">{formatKz(partsRevToday)}</span>
            <span className="text-[10px] text-slate-455 block">Peças de ordens de serviço</span>
          </div>

          <div className="p-4 bg-rose-950/10 border border-rose-950/40 rounded-2xl space-y-1">
            <span className="text-[10px] text-rose-400/80 uppercase font-bold tracking-wider">Saídas & Despesas de Caixa</span>
            <span className="text-sm font-black text-rose-400 block font-mono">{formatKz(totalExpensesToday)}</span>
            <span className="text-[10px] text-rose-500/80 block">{filteredExpenses.length} registos de saídas</span>
          </div>
        </div>
      </div>

      {/* Two Column Grid: "Histórico de Vendas" (Left) & "O que entrou no dia" (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Sales history (Takes 2 cols) */}
        <div className="lg:col-span-2 bg-[#111216]/60 border border-slate-800/60 rounded-3xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <ClipboardList className="h-4.5 w-4.5 text-amber-500" />
                Histórico e Fluxo de Vendas
              </h2>
              <p className="text-[10px] text-slate-500">Transações de balcão e encerramentos de ordens de serviço de oficina</p>
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2 bg-[#0a0b0d]/60 p-1 border border-slate-850 rounded-2xl shrink-0">
              <button
                type="button"
                onClick={() => setSelectedFilter('all')}
                className={`px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  selectedFilter === 'all'
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Todas
              </button>
              <button
                type="button"
                onClick={() => setSelectedFilter('pos')}
                className={`px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  selectedFilter === 'pos'
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Balcão
              </button>
              <button
                type="button"
                onClick={() => setSelectedFilter('wo')}
                className={`px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  selectedFilter === 'wo'
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Oficina
              </button>
            </div>
          </div>

          {/* Search filter in History */}
          <div className="flex gap-2.5 items-center bg-[#0a0b0d]/50 border border-slate-800/80 rounded-2xl px-4 py-2 text-xs">
            <Search className="h-4 w-4 text-slate-500 shrink-0" />
            <input
              type="text"
              placeholder="Pesquisar por cliente, acessório, peças..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent focus:outline-none placeholder-slate-650 font-semibold"
            />
          </div>

          {displayedSales.length === 0 ? (
            <div className="p-16 text-center text-xs text-slate-500 italic bg-[#0a0b0d]/30 border border-slate-850 rounded-2xl">
              Nenhuma transação registrada no período correspondente à pesquisa.
            </div>
          ) : (
            <div className="space-y-3.5 overflow-y-auto max-h-[500px] pr-1">
              {paginatedSales.map((sale) => (
                <div
                  key={sale.id}
                  className="bg-[#0a0b0d]/60 border border-slate-850 p-4 rounded-2xl flex items-center justify-between gap-4 hover:border-slate-800 transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                        sale.type === 'POS'
                          ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                      }`}>
                        {sale.type === 'POS' ? 'Venda Balcão' : 'Ordem Serviço'}
                      </span>
                      
                      {/* Payment condition badge */}
                      {sale.type === 'POS' ? (
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                          (sale.original as DirectSale).paymentStatus === 'Pago Integral'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : (sale.original as DirectSale).paymentStatus === 'Pago 50%'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                          {((sale.original as DirectSale).paymentStatus || 'Pago Integral') + ' (' + ((sale.original as DirectSale).paymentMethod || 'Dinheiro') + ')'}
                        </span>
                      ) : (
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                          (sale.original as WorkOrder).paymentStatus === 'Pago Integral'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : (sale.original as WorkOrder).paymentStatus === 'Pago 50%'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                          {((sale.original as WorkOrder).paymentStatus || 'Pendente') + (((sale.original as WorkOrder).paymentStatus && (sale.original as WorkOrder).paymentStatus !== 'Pendente') ? ' (' + ((sale.original as WorkOrder).paymentMethod || 'Dinheiro') + ')' : '')}
                        </span>
                      )}

                      <span className="text-[10px] text-slate-550 font-medium">
                        {new Date(sale.createdAt).toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })} - {new Date(sale.createdAt).toLocaleDateString('pt-AO')}
                      </span>
                    </div>

                    <h4 className="text-xs font-black text-slate-200 truncate">{sale.customerName}</h4>
                    <p className="text-[11px] text-slate-500 truncate">{sale.description}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right flex flex-col items-end">
                      <span className="font-mono text-sm font-black text-amber-500">{formatKz(sale.total)}</span>
                      
                      {/* Quick settle button */}
                      {sale.type === 'POS' && (() => {
                        const orig = sale.original as DirectSale;
                        const outstanding = orig.total - (orig.amountPaid || 0);
                        if (outstanding > 0 && onEditDirectSale) {
                          return (
                            <div className="flex flex-col gap-0.5 items-end mt-1">
                              <span className="text-[7px] text-slate-500 uppercase font-black">Liquidar via:</span>
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEditDirectSale({
                                      ...orig,
                                      paymentStatus: 'Pago Integral',
                                      paymentMethod: 'Dinheiro',
                                      amountPaid: orig.total
                                    });
                                  }}
                                  className="text-[8px] bg-[#05c46b] hover:bg-[#05c46b]/85 text-slate-950 font-extrabold px-1.5 py-0.5 rounded cursor-pointer transition-all uppercase tracking-wider"
                                >
                                  Cash
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEditDirectSale({
                                      ...orig,
                                      paymentStatus: 'Pago Integral',
                                      paymentMethod: 'Transferência',
                                      amountPaid: orig.total
                                    });
                                  }}
                                  className="text-[8px] bg-[#05c46b] hover:bg-[#05c46b]/85 text-slate-950 font-extrabold px-1.5 py-0.5 rounded cursor-pointer transition-all uppercase tracking-wider"
                                >
                                  Transf
                                </button>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}

                      {sale.type === 'WO' && (() => {
                        const orig = sale.original as WorkOrder;
                        const outstanding = orig.total - (orig.amountPaid || 0);
                        if (outstanding > 0 && onEditWorkOrder) {
                          return (
                            <div className="flex flex-col gap-0.5 items-end mt-1">
                              <span className="text-[7px] text-slate-500 uppercase font-black">Liquidar via:</span>
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEditWorkOrder({
                                      ...orig,
                                      paymentStatus: 'Pago Integral',
                                      paymentMethod: 'Dinheiro',
                                      amountPaid: orig.total
                                    });
                                  }}
                                  className="text-[8px] bg-[#05c46b] hover:bg-[#05c46b]/85 text-slate-950 font-extrabold px-1.5 py-0.5 rounded cursor-pointer transition-all uppercase tracking-wider"
                                >
                                  Cash
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEditWorkOrder({
                                      ...orig,
                                      paymentStatus: 'Pago Integral',
                                      paymentMethod: 'Transferência',
                                      amountPaid: orig.total
                                    });
                                  }}
                                  className="text-[8px] bg-[#05c46b] hover:bg-[#05c46b]/85 text-slate-950 font-extrabold px-1.5 py-0.5 rounded cursor-pointer transition-all uppercase tracking-wider"
                                >
                                  Transf
                                </button>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => {
                        if (sale.type === 'POS') {
                          setViewingSale(sale.original as DirectSale);
                        } else {
                          setViewingWO(sale.original as WorkOrder);
                        }
                      }}
                      className="p-1.5 bg-slate-900 border border-slate-800 rounded-full text-slate-400 hover:text-amber-500 hover:border-amber-500/30 transition-all cursor-pointer"
                      title="Ver Detalhes"
                    >
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center pt-5 border-t border-slate-850/60 mt-4">
              <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">
                Página {currentPage} de {totalPages} ({displayedSales.length} transações)
              </span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 disabled:opacity-30 disabled:hover:bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-black text-slate-300 transition-all cursor-pointer uppercase tracking-wider"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 disabled:opacity-30 disabled:hover:bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-black text-slate-300 transition-all cursor-pointer uppercase tracking-wider"
                >
                  Seguinte
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: "Movimentação e Caixa" (Workshop Entries & Cash Outflows) */}
        <div className="bg-[#111216]/60 border border-slate-800/60 rounded-3xl p-6 space-y-6 font-medium">
          <div>
            <h2 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="h-4.5 w-4.5 text-amber-500" />
              Movimentação e Fluxo de Caixa
            </h2>
            <p className="text-[10px] text-slate-500">Entradas de oficina e saídas registadas no dia selecionado</p>
          </div>

          {/* Sub-section 1: Bicycles / Jobs entered today */}
          <div className="space-y-3.5">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-850 pb-1.5 flex justify-between items-center">
              <span>Bicicletas / Entrada Oficina</span>
              <span className="text-[9px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 font-mono font-bold">
                {bikesEnteredToday.length} hoje
              </span>
            </h3>

            {bikesEnteredToday.length === 0 ? (
              <p className="text-[10px] text-slate-500 italic py-2 text-center bg-[#0a0b0d]/30 border border-slate-850 rounded-xl">
                Nenhuma nova bicicleta registrada hoje.
              </p>
            ) : (
              <div className="space-y-2">
                {bikesEnteredToday.map((wo) => (
                  <div key={wo.id} className="p-2.5 bg-[#0a0b0d]/50 border border-slate-850 rounded-xl space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-slate-300">OS #{wo.orderNumber}</span>
                      <span className="text-[9px] text-amber-500 bg-amber-500/5 px-1.5 py-0.5 rounded font-bold border border-amber-500/10">{wo.status}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Bike className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      <span className="font-semibold truncate">{wo.bicycle.brand} {wo.bicycle.model}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate">Dono: <strong className="text-slate-450">{wo.customer.name}</strong></p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sub-section 2: Registo de Saídas de Caixa */}
          <div className="space-y-4 pt-4 border-t border-slate-850">
            <div>
              <h3 className="text-[10px] font-black text-rose-450 uppercase tracking-wider flex items-center gap-1.5">
                <ArrowDownLeft className="h-4 w-4" />
                Registrar Saída (Despesa)
              </h3>
              <p className="text-[10px] text-slate-500">Adicione pequenos gastos do dia (Ex: almoço, táxi, insumos)</p>
            </div>

            <form onSubmit={handleAddExpenseSubmit} className="space-y-2.5">
              <div>
                <input
                  type="text"
                  placeholder="Ex: Almoço da Equipa, Táxi..."
                  value={expenseDescription}
                  onChange={(e) => setExpenseDescription(e.target.value)}
                  className="w-full bg-[#0a0b0d]/80 border border-slate-855 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-650 focus:outline-none focus:border-amber-500/40"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <input
                    type="number"
                    placeholder="Valor (Kz)"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    className="w-full bg-[#0a0b0d]/80 border border-slate-855 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-650 focus:outline-none focus:border-amber-500/40 font-mono"
                    required
                  />
                  <span className="absolute right-3 top-2 text-[9px] text-slate-500 font-bold">Kz</span>
                </div>

                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  className="w-full bg-[#0a0b0d]/80 border border-slate-855 rounded-xl px-3 py-2 text-xs text-slate-400 focus:outline-none focus:border-amber-500/40 font-bold"
                >
                  <option value="Almoço" className="bg-[#111216] text-slate-200">Almoço</option>
                  <option value="Transporte" className="bg-[#111216] text-slate-200">Transporte</option>
                  <option value="Consumíveis" className="bg-[#111216] text-slate-200">Consumíveis</option>
                  <option value="Serviços" className="bg-[#111216] text-slate-200">Serviços</option>
                  <option value="Outros" className="bg-[#111216] text-slate-200">Outros</option>
                </select>
              </div>

              <div>
                <span className="text-[8px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">Meio de Pagamento:</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setExpensePaymentMethod('Dinheiro')}
                    className={`py-1 rounded-lg border text-[9px] font-extrabold transition-all text-center cursor-pointer uppercase tracking-wider ${
                      expensePaymentMethod === 'Dinheiro'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 font-black'
                        : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpensePaymentMethod('Transferência')}
                    className={`py-1 rounded-lg border text-[9px] font-extrabold transition-all text-center cursor-pointer uppercase tracking-wider ${
                      expensePaymentMethod === 'Transferência'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 font-black'
                        : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    Transf.
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/30 text-rose-400 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                Registar Gasto
              </button>
            </form>

            {/* List of expenses today */}
            <div className="space-y-2.5 pt-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Histórico de Saídas ({filteredExpenses.length})
              </span>

              {filteredExpenses.length === 0 ? (
                <p className="text-[10px] text-slate-500 italic py-3 text-center bg-[#0a0b0d]/20 border border-slate-850 rounded-xl">
                  Nenhuma despesa ou saída registrada neste período.
                </p>
              ) : (
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {filteredExpenses.map((exp) => (
                    <div
                      key={exp.id}
                      className="p-2.5 bg-[#0a0b0d]/40 border border-slate-850 rounded-xl flex items-center justify-between gap-3 hover:border-slate-800 transition-colors"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] px-1.5 py-0.5 bg-rose-500/10 text-rose-450 border border-rose-500/15 rounded-full font-bold">
                            {exp.category}
                          </span>
                          <span className="text-[9px] text-slate-500 font-mono">
                            {new Date(exp.createdAt).toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })} • {exp.paymentMethod || 'Dinheiro'}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-350 truncate">{exp.description}</h4>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono text-xs font-black text-rose-450">-{formatKz(exp.amount)}</span>
                        <button
                          type="button"
                          onClick={() => onDeleteExpense(exp.id)}
                          className="p-1 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar Gasto"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* POS Direct Sale Detail Modal Overlay */}
      {viewingSale && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl max-w-xl w-full p-6 relative border border-slate-200 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Recibo de Venda de Balcão (POS)</h3>
              <button
                type="button"
                onClick={() => setViewingSale(null)}
                className="p-1 text-slate-450 hover:text-slate-800 rounded-full border border-slate-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="text-center pb-3 border-b border-dashed border-slate-250 space-y-1">
                <span className="text-2xl font-black text-amber-800 tracking-tighter">BIKE ONE</span>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Luanda, Angola</p>
                <p className="text-[10px] text-slate-405">Data: {new Date(viewingSale.createdAt).toLocaleString('pt-AO')}</p>
              </div>

              <div className="text-xs space-y-1 bg-slate-50 p-2.5 border border-slate-150 rounded-xl">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Cliente:</span>
                <p className="font-extrabold text-slate-800 text-sm">{viewingSale.customerName}</p>
              </div>

              {/* Items */}
              <div className="space-y-2 py-1">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Artigos & Descontos:</p>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {viewingSale.items.map((item, index) => {
                    const lineTotal = (item.unitPrice - (item.discount || 0)) * item.quantity;
                    return (
                      <div key={index} className="flex justify-between items-start text-xs border-b border-slate-100 pb-1.5 last:border-0 last:pb-0">
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-800 truncate">{item.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            Qtd: {item.quantity} x {formatKz(item.unitPrice)}
                            {item.discount ? <span className="text-rose-600 font-semibold ml-1">(-{formatKz(item.discount)} un)</span> : null}
                          </p>
                        </div>
                        <span className="font-mono font-bold text-slate-800 shrink-0 ml-4">{formatKz(lineTotal)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Financial calculations */}
              <div className="pt-3 border-t border-dashed border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-650 font-medium">
                  <span>Subtotal Geral:</span>
                  <span className="font-mono text-slate-800">
                    {formatKz(viewingSale.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0))}
                  </span>
                </div>
                {(() => {
                  const totalDisc = viewingSale.items.reduce((sum, item) => sum + ((item.discount || 0) * item.quantity), 0);
                  if (totalDisc > 0) {
                    return (
                      <div className="flex justify-between text-rose-600 font-bold">
                        <span>Total Descontos Aplicados:</span>
                        <span className="font-mono">-{formatKz(totalDisc)}</span>
                      </div>
                    );
                  }
                  return null;
                })()}

                <div className="flex justify-between text-sm font-black text-slate-950 border-t border-slate-200 pt-2">
                  <span>VALOR TOTAL VENDA:</span>
                  <span className="font-mono text-amber-800">{formatKz(viewingSale.total)}</span>
                </div>

                <div className="border-t border-dashed border-slate-200 pt-2.5 mt-1 space-y-1 text-[11px]">
                  <div className="flex justify-between font-bold text-slate-700">
                    <span>Estado de Pagamento:</span>
                    <span className="uppercase text-amber-800">{viewingSale.paymentStatus || 'Pago Integral'}</span>
                  </div>
                  <div className="flex justify-between font-medium text-slate-650">
                    <span>Valor Pago (Sinal):</span>
                    <span className="font-mono text-slate-800">{formatKz(viewingSale.amountPaid || 0)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-850 border-t border-slate-100 pt-1 text-xs">
                    <span>Valor Pendente:</span>
                    <span className="font-mono text-rose-700">{formatKz(Math.max(0, viewingSale.total - (viewingSale.amountPaid || 0)))}</span>
                  </div>
                </div>

                {/* Settle outstanding direct sale payment inside modal */}
                {(() => {
                  const outstanding = viewingSale.total - (viewingSale.amountPaid || 0);
                  if (outstanding > 0 && onEditDirectSale) {
                    return (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = {
                            ...viewingSale,
                            paymentStatus: 'Pago Integral' as const,
                            amountPaid: viewingSale.total
                          };
                          onEditDirectSale(updated);
                          setViewingSale(updated);
                        }}
                        className="w-full mt-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-full text-xs shadow-lg shadow-emerald-600/10 transition-all uppercase tracking-wider cursor-pointer"
                      >
                        Liquidar Restante ({formatKz(outstanding)})
                      </button>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Viewer Modal Overlay for OS */}
      {viewingWO && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 relative border border-slate-200 shadow-2xl space-y-6">
            
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Detalhamento Técnico de Fatura</h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-500 text-slate-950 hover:bg-amber-400 text-[10px] font-black rounded-full uppercase cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" /> Imprimir
                </button>
                <button
                  type="button"
                  onClick={() => setViewingWO(null)}
                  className="p-1.5 text-slate-500 hover:text-slate-800 rounded-full border border-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {/* Invoice Header */}
              <div className="flex justify-between items-start gap-4 pb-6 border-b border-slate-200">
                <div className="space-y-2">
                  <span className="text-2xl font-black tracking-tighter text-amber-800">BIKE ONE</span>
                  <div className="text-[11px] text-slate-500 font-medium">
                    <p>Bike One - Oficina de Bicicletas & Acessórios Premium</p>
                    <p>Avenida Pedro de Castro Van-Dúnem Loy, Luanda, Angola</p>
                    <p>Contacto: +244 923 000 000 | geral@bikeone.ao</p>
                  </div>
                </div>

                <div className="text-right space-y-1 shrink-0">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Ordem de Serviço</span>
                  <span className="text-2xl font-black font-mono text-slate-850 block">#{viewingWO.orderNumber}</span>
                  <span className="inline-block text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 border border-slate-200">
                    {viewingWO.status}
                  </span>
                  <p className="text-[10px] text-slate-500 pt-1">Emitido: {new Date(viewingWO.createdAt).toLocaleDateString('pt-AO')}</p>
                </div>
              </div>

              {/* Client & Bike */}
              <div className="grid grid-cols-2 gap-6 py-6 border-b border-slate-200 text-xs">
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cliente:</h4>
                  <div className="space-y-1 font-medium text-slate-700">
                    <p className="font-extrabold text-slate-900 text-sm">{viewingWO.customer.name}</p>
                    <p>Contacto: {viewingWO.customer.phone}</p>
                    {viewingWO.customer.email && <p>Email: {viewingWO.customer.email}</p>}
                    {viewingWO.customer.address && <p>Morada: {viewingWO.customer.address}</p>}
                    {viewingWO.customer.notes && <p className="text-[10px] bg-amber-50 p-1 border border-amber-100 rounded text-amber-800 mt-1">Obs: {viewingWO.customer.notes}</p>}
                  </div>
                </div>

                <div className="space-y-2 border-l border-slate-200 pl-6">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bicicleta:</h4>
                  <div className="space-y-1 font-medium text-slate-700">
                    <p className="font-extrabold text-slate-900 text-sm">{viewingWO.bicycle.brand} {viewingWO.bicycle.model}</p>
                    {viewingWO.bicycle.color && <p>Cor: {viewingWO.bicycle.color}</p>}
                    {viewingWO.bicycle.notes && <p className="text-[10px] bg-slate-50 p-1 border border-slate-100 rounded italic text-slate-500 mt-1">Sintomas: {viewingWO.bicycle.notes}</p>}
                  </div>
                </div>
              </div>

              {/* Itemized Table inside Work Order Detail modal */}
              <div className="py-2 space-y-4">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                      <th className="py-2.5 px-3">Descrição do Serviço / Mão de Obra</th>
                      <th className="py-2.5 px-3 text-right">Desconto</th>
                      <th className="py-2.5 px-3 text-right">Valor Líquido</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingWO.services.map((s, index) => (
                      <tr key={index} className="border-b border-slate-100">
                        <td className="py-2.5 px-3 font-semibold text-slate-800 text-xs">{s.name}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-rose-600 font-bold">{s.discount ? `-${formatKz(s.discount)}` : '0 Kz'}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-800 font-bold">{formatKz(s.laborValue - (s.discount || 0))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Parts */}
                <table className="w-full text-left text-xs text-slate-700 mt-4">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                      <th className="py-2.5 px-3">Peça / Acessório Utilizado</th>
                      <th className="py-2.5 px-3 text-center w-20">Qtd.</th>
                      <th className="py-2.5 px-3 text-right w-24">Unitário</th>
                      <th className="py-2.5 px-3 text-right w-24">Desconto</th>
                      <th className="py-2.5 px-3 text-right w-28">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingWO.parts.map((p, index) => (
                      <tr key={index} className="border-b border-slate-100">
                        <td className="py-2.5 px-3 font-semibold text-slate-800 text-xs">{p.name}</td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold">{p.quantity}</td>
                        <td className="py-2.5 px-3 text-right font-mono">{formatKz(p.unitPrice)}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-rose-600 font-semibold">{p.discount ? `-${formatKz(p.discount * p.quantity)}` : '0 Kz'}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-850">{formatKz((p.unitPrice - (p.discount || 0)) * p.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals & Payments */}
              <div className="flex flex-col sm:flex-row justify-between items-end gap-4 pt-4 border-t border-slate-200">
                {/* Outstanding balance settlement button inside modal */}
                <div className="w-full sm:w-auto self-start">
                  {(() => {
                    const outstanding = viewingWO.total - (viewingWO.amountPaid || 0);
                    if (outstanding > 0 && onEditWorkOrder) {
                      return (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = {
                              ...viewingWO,
                              paymentStatus: 'Pago Integral' as const,
                              amountPaid: viewingWO.total
                            };
                            onEditWorkOrder(updated);
                            setViewingWO(updated);
                          }}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-full text-xs shadow-lg shadow-emerald-600/10 transition-all uppercase tracking-wider cursor-pointer"
                        >
                          Liquidar Restante ({formatKz(outstanding)})
                        </button>
                      );
                    }
                    return null;
                  })()}
                </div>

                <div className="w-64 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Mão de Obra Total:</span>
                    <span className="font-mono text-slate-800 font-medium">
                      {formatKz(viewingWO.services.reduce((sum, s) => sum + s.laborValue, 0))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Peças & Materiais Total:</span>
                    <span className="font-mono text-slate-800 font-medium">
                      {formatKz(viewingWO.parts.reduce((sum, p) => sum + p.unitPrice * p.quantity, 0))}
                    </span>
                  </div>
                  {(() => {
                    const totalDisc = (viewingWO.services.reduce((sum, s) => sum + (s.discount || 0), 0) + 
                                      viewingWO.parts.reduce((sum, p) => sum + (p.discount || 0) * p.quantity, 0));
                    if (totalDisc > 0) {
                      return (
                        <div className="flex justify-between text-rose-600 font-bold">
                          <span>Total Descontos:</span>
                          <span className="font-mono">-{formatKz(totalDisc)}</span>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  <div className="flex justify-between text-base font-black text-slate-900 border-t border-slate-250 pt-2">
                    <span>VALOR TOTAL OS:</span>
                    <span className="font-mono text-amber-800 font-black">{formatKz(viewingWO.total)}</span>
                  </div>

                  <div className="border-t border-dashed border-slate-200 pt-2 mt-1 space-y-1 text-[11px]">
                    <div className="flex justify-between font-bold text-slate-700">
                      <span>Estado Pagamento:</span>
                      <span className="uppercase text-amber-800">{viewingWO.paymentStatus || 'Pendente'}</span>
                    </div>
                    <div className="flex justify-between font-medium text-slate-600">
                      <span>Valor Pago (Sinal):</span>
                      <span className="font-mono text-slate-800">{formatKz(viewingWO.amountPaid || 0)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-800 border-t border-slate-100 pt-1">
                      <span>Valor Pendente:</span>
                      <span className="font-mono text-rose-700 font-black">{formatKz(Math.max(0, viewingWO.total - (viewingWO.amountPaid || 0)))}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
