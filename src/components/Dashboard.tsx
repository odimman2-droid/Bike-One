import React, { useState } from 'react';
import { motion } from 'motion/react';
import { WorkOrder, Product, DirectSale, User, BalanceAdjustment, SalaryAdvance, Expense } from '../types';
import { 
  Plus, 
  Minus,
  ShoppingCart, 
  TrendingUp, 
  Coins, 
  Trash2, 
  History, 
  Users,
  CheckCircle,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  ClipboardList
} from 'lucide-react';

interface DashboardProps {
  user: User;
  workOrders: WorkOrder[];
  products: Product[];
  directSales: DirectSale[];
  expenses: Expense[];
  balanceAdjustments: BalanceAdjustment[];
  salaryAdvances: SalaryAdvance[];
  baseBalance: number;
  onNavigate: (view: any) => void;
  onAddBalanceAdjustment: (adj: Omit<BalanceAdjustment, 'id' | 'createdAt'>) => void;
  onDeleteBalanceAdjustment: (id: string) => void;
  onAddSalaryAdvance: (adv: Omit<SalaryAdvance, 'id' | 'createdAt' | 'status'>) => void;
  onToggleSalaryAdvanceStatus: (id: string) => void;
  onDeleteSalaryAdvance: (id: string) => void;
  onOpenCreateOS: () => void;
  onOpenQuickSale: () => void;
}

export default function Dashboard({
  user,
  workOrders,
  products,
  directSales,
  expenses,
  balanceAdjustments,
  salaryAdvances,
  baseBalance,
  onNavigate,
  onAddBalanceAdjustment,
  onDeleteBalanceAdjustment,
  onAddSalaryAdvance,
  onToggleSalaryAdvanceStatus,
  onDeleteSalaryAdvance,
  onOpenCreateOS,
  onOpenQuickSale,
}: DashboardProps) {
  // Balance calculations (Dynamic Base Balance)
  const BASE_BALANCE = baseBalance;

  const adjustmentsSum = balanceAdjustments.reduce((sum, adj) => {
    if (adj.type === 'entrada') return sum + adj.amount;
    if (adj.type === 'saida' || adj.type === 'falha_venda' || adj.type === 'falta_valor') {
      return sum - adj.amount;
    }
    return sum;
  }, 0);

  const workOrdersSum = workOrders.reduce((sum, wo) => {
    if (wo.amountPaid !== undefined) return sum + wo.amountPaid;
    return wo.status === 'Entregue' ? sum + wo.total : sum;
  }, 0);

  const directSalesSum = directSales.reduce((sum, sale) => {
    if (sale.amountPaid !== undefined) return sum + sale.amountPaid;
    return sum + sale.total;
  }, 0);

  const expensesSum = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Both pending and paid advances represent actual cash leaving the safe/bank
  const salaryAdvancesSum = salaryAdvances.reduce((sum, adv) => sum + adv.amount, 0);

  const availableBalance = BASE_BALANCE + adjustmentsSum + workOrdersSum + directSalesSum - expensesSum - salaryAdvancesSum;

  // Active pending advances for employees
  const pendingAdvances = salaryAdvances.filter(adv => adv.status === 'Pendente');

  // Format currency
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

  // State controls for Forms/Views inside the Balance Window
  const [showAdjustmentForm, setShowAdjustmentForm] = useState(false);

  // Form states
  const [adjType, setAdjType] = useState<'entrada' | 'saida' | 'falha_venda' | 'falta_valor'>('entrada');
  const [adjAmount, setAdjAmount] = useState('');
  const [adjDescription, setAdjDescription] = useState('');

  // Submit Handlers
  const handleAdjSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(adjAmount);
    if (isNaN(amt) || amt <= 0 || !adjDescription.trim()) return;

    onAddBalanceAdjustment({
      type: adjType,
      amount: amt,
      description: adjDescription.trim()
    });

    setAdjAmount('');
    setAdjDescription('');
    setShowAdjustmentForm(false);
  };

  const bgImgUrl = "/src/assets/images/bike_one_bg_1784541895625.jpg";

  return (
    <div className="space-y-8" id="dashboard-view">
      {/* 1. Header (Simplificado para utilizador Bike One) */}
      <div className="flex justify-between items-center border-b border-slate-850 pb-4">
        <div>
          <h1 className="text-2xl font-sans font-black text-slate-100 tracking-tight flex items-center gap-2">
            Olá, <span className="text-amber-500">Bike One</span>!
          </h1>
          <p className="text-xs text-slate-400">
            Painel Geral de Controlo de Caixa, Vendas e Atividades.
          </p>
        </div>
        <div className="px-3 py-1.5 bg-[#111216] border border-slate-800 rounded-xl text-[10px] text-amber-500 font-extrabold uppercase tracking-wider">
          Sessão Única Ativa
        </div>
      </div>

      {/* 2. JANELA DE SALDO DISPONÍVEL (Durable Balance Control Window) */}
      <div className="bg-gradient-to-br from-[#12131a] to-[#12131a]/60 border border-slate-850 rounded-3xl overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
          <Coins className="h-44 w-44 text-amber-500" />
        </div>

        <div className="p-6 md:p-8 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="text-[10px] text-amber-500 font-black uppercase tracking-widest block mb-1">
                SALDO DISPONÍVEL EM CAIXA
              </span>
              <h2 className="text-4xl md:text-5xl font-mono font-black text-slate-100 tracking-tight">
                {formatKz(availableBalance)}
              </h2>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2.5 text-[11px] text-slate-400">
                <span>Base Inicial: <strong className="text-slate-300 font-mono">{formatKz(BASE_BALANCE)}</strong></span>
                <span>•</span>
                <span>Receitas (Vendas + OS): <strong className="text-emerald-400 font-mono">+{formatKz(workOrdersSum + directSalesSum)}</strong></span>
                <span>•</span>
                <span>Despesas & Saídas: <strong className="text-rose-400 font-mono">-{formatKz(expensesSum)}</strong></span>
              </div>
            </div>

            {/* Quick Balance Manual Modifiers */}
            <div className="flex flex-wrap gap-2 w-full md:w-auto shrink-0">
              <button
                onClick={() => {
                  setAdjType('entrada');
                  setShowAdjustmentForm(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-xl transition-all cursor-pointer flex-1 md:flex-initial justify-center"
              >
                <Plus className="h-4 w-4" />
                Adicionar
              </button>
              <button
                onClick={() => {
                  setAdjType('saida');
                  setShowAdjustmentForm(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-xs font-bold rounded-xl transition-all cursor-pointer flex-1 md:flex-initial justify-center"
              >
                <Minus className="h-4 w-4" />
                Diminuir
              </button>
            </div>
          </div>

          {/* Form: Add/Subtract Balance Adjustment */}
          {showAdjustmentForm && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#0b0c10] border border-slate-800/80 p-5 rounded-2xl space-y-4"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-250 flex items-center gap-1.5">
                  {adjType === 'entrada' ? <ArrowUpRight className="text-emerald-400" /> : <ArrowDownLeft className="text-rose-400" />}
                  Lançar Ajuste Manual de Caixa
                </h3>
                <button 
                  onClick={() => setShowAdjustmentForm(false)} 
                  className="text-xs text-slate-500 hover:text-slate-300"
                >
                  Cancelar
                </button>
              </div>

              <form onSubmit={handleAdjSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Tipo de Ajuste</label>
                  <select
                    value={adjType}
                    onChange={(e: any) => setAdjType(e.target.value)}
                    className="w-full bg-[#12131a] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-250 focus:outline-none focus:border-amber-500/40"
                  >
                    <option value="entrada">Entrada Manual (Acréscimo)</option>
                    <option value="saida">Retirada Manual (Diminuição)</option>
                    <option value="falha_venda">Correção p/ Falha de Venda (Discrepância)</option>
                    <option value="falta_valor">Falta de Valores (Quebra de Caixa)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Valor (Kz)</label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      placeholder="Ex: 5000"
                      value={adjAmount}
                      onChange={(e) => setAdjAmount(e.target.value)}
                      className="w-full bg-[#12131a] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-650 focus:outline-none focus:border-amber-500/40 font-mono"
                    />
                    <span className="absolute right-3 top-2 text-[10px] text-slate-500">Kz</span>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Motivo / Descrição</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Ex: Falha no registo da venda de pneu, falta de troco..."
                      value={adjDescription}
                      onChange={(e) => setAdjDescription(e.target.value)}
                      className="w-full bg-[#12131a] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-650 focus:outline-none focus:border-amber-500/40"
                    />
                    <button
                      type="submit"
                      className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl cursor-pointer shrink-0 transition-colors"
                    >
                      Registar
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          )}

          {/* History of Manual Adjustments */}
          <div className="pt-4 border-t border-slate-850/60">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 mb-4">
              Ajustes Manuais de Caixa ({balanceAdjustments.length})
            </h3>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {balanceAdjustments.length === 0 ? (
                <p className="text-xs text-slate-550 italic py-6 text-center bg-[#0a0b0d]/20 border border-slate-850 rounded-2xl">
                  Nenhum ajuste manual de saldo efetuado.
                </p>
              ) : (
                balanceAdjustments.map((adj) => {
                  const isAddition = adj.type === 'entrada';
                  const labelMap = {
                    entrada: 'Depósito Manual',
                    saida: 'Retirada Manual',
                    falha_venda: 'Falha de Venda',
                    falta_valor: 'Falta de Valores'
                  };
                  return (
                    <div
                      key={adj.id}
                      className="p-3 bg-[#0a0b0d]/50 border border-slate-850 rounded-2xl flex items-center justify-between gap-4 hover:border-slate-800 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase border ${
                            isAddition 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}>
                            {labelMap[adj.type]}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(adj.createdAt).toLocaleString('pt-AO', { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-300 mt-1">{adj.description}</h4>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`font-mono text-xs font-black ${isAddition ? 'text-emerald-400' : 'text-rose-450'}`}>
                          {isAddition ? '+' : '-'}{formatKz(adj.amount)}
                        </span>
                        <button
                          onClick={() => onDeleteBalanceAdjustment(adj.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Remover Ajuste"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. BOTÕES PRINCIPAIS DE FLUXO (The 3 Request-Centric Quick Actions) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* BOTÃO 1: CRIAR VENDAS (POS Direct modal) */}
        <motion.div
          whileHover={{ y: -3 }}
          onClick={onOpenQuickSale}
          className="bg-gradient-to-br from-[#111216] to-[#111216]/60 border border-slate-800 hover:border-amber-500/20 p-6 rounded-3xl cursor-pointer transition-all flex flex-col justify-between h-52 group relative overflow-hidden shadow-lg"
        >
          <div className="absolute right-[-15px] bottom-[-15px] opacity-5 text-amber-500 group-hover:scale-110 transition-transform">
            <ShoppingCart className="h-32 w-32" />
          </div>
          <div className="p-4 bg-amber-500/10 text-amber-500 rounded-2xl w-fit">
            <ShoppingCart className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">Registos & Balanço POS</span>
            <h3 className="text-lg font-sans font-black text-slate-200 mt-0.5 group-hover:text-amber-500 transition-colors">
              Criar Vendas
            </h3>
            <p className="text-[11px] text-slate-455 mt-1 max-w-xs leading-relaxed">
              Inicie uma nova venda rápida de peças ou acessórios diretamente no ponto de venda com método de pagamento personalizado.
            </p>
          </div>
        </motion.div>

        {/* BOTÃO 2: NOVA ORDEM DE SERVIÇOS */}
        <motion.div
          whileHover={{ y: -3 }}
          onClick={onOpenCreateOS}
          className="bg-gradient-to-br from-[#111216] to-[#111216]/60 border border-slate-800 hover:border-amber-500/20 p-6 rounded-3xl cursor-pointer transition-all flex flex-col justify-between h-52 group relative overflow-hidden shadow-lg"
        >
          <div className="absolute right-[-15px] bottom-[-15px] opacity-5 text-amber-400 group-hover:scale-110 transition-transform">
            <ClipboardList className="h-32 w-32" />
          </div>
          <div className="p-4 bg-amber-500/10 text-amber-500 rounded-2xl w-fit">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">Reparações & Montagens</span>
            <h3 className="text-lg font-sans font-black text-slate-200 mt-0.5 group-hover:text-amber-500 transition-colors">
              Nova Ordem de Serviços
            </h3>
            <p className="text-[11px] text-slate-455 mt-1 max-w-xs leading-relaxed">
              Abra a ficha de reparação de bicicletas para registar marca, modelo, peças, mão de obra e descontos para o cliente.
            </p>
          </div>
        </motion.div>

        {/* BOTÃO 3: RELATÓRIO DO DIA */}
        <motion.div
          whileHover={{ y: -3 }}
          onClick={() => onNavigate('relatorios')}
          className="bg-gradient-to-br from-[#111216] to-[#111216]/60 border border-slate-800 hover:border-amber-500/20 p-6 rounded-3xl cursor-pointer transition-all flex flex-col justify-between h-52 group relative overflow-hidden shadow-lg"
        >
          <div className="absolute right-[-15px] bottom-[-15px] opacity-5 text-amber-500 group-hover:scale-110 transition-transform">
            <TrendingUp className="h-32 w-32" />
          </div>
          <div className="p-4 bg-amber-500/10 text-amber-500 rounded-2xl w-fit">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">Balanço de Resultados</span>
            <h3 className="text-lg font-sans font-black text-slate-200 mt-0.5 group-hover:text-amber-500 transition-colors">
              Relatório do Dia
            </h3>
            <p className="text-[11px] text-slate-455 mt-1 max-w-xs leading-relaxed">
              Consulte gráficos detalhados de faturamento, custos de peças, fechamento diário e lucros líquidos acumulados.
            </p>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
