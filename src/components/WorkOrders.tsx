import React, { useState } from 'react';
import { motion } from 'motion/react';
import { WorkOrder, Service, Product, Customer, Bicycle, WorkOrderStatus } from '../types';
import { 
  ClipboardList, 
  Plus, 
  Search, 
  Filter, 
  Bike, 
  User, 
  Wrench, 
  Package, 
  Printer, 
  Clock, 
  Eye, 
  CheckCircle, 
  Trash2, 
  Edit,
  AlertCircle,
  FileText
} from 'lucide-react';

interface WorkOrdersProps {
  workOrders: WorkOrder[];
  services: Service[];
  products: Product[];
  onAddWorkOrder: (wo: Omit<WorkOrder, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>) => void;
  onEditWorkOrder: (wo: WorkOrder) => void;
  onDeleteWorkOrder: (id: string) => void;
  initialTab?: 'list' | 'create';
}

const STATUS_OPTS: (WorkOrderStatus | 'Todos')[] = ['Todos', 'Orçamento', 'Aprovado', 'Em Execução', 'Pronto', 'Entregue'];

export default function WorkOrders({
  workOrders,
  services,
  products,
  onAddWorkOrder,
  onEditWorkOrder,
  onDeleteWorkOrder,
  initialTab = 'list',
}: WorkOrdersProps) {
  // Navigation & filtering states
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<WorkOrderStatus | 'Todos'>('Todos');
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'invoice'>(initialTab);
  const [currentPage, setCurrentPage] = useState(1);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedStatus]);

  // Form State
  const [editingWOId, setEditingWOId] = useState<string | null>(null);
  const [customerForm, setCustomerForm] = useState<Customer>({ name: '', phone: '', email: '', address: '', notes: '' });
  const [bikeForm, setBikeForm] = useState<Bicycle>({ brand: '', model: '', color: '', notes: '' });
  const [selectedServices, setSelectedServices] = useState<{ serviceId: string; name: string; laborValue: number; discount?: number }[]>([]);
  const [selectedParts, setSelectedParts] = useState<{ productId: string; name: string; quantity: number; unitPrice: number; purchasePrice: number; discount?: number }[]>([]);
  const [generalNotes, setGeneralNotes] = useState('');
  const [woStatus, setWOStatus] = useState<WorkOrderStatus>('Orçamento');
  const [paymentStatus, setPaymentStatus] = useState<'Pendente' | 'Pago 50%' | 'Pago Integral'>('Pendente');
  const [paymentMethod, setPaymentMethod] = useState<'Dinheiro' | 'Transferência'>('Dinheiro');
  const [formError, setFormError] = useState('');

  // Invoice view state
  const [viewingWO, setViewingWO] = useState<WorkOrder | null>(null);

  // Computed values for current form (accounting for discounts)
  const laborTotal = selectedServices.reduce((sum, s) => sum + (s.laborValue - (s.discount || 0)), 0);
  const partsTotal = selectedParts.reduce((sum, p) => sum + ((p.unitPrice - (p.discount || 0)) * p.quantity), 0);
  const formTotal = laborTotal + partsTotal;

  // Helpers for adding parts / services to draft
  const [tempServiceId, setTempServiceId] = useState('');
  const [tempProductId, setTempProductId] = useState('');
  const [tempPartQty, setTempPartQty] = useState(1);

  const handleAddServiceToDraft = () => {
    if (!tempServiceId) return;
    const s = services.find((serv) => serv.id === tempServiceId);
    if (!s) return;

    // Avoid duplicate service additions
    if (selectedServices.some((item) => item.serviceId === s.id)) {
      alert('Este serviço já foi adicionado a esta Ordem de Serviço.');
      return;
    }

    setSelectedServices([...selectedServices, { serviceId: s.id, name: s.name, laborValue: s.laborValue }]);
    setTempServiceId('');
  };

  const handleAddPartToDraft = () => {
    if (!tempProductId) return;
    const p = products.find((prod) => prod.id === tempProductId);
    if (!p) return;

    if (tempPartQty <= 0) {
      alert('A quantidade deve ser superior a 0.');
      return;
    }

    // Check stock limit
    if (p.quantity < tempPartQty) {
      alert(`Quantidade em stock insuficiente! Apenas ${p.quantity} unidades disponíveis.`);
      return;
    }

    // If duplicate, merge quantity
    const existingIndex = selectedParts.findIndex((item) => item.productId === p.id);
    if (existingIndex > -1) {
      const updatedParts = [...selectedParts];
      const newQty = updatedParts[existingIndex].quantity + tempPartQty;
      if (p.quantity < newQty) {
        alert(`Quantidade em stock insuficiente! O stock possui ${p.quantity} e você está tentando adicionar ${newQty}.`);
        return;
      }
      updatedParts[existingIndex].quantity = newQty;
      setSelectedParts(updatedParts);
    } else {
      setSelectedParts([
        ...selectedParts,
        { 
          productId: p.id, 
          name: p.name, 
          quantity: tempPartQty, 
          unitPrice: p.salePrice, 
          purchasePrice: p.purchasePrice 
        }
      ]);
    }

    setTempProductId('');
    setTempPartQty(1);
  };

  const handleRemoveServiceFromDraft = (index: number) => {
    setSelectedServices(selectedServices.filter((_, i) => i !== index));
  };

  const handleRemovePartFromDraft = (index: number) => {
    setSelectedParts(selectedParts.filter((_, i) => i !== index));
  };

  // Open Form for CREATE
  const handleOpenCreate = () => {
    setEditingWOId(null);
    setCustomerForm({ name: '', phone: '', email: '', address: '', notes: '' });
    setBikeForm({ brand: '', model: '', color: '', notes: '' });
    setSelectedServices([]);
    setSelectedParts([]);
    setGeneralNotes('');
    setWOStatus('Orçamento');
    setPaymentStatus('Pendente');
    setPaymentMethod('Dinheiro');
    setFormError('');
    setActiveTab('create');
  };

  // Open Form for EDIT
  const handleOpenEdit = (wo: WorkOrder) => {
    setEditingWOId(wo.id);
    setCustomerForm({ ...wo.customer });
    setBikeForm({ ...wo.bicycle });
    setSelectedServices([...wo.services]);
    setSelectedParts([...wo.parts]);
    setGeneralNotes(wo.notes || '');
    setWOStatus(wo.status);
    setPaymentStatus(wo.paymentStatus || 'Pendente');
    setPaymentMethod(wo.paymentMethod || 'Dinheiro');
    setFormError('');
    setActiveTab('create');
  };

  // Submit OS Form
  const handleSubmitOS = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerForm.name.trim()) {
      setFormError('O nome do cliente é obrigatório.');
      return;
    }
    if (!customerForm.phone.trim()) {
      setFormError('O contacto telefónico do cliente é obrigatório.');
      return;
    }
    if (!bikeForm.brand.trim() || !bikeForm.model.trim()) {
      setFormError('A marca e modelo da bicicleta são obrigatórios.');
      return;
    }
    if (selectedServices.length === 0) {
      setFormError('Adicione pelo menos um serviço de manutenção.');
      return;
    }

    setFormError('');

    const finalAmountPaid = paymentStatus === 'Pendente' ? 0 
                          : paymentStatus === 'Pago 50%' ? Math.round(formTotal * 0.5) 
                          : formTotal;

    const woPayload = {
      customer: customerForm,
      bicycle: bikeForm,
      services: selectedServices,
      parts: selectedParts,
      laborTotal,
      partsTotal,
      total: formTotal,
      status: woStatus,
      notes: generalNotes,
      paymentStatus,
      amountPaid: finalAmountPaid,
      paymentMethod,
    };

    if (editingWOId) {
      // Find original to preserve creation date
      const original = workOrders.find((w) => w.id === editingWOId);
      if (original) {
        onEditWorkOrder({
          ...original,
          ...woPayload,
          updatedAt: new Date().toISOString()
        });
      }
    } else {
      onAddWorkOrder(woPayload);
    }

    setActiveTab('list');
  };

  const handleViewInvoice = (wo: WorkOrder) => {
    setViewingWO(wo);
    setActiveTab('invoice');
  };

  const handleDeleteOS = (id: string) => {
    if (confirm('Tem certeza de que deseja excluir esta Ordem de Serviço?')) {
      onDeleteWorkOrder(id);
    }
  };

  // Quick state change helper
  const handleQuickStatusChange = (wo: WorkOrder, nextStatus: WorkOrderStatus) => {
    onEditWorkOrder({
      ...wo,
      status: nextStatus,
      updatedAt: new Date().toISOString()
    });
  };

  // Print triggers standard browser print
  const handlePrint = () => {
    window.print();
  };

  // Filtered Orders
  const filteredOrders = workOrders.filter((wo) => {
    const matchesSearch = wo.customer.name.toLowerCase().includes(search.toLowerCase()) || 
                          wo.customer.phone.includes(search) || 
                          wo.bicycle.brand.toLowerCase().includes(search.toLowerCase()) || 
                          wo.bicycle.model.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = selectedStatus === 'Todos' || wo.status === selectedStatus;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => b.orderNumber - a.orderNumber);

  // Formatting helper
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

  const statusColorMap = {
    'Orçamento': 'bg-slate-800 text-slate-400 border-slate-700',
    'Aprovado': 'bg-blue-950 text-blue-300 border-blue-900/40',
    'Em Execução': 'bg-amber-950 text-amber-300 border-amber-900/40',
    'Pronto': 'bg-emerald-950 text-emerald-300 border-emerald-900/40',
    'Entregue': 'bg-slate-950 text-slate-500 border-slate-900',
  };

  const ITEMS_PER_PAGE = 4;
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6" id="work-orders-view">
      
      {/* HEADER SECTION - Hidden during printing */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-xl font-sans font-black text-slate-100 flex items-center gap-2.5">
            <ClipboardList className="h-5 w-5 text-amber-500" />
            Ordens de Serviço (OS)
          </h1>
          <p className="text-xs text-slate-400">Registre reparações, orçamentos, montagens e entregas</p>
        </div>
        <div className="flex gap-2">
          {activeTab !== 'list' && (
            <button
              onClick={() => setActiveTab('list')}
              className="px-4 py-2.5 bg-[#111216] hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-full border border-slate-800/80 transition-colors cursor-pointer uppercase tracking-wider text-[11px]"
            >
              Voltar à Lista
            </button>
          )}
          {activeTab === 'list' && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold rounded-full shadow-lg shadow-amber-500/10 transition-all active:translate-y-0.5 cursor-pointer uppercase tracking-wider text-[11px]"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              Nova Ordem de Serviço
            </button>
          )}
        </div>
      </div>

      {/* 1. LIST VIEW */}
      {activeTab === 'list' && (
        <div className="bg-[#111216]/60 border border-slate-800/60 rounded-3xl p-6 shadow-md space-y-4 print:hidden">
          {/* Search & Filters */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Pesquisar cliente, telefone, marca, modelo de bike..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#0a0b0d]/50 border border-slate-800 rounded-2xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
              />
            </div>
            
            <div className="flex bg-slate-900/50 border border-slate-800 p-0.5 rounded-full text-xs overflow-x-auto max-w-full pb-1 md:pb-0 shrink-0">
              {STATUS_OPTS.map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`px-3 py-1.5 rounded-full transition-all font-bold cursor-pointer shrink-0 ${
                    selectedStatus === status
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* List content */}
          {filteredOrders.length === 0 ? (
            <div className="py-20 text-center text-slate-500 space-y-3">
              <ClipboardList className="h-12 w-12 mx-auto stroke-1 opacity-30 text-slate-400" />
              <p className="text-sm">Nenhuma Ordem de Serviço encontrada para os filtros atuais.</p>
              <button
                onClick={handleOpenCreate}
                className="text-xs text-amber-500 hover:underline font-bold cursor-pointer"
              >
                Registrar Primeiro Serviço
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedOrders.map((wo) => (
                <div 
                  key={wo.id}
                  className="p-5 bg-[#111216] hover:bg-slate-850/25 border border-slate-850 rounded-3xl transition-all flex flex-col md:flex-row justify-between gap-4"
                >
                  {/* Left Column: Client & Bike details */}
                  <div className="space-y-2.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono text-xs font-black text-amber-500">
                        OS #{wo.orderNumber}
                      </span>
                      <span className="text-slate-500 text-[10px]">
                        Criado em: {new Date(wo.createdAt).toLocaleDateString('pt-AO')}
                      </span>
                      <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full border ${statusColorMap[wo.status]}`}>
                        {wo.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Customer info */}
                      <div className="space-y-0.5">
                        <div className="text-xs font-extrabold text-slate-100 flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                          {wo.customer.name}
                        </div>
                        <p className="text-[10px] text-slate-500 pl-5">Telefone: {wo.customer.phone}</p>
                      </div>

                      {/* Bike info */}
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                          <Bike className="h-3.5 w-3.5 text-amber-500" />
                          {wo.bicycle.brand} <span className="text-slate-100">{wo.bicycle.model}</span>
                        </div>
                        {wo.bicycle.color && (
                          <p className="text-[10px] text-slate-500 pl-5">Cor: {wo.bicycle.color}</p>
                        )}
                      </div>
                    </div>

                    {/* Service & Parts breakdown chips */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                      <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Resumo:</span>
                      {wo.services.map((s, i) => (
                        <span key={i} className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-medium">
                          {s.name}
                        </span>
                      ))}
                      {wo.parts.map((p, i) => (
                        <span key={i} className="text-[9px] bg-slate-900/50 text-slate-400 px-2 py-0.5 rounded font-mono border border-slate-800">
                          {p.name} ({p.quantity}x)
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Billed values & Action triggers */}
                  <div className="flex flex-col md:items-end justify-between border-t md:border-t-0 border-slate-850 pt-3 md:pt-0 shrink-0 md:pl-4 md:border-l md:border-slate-800/80 gap-4">
                    <div className="text-left md:text-right space-y-0.5">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Total Faturado</span>
                      <span className="text-lg font-black text-slate-100 font-mono block">
                        {formatKz(wo.total)}
                      </span>
                      <span className="text-[9px] text-slate-400 block font-medium">
                        (Mão de Obra: {formatKz(wo.laborTotal)} + Peças: {formatKz(wo.partsTotal)})
                      </span>

                      {/* Payment Status Badge & Quick Controls */}
                      <div className="flex flex-col md:items-end gap-1 mt-2">
                        <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider text-center inline-block ${
                          (wo.paymentStatus === 'Pago Integral') ? 'bg-emerald-950/50 text-emerald-400 border-emerald-900/30' :
                          (wo.paymentStatus === 'Pago 50%') ? 'bg-amber-950/50 text-amber-400 border-amber-900/30' :
                          'bg-rose-950/50 text-rose-400 border-rose-900/30'
                        }`}>
                          Pagamento: {wo.paymentStatus || 'Pendente'} {wo.paymentStatus && wo.paymentStatus !== 'Pendente' && `(${wo.paymentMethod || 'Dinheiro'})`}
                        </span>
                        
                        {/* Quick Payment Action buttons */}
                        <div className="flex flex-wrap gap-1 justify-end pt-1">
                          {(!wo.paymentStatus || wo.paymentStatus === 'Pendente') && (
                            <>
                              <div className="flex flex-col gap-1 border border-slate-800/80 p-1.5 rounded-lg bg-slate-900/40">
                                <span className="text-[7px] text-slate-500 uppercase font-black tracking-wider text-center">Pagar 50% via:</span>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => {
                                      onEditWorkOrder({
                                        ...wo,
                                        paymentStatus: 'Pago 50%',
                                        paymentMethod: 'Dinheiro',
                                        amountPaid: Math.round(wo.total * 0.5),
                                        updatedAt: new Date().toISOString()
                                      });
                                    }}
                                    className="text-[8px] font-extrabold bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 border border-amber-500/20 px-1.5 py-0.5 rounded transition-all cursor-pointer"
                                  >
                                    Cash
                                  </button>
                                  <button
                                    onClick={() => {
                                      onEditWorkOrder({
                                        ...wo,
                                        paymentStatus: 'Pago 50%',
                                        paymentMethod: 'Transferência',
                                        amountPaid: Math.round(wo.total * 0.5),
                                        updatedAt: new Date().toISOString()
                                      });
                                    }}
                                    className="text-[8px] font-extrabold bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 border border-amber-500/20 px-1.5 py-0.5 rounded transition-all cursor-pointer"
                                  >
                                    Transf
                                  </button>
                                </div>
                              </div>

                              <div className="flex flex-col gap-1 border border-slate-800/80 p-1.5 rounded-lg bg-slate-900/40">
                                <span className="text-[7px] text-slate-500 uppercase font-black tracking-wider text-center">Pagar 100% via:</span>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => {
                                      onEditWorkOrder({
                                        ...wo,
                                        paymentStatus: 'Pago Integral',
                                        paymentMethod: 'Dinheiro',
                                        amountPaid: wo.total,
                                        updatedAt: new Date().toISOString()
                                      });
                                    }}
                                    className="text-[8px] font-extrabold bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 border border-emerald-500/20 px-1.5 py-0.5 rounded transition-all cursor-pointer"
                                  >
                                    Cash
                                  </button>
                                  <button
                                    onClick={() => {
                                      onEditWorkOrder({
                                        ...wo,
                                        paymentStatus: 'Pago Integral',
                                        paymentMethod: 'Transferência',
                                        amountPaid: wo.total,
                                        updatedAt: new Date().toISOString()
                                      });
                                    }}
                                    className="text-[8px] font-extrabold bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 border border-emerald-500/20 px-1.5 py-0.5 rounded transition-all cursor-pointer"
                                  >
                                    Transf
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                          {wo.paymentStatus === 'Pago 50%' && (
                            <div className="flex flex-col gap-1 border border-slate-800/80 p-1.5 rounded-lg bg-slate-900/40">
                              <span className="text-[7px] text-slate-500 uppercase font-black tracking-wider text-center">Liquidar Restante via:</span>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => {
                                    onEditWorkOrder({
                                      ...wo,
                                      paymentStatus: 'Pago Integral',
                                      paymentMethod: 'Dinheiro',
                                      amountPaid: wo.total,
                                      updatedAt: new Date().toISOString()
                                    });
                                  }}
                                  className="text-[8px] font-extrabold bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 border border-emerald-500/20 px-1.5 py-0.5 rounded transition-all cursor-pointer"
                                >
                                  Cash
                                </button>
                                <button
                                  onClick={() => {
                                    onEditWorkOrder({
                                      ...wo,
                                      paymentStatus: 'Pago Integral',
                                      paymentMethod: 'Transferência',
                                      amountPaid: wo.total,
                                      updatedAt: new Date().toISOString()
                                    });
                                  }}
                                  className="text-[8px] font-extrabold bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 border border-emerald-500/20 px-1.5 py-0.5 rounded transition-all cursor-pointer"
                                >
                                  Transf
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status Transitions & Actions */}
                    <div className="flex flex-wrap gap-2 items-center">
                      {/* Step-by-step Status Actions */}
                      {wo.status === 'Orçamento' && (
                        <button
                          onClick={() => handleQuickStatusChange(wo, 'Aprovado')}
                          className="px-3 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-50 hover:text-slate-950 rounded-full text-[10px] font-bold transition-all cursor-pointer uppercase tracking-wider"
                        >
                          Aprovar Orçamento
                        </button>
                      )}
                      {wo.status === 'Aprovado' && (
                        <button
                          onClick={() => handleQuickStatusChange(wo, 'Em Execução')}
                          className="px-3 py-1.5 bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-50 hover:text-slate-950 rounded-full text-[10px] font-bold transition-all cursor-pointer uppercase tracking-wider"
                        >
                          Iniciar Execução
                        </button>
                      )}
                      {wo.status === 'Em Execução' && (
                        <button
                          onClick={() => handleQuickStatusChange(wo, 'Pronto')}
                          className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-slate-950 rounded-full text-[10px] font-bold transition-all cursor-pointer uppercase tracking-wider"
                        >
                          Marcar Pronto (Testado)
                        </button>
                      )}
                      {wo.status === 'Pronto' && (
                        <button
                          onClick={() => handleQuickStatusChange(wo, 'Entregue')}
                          className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-full text-[10px] font-black shadow-lg shadow-emerald-500/10 transition-all cursor-pointer uppercase tracking-wider"
                        >
                          Entregar & Receber Kz
                        </button>
                      )}

                      {/* General CRUD utilities */}
                      <div className="flex gap-1.5 pl-1.5">
                        <button
                          onClick={() => handleViewInvoice(wo)}
                          className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors cursor-pointer border border-slate-800"
                          title="Visualizar Detalhes / Fatura"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {wo.status !== 'Entregue' && (
                          <button
                            onClick={() => handleOpenEdit(wo)}
                            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-amber-500 rounded-lg transition-colors cursor-pointer border border-slate-800"
                            title="Editar OS"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteOS(wo.id)}
                          className="p-1.5 bg-slate-900 hover:bg-rose-950/40 hover:text-rose-400 text-slate-500 rounded-lg transition-colors cursor-pointer border border-slate-800"
                          title="Excluir OS"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center pt-5 border-t border-slate-850/60 mt-4">
              <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">
                Página {currentPage} de {totalPages} ({filteredOrders.length} registos)
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
      )}

      {/* 2. CREATE/EDIT FORM VIEW */}
      {activeTab === 'create' && (
        <form onSubmit={handleSubmitOS} className="bg-[#111216]/60 border border-slate-800/60 rounded-3xl p-6 shadow-md space-y-6 print:hidden">
          
          <div className="flex justify-between items-center pb-3 border-b border-slate-850">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-100 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-amber-500" />
              {editingWOId ? `Editar OS` : 'Criar Nova Ordem de Serviço'}
            </h2>
            <div className="flex items-center gap-2.5 text-xs text-slate-400">
              <span className="font-bold text-[10px] uppercase tracking-wider">Estado Atual:</span>
              <select 
                value={woStatus} 
                onChange={(e) => setWOStatus(e.target.value as WorkOrderStatus)}
                className="bg-[#0a0b0d]/50 text-slate-200 text-xs font-bold px-3 py-1.5 rounded-full border border-slate-800 focus:outline-none"
              >
                <option value="Orçamento">Orçamento</option>
                <option value="Aprovado">Aprovado</option>
                <option value="Em Execução">Em Execução</option>
                <option value="Pronto">Pronto</option>
                <option value="Entregue">Entregue (Faturar)</option>
              </select>
            </div>
          </div>

          {formError && (
            <div className="flex items-start gap-2 text-rose-400 text-xs bg-rose-950/30 border border-rose-800/30 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {/* Grid Layout: Client (Left) & Bike (Right) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Customer Section */}
            <div className="bg-[#0a0b0d]/50 p-5 rounded-2xl border border-slate-850 space-y-4">
              <h3 className="text-[10px] font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-850 pb-2.5">
                <User className="h-4 w-4 text-amber-500" /> Dados do Cliente
              </h3>
              
              <div className="grid grid-cols-1 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nome Completo *</label>
                  <input
                    type="text"
                    placeholder="Ex: Manuel Gonçalves"
                    value={customerForm.name}
                    onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                    className="w-full bg-[#0a0b0d]/50 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contacto Telefónico *</label>
                  <input
                    type="tel"
                    placeholder="Ex: 923 456 789"
                    value={customerForm.phone}
                    onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                    className="w-full bg-[#0a0b0d]/50 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email (Opcional)</label>
                    <input
                      type="email"
                      placeholder="Ex: cliente@email.com"
                      value={customerForm.email || ''}
                      onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                      className="w-full bg-[#0a0b0d]/50 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Morada (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ex: Talatona, Luanda"
                      value={customerForm.address || ''}
                      onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                      className="w-full bg-[#0a0b0d]/50 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Observações do Cliente (Opcional)</label>
                  <textarea
                    placeholder="Ex: Prefere contacto por WhatsApp, necessita de fatura com NIF..."
                    value={customerForm.notes || ''}
                    onChange={(e) => setCustomerForm({ ...customerForm, notes: e.target.value })}
                    className="w-full bg-[#0a0b0d]/50 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 h-16 resize-none focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                  />
                </div>
              </div>
            </div>

            {/* Bicycle Section */}
            <div className="bg-[#0a0b0d]/50 p-5 rounded-2xl border border-slate-850 space-y-4">
              <h3 className="text-[10px] font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-850 pb-2.5">
                <Bike className="h-4 w-4 text-amber-500" /> Detalhes da Bicicleta
              </h3>
              
              <div className="grid grid-cols-1 gap-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Marca *</label>
                    <input
                      type="text"
                      placeholder="Ex: Specialized, Trek, Scott..."
                      value={bikeForm.brand}
                      onChange={(e) => setBikeForm({ ...bikeForm, brand: e.target.value })}
                      className="w-full bg-[#0a0b0d]/50 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Modelo *</label>
                    <input
                      type="text"
                      placeholder="Ex: Chisel, Domane, Scale..."
                      value={bikeForm.model}
                      onChange={(e) => setBikeForm({ ...bikeForm, model: e.target.value })}
                      className="w-full bg-[#0a0b0d]/50 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cor / Pintura</label>
                  <input
                    type="text"
                    placeholder="Ex: Preto Matte com Vermelho"
                    value={bikeForm.color || ''}
                    onChange={(e) => setBikeForm({ ...bikeForm, color: e.target.value })}
                    className="w-full bg-[#0a0b0d]/50 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Observações / Sintomas do Cliente</label>
                  <textarea
                    placeholder="Ex: Barulho no pedaleiro ao subir, travar de trás esponjoso, riscos no aro..."
                    value={bikeForm.notes || ''}
                    onChange={(e) => setBikeForm({ ...bikeForm, notes: e.target.value })}
                    className="w-full bg-[#0a0b0d]/50 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 h-16 resize-none placeholder-slate-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Services & Labor Selection */}
          <div className="bg-[#0a0b0d]/50 p-5 rounded-2xl border border-slate-850 space-y-4">
            <h3 className="text-[10px] font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-850 pb-2.5">
              <Wrench className="h-4 w-4 text-amber-500" /> Mão de Obra (Serviços Catálogo)
            </h3>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={tempServiceId}
                onChange={(e) => setTempServiceId(e.target.value)}
                className="bg-[#0a0b0d]/50 border border-slate-800 text-xs px-3 py-2 rounded-xl text-slate-200 flex-1 focus:outline-none"
              >
                <option value="">-- Selecione um serviço cadastrado --</option>
                {services.filter((s) => s.status === 'Ativo').map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({formatKz(s.laborValue)})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddServiceToDraft}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold rounded-full shadow-md cursor-pointer uppercase tracking-wider"
              >
                Adicionar Serviço
              </button>
            </div>

            {selectedServices.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2 text-center">Nenhum serviço de manutenção selecionado.</p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {selectedServices.map((s, index) => (
                  <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-[#0a0b0d]/40 border border-slate-800 rounded-xl gap-2.5 text-xs">
                    <div>
                      <span className="font-extrabold text-slate-300 block">{s.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">Valor Base: {formatKz(s.laborValue)}</span>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Desconto (Kz):</span>
                        <input
                          type="number"
                          placeholder="0"
                          value={s.discount || ''}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const updated = [...selectedServices];
                            updated[index] = { ...updated[index], discount: Math.min(s.laborValue, val) };
                            setSelectedServices(updated);
                          }}
                          className="w-20 bg-[#0a0b0d]/80 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 font-mono text-center focus:outline-none focus:border-amber-500/45"
                          min={0}
                          max={s.laborValue}
                        />
                      </div>
                      <span className="font-mono text-amber-500 font-bold shrink-0 min-w-[70px] text-right">
                        {formatKz(s.laborValue - (s.discount || 0))}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveServiceFromDraft(index)}
                        className="text-slate-500 hover:text-rose-400 p-1.5 rounded hover:bg-rose-950/20 cursor-pointer border border-slate-800/80 bg-slate-900"
                        title="Remover serviço"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Parts & Materials Substitution Selection */}
          <div className="bg-[#0a0b0d]/50 p-5 rounded-2xl border border-slate-850 space-y-4">
            <h3 className="text-[10px] font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-850 pb-2.5">
              <Package className="h-4 w-4 text-amber-500" /> Peças & Materiais Substituídos (Stock)
            </h3>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={tempProductId}
                onChange={(e) => {
                  setTempProductId(e.target.value);
                }}
                className="bg-[#0a0b0d]/50 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 flex-1 focus:outline-none"
              >
                <option value="">-- Selecione uma peça/acessório do stock --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id} disabled={p.quantity <= 0}>
                    {p.name} ({formatKz(p.salePrice)} - Stock: {p.quantity} un)
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={tempPartQty}
                  onChange={(e) => setTempPartQty(Number(e.target.value))}
                  placeholder="Qtd."
                  className="bg-[#0a0b0d]/50 border border-slate-800 text-xs px-3 py-2 rounded-xl text-slate-200 w-20 text-center focus:outline-none"
                  min={1}
                />
                <button
                  type="button"
                  onClick={handleAddPartToDraft}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold rounded-full shadow-md cursor-pointer uppercase tracking-wider text-[11px]"
                >
                  Adicionar Peça
                </button>
              </div>
            </div>

            {selectedParts.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2 text-center">Nenhuma peça ou material do stock substituído.</p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {selectedParts.map((p, index) => (
                  <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-[#0a0b0d]/40 border border-slate-800 rounded-xl gap-2.5 text-xs">
                    <div>
                      <span className="font-extrabold text-slate-300 block">{p.name}</span>
                      <span className="text-[10px] text-slate-500 block">
                        Qtd: <strong className="text-slate-400 font-mono">{p.quantity}</strong> x {formatKz(p.unitPrice)} base
                      </span>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Desc. Unit. (Kz):</span>
                        <input
                          type="number"
                          placeholder="0"
                          value={p.discount || ''}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const updated = [...selectedParts];
                            updated[index] = { ...updated[index], discount: Math.min(p.unitPrice, val) };
                            setSelectedParts(updated);
                          }}
                          className="w-20 bg-[#0a0b0d]/80 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 font-mono text-center focus:outline-none focus:border-amber-500/45"
                          min={0}
                          max={p.unitPrice}
                        />
                      </div>
                      <span className="font-mono text-amber-500 font-bold shrink-0 min-w-[70px] text-right">
                        {formatKz((p.unitPrice - (p.discount || 0)) * p.quantity)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemovePartFromDraft(index)}
                        className="text-slate-500 hover:text-rose-400 p-1.5 rounded hover:bg-rose-950/20 cursor-pointer border border-slate-800/85 bg-slate-900"
                        title="Remover peça"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Diagnostics / Extra Notes */}
          <div className="bg-[#0a0b0d]/50 p-5 rounded-2xl border border-slate-850 space-y-4">
            <h3 className="text-[10px] font-extrabold text-slate-300 uppercase tracking-wider block">Notas Técnicas / Diagnóstico da Oficina</h3>
            <textarea
              placeholder="Descreva as ações realizadas pelo mecânico, testes adicionais ou recomendações para futuras visitas..."
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              className="w-full bg-[#0a0b0d]/50 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 h-24 resize-none focus:outline-none focus:ring-1 focus:ring-amber-500/20"
            />
          </div>

          {/* Condições de Pagamento */}
          <div className="bg-[#0a0b0d]/50 p-5 rounded-2xl border border-slate-850 space-y-4">
            <h3 className="text-[10px] font-extrabold text-[#94a3b8] uppercase tracking-wider block">Condições de Pagamento (50% / 50%)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setPaymentStatus('Pendente')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                  paymentStatus === 'Pendente'
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 ring-1 ring-rose-500/20'
                    : 'bg-[#0a0b0d]/30 text-slate-400 border-slate-850 hover:bg-slate-900'
                }`}
              >
                <span>Pendente</span>
                <span className="text-[10px] opacity-70 font-mono">0% Pago</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentStatus('Pago 50%')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                  paymentStatus === 'Pago 50%'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 ring-1 ring-amber-500/20'
                    : 'bg-[#0a0b0d]/30 text-slate-400 border-slate-850 hover:bg-slate-900'
                }`}
              >
                <span>Pago 50% (Sinal)</span>
                <span className="text-[10px] opacity-70 font-mono">Sinal: {formatKz(Math.round(formTotal * 0.5))}</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentStatus('Pago Integral')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                  paymentStatus === 'Pago Integral'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 ring-1 ring-emerald-500/20'
                    : 'bg-[#0a0b0d]/30 text-slate-400 border-slate-850 hover:bg-slate-900'
                }`}
              >
                <span>Pago Integral (100%)</span>
                <span className="text-[10px] opacity-70 font-mono">Total: {formatKz(formTotal)}</span>
              </button>
            </div>
          </div>

          {/* Meio de Pagamento */}
          {paymentStatus !== 'Pendente' && (
            <div className="bg-[#0a0b0d]/50 p-5 rounded-2xl border border-slate-850 space-y-4">
              <h3 className="text-[10px] font-extrabold text-[#94a3b8] uppercase tracking-wider block">Meio de Pagamento</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Dinheiro')}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    paymentMethod === 'Dinheiro'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 ring-1 ring-amber-500/20'
                      : 'bg-[#0a0b0d]/30 text-slate-400 border-slate-850 hover:bg-slate-900'
                  }`}
                >
                  <span>Cash / Dinheiro</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Transferência')}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    paymentMethod === 'Transferência'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 ring-1 ring-amber-500/20'
                      : 'bg-[#0a0b0d]/30 text-slate-400 border-slate-850 hover:bg-[#0a0b0d]/50'
                  }`}
                >
                  <span>Transferência</span>
                </button>
              </div>
            </div>
          )}

          {/* Pricing Breakdown Summary */}
          <div className="p-5 bg-gradient-to-br from-[#111216] to-[#111216]/60 border border-slate-850 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Detalhamento Financeiro:</p>
              <div className="flex flex-wrap gap-x-6 text-xs font-semibold text-slate-300">
                <span>Mão de Obra: <strong className="text-amber-400 font-mono font-bold">{formatKz(laborTotal)}</strong></span>
                <span className="hidden sm:inline text-slate-700">|</span>
                <span>Substituição Peças: <strong className="text-amber-400 font-mono font-bold">{formatKz(partsTotal)}</strong></span>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Geral Estimado</span>
              <span className="text-2xl font-black text-amber-500 font-mono">
                {formatKz(formTotal)}
              </span>
            </div>
          </div>

          {/* Submit/Cancel buttons */}
          <div className="flex gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className="flex-1 py-3 bg-slate-800/60 hover:bg-slate-800 text-slate-300 font-bold rounded-full text-xs transition-colors cursor-pointer"
            >
              Cancelar & Descartar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-full text-xs shadow-lg shadow-amber-500/20 transition-all active:translate-y-0.5 cursor-pointer uppercase tracking-wider"
            >
              {editingWOId ? 'Salvar Alterações (Atualizar)' : 'Registrar Ordem de Serviço'}
            </button>
          </div>
        </form>
      )}

      {/* 3. INVOICE PREVIEW / PDF EXPORT */}
      {activeTab === 'invoice' && viewingWO && (
        <div className="space-y-6">
          {/* Action Header - Hidden during printing */}
          <div className="flex flex-wrap justify-between items-center gap-3 bg-[#111216]/60 p-4 rounded-3xl border border-slate-800/60 print:hidden">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-amber-500" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-200">Recibo & Fatura de Oficina</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold rounded-full shadow-lg shadow-amber-500/10 cursor-pointer uppercase tracking-wider"
              >
                <Printer className="h-4 w-4" />
                Imprimir / Exportar PDF
              </button>
              <button
                onClick={() => setActiveTab('list')}
                className="px-4 py-2.5 bg-[#111216] hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-full border border-slate-800/80 transition-colors"
              >
                Voltar
              </button>
            </div>
          </div>

          {/* PRINT ELEMENT - Perfectly centered styled invoice */}
          <div 
            className="bg-white text-slate-900 rounded-2xl p-8 md:p-12 border border-slate-200 shadow-xl max-w-3xl mx-auto print:border-none print:shadow-none print:p-0 print:m-0"
            id="invoice-print-container"
          >
            {/* Invoice Header */}
            <div className="flex justify-between items-start gap-4 pb-6 border-b border-slate-200">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {/* Miniature text Logo for black/white compatibility */}
                  <span className="text-2xl font-black tracking-tighter text-amber-800">BIKE ONE</span>
                  <span className="px-2 py-0.5 bg-slate-100 text-[10px] text-slate-600 font-extrabold border border-slate-200 rounded">LUANDA</span>
                </div>
                <div className="text-[11px] text-slate-500 leading-relaxed font-medium">
                  <p>Bike One - Oficina de Bicicletas & Acessórios Premium</p>
                  <p>Avenida Pedro de Castro Van-Dúnem Loy, Luanda, Angola</p>
                  <p>Contacto: +244 923 000 000 | geral@bikeone.ao</p>
                </div>
              </div>

              <div className="text-right space-y-1 shrink-0">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Ordem de Serviço</span>
                <span className="text-2xl font-black font-mono text-slate-850 block">#{viewingWO.orderNumber}</span>
                <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                  viewingWO.status === 'Entregue' 
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                    : 'bg-amber-50 text-amber-600 border-amber-200'
                }`}>
                  {viewingWO.status}
                </span>
                <p className="text-[10px] text-slate-500 pt-1">Emitido: {new Date(viewingWO.createdAt).toLocaleDateString('pt-AO')}</p>
              </div>
            </div>

            {/* Client & Bike block */}
            <div className="grid grid-cols-2 gap-6 py-6 border-b border-slate-250 text-xs">
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cliente:</h4>
                <div className="space-y-1 font-medium">
                  <p className="font-extrabold text-slate-800 text-sm">{viewingWO.customer.name}</p>
                  <p className="text-slate-600">Contacto: {viewingWO.customer.phone}</p>
                  {viewingWO.customer.email && <p className="text-slate-600">Email: {viewingWO.customer.email}</p>}
                  {viewingWO.customer.address && <p className="text-slate-600">Morada: {viewingWO.customer.address}</p>}
                  {viewingWO.customer.notes && (
                    <p className="text-amber-800 text-[10px] mt-1.5 p-1.5 bg-amber-50 border border-amber-100 rounded">
                      <strong>Obs. Cliente:</strong> {viewingWO.customer.notes}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2 border-l border-slate-150 pl-6">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bicicleta:</h4>
                <div className="space-y-1 font-medium">
                  <p className="font-extrabold text-slate-800 text-sm">{viewingWO.bicycle.brand} {viewingWO.bicycle.model}</p>
                  {viewingWO.bicycle.color && <p className="text-slate-600">Cor: {viewingWO.bicycle.color}</p>}
                  {viewingWO.bicycle.notes && (
                    <p className="text-slate-500 italic mt-1.5 p-1.5 bg-slate-50 border border-slate-100 rounded text-[10px]">
                      Sintomas: {viewingWO.bicycle.notes}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Itemized Table of Services and Parts */}
            <div className="py-6 space-y-4">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Descritivo de Serviços & Peças:</h4>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                      <th className="py-2.5 px-3">Item / Descrição</th>
                      <th className="py-2.5 px-3 text-center">Tipo</th>
                      <th className="py-2.5 px-3 text-center">Qtd.</th>
                      <th className="py-2.5 px-3 text-right">Preço Unit.</th>
                      <th className="py-2.5 px-3 text-right">Desconto</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150">
                    {/* 1. Services */}
                    {viewingWO.services.map((s, idx) => (
                      <tr key={`s-${idx}`}>
                        <td className="py-3 px-3 font-bold text-slate-800">
                          {s.name}
                          {s.discount ? <span className="text-[9px] text-rose-600 font-normal block">Desconto aplicado</span> : null}
                        </td>
                        <td className="py-3 px-3 text-center"><span className="text-[9px] bg-blue-50 text-blue-600 border border-blue-200 px-1.5 py-0.5 rounded font-extrabold">Mão de Obra</span></td>
                        <td className="py-3 px-3 text-center font-bold">1</td>
                        <td className="py-3 px-3 text-right font-mono text-slate-600">{formatKz(s.laborValue)}</td>
                        <td className="py-3 px-3 text-right font-mono text-rose-600 font-semibold">{s.discount ? `-${formatKz(s.discount)}` : '0 Kz'}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">{formatKz(s.laborValue - (s.discount || 0))}</td>
                      </tr>
                    ))}
                    {/* 2. Parts */}
                    {viewingWO.parts.map((p, idx) => (
                      <tr key={`p-${idx}`}>
                        <td className="py-3 px-3 font-bold text-slate-850">
                          {p.name}
                          {p.discount ? <span className="text-[9px] text-rose-600 font-normal block">Desconto unitário aplicado</span> : null}
                        </td>
                        <td className="py-3 px-3 text-center"><span className="text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-200 px-1.5 py-0.5 rounded font-extrabold">Material</span></td>
                        <td className="py-3 px-3 text-center font-bold">{p.quantity}</td>
                        <td className="py-3 px-3 text-right font-mono text-slate-600">{formatKz(p.unitPrice)}</td>
                        <td className="py-3 px-3 text-right font-mono text-rose-600 font-semibold">{p.discount ? `-${formatKz(p.discount * p.quantity)}` : '0 Kz'}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">{formatKz((p.unitPrice - (p.discount || 0)) * p.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary panel */}
            <div className="border-t border-slate-200 pt-6 flex flex-col items-end text-xs space-y-1.5">
              <div className="w-full max-w-xs flex justify-between font-medium text-slate-600">
                <span>Subtotal Mão de Obra:</span>
                <span className="font-mono text-slate-800">
                  {formatKz(viewingWO.services.reduce((sum, s) => sum + s.laborValue, 0))}
                </span>
              </div>
              <div className="w-full max-w-xs flex justify-between font-medium text-slate-600">
                <span>Subtotal Peças:</span>
                <span className="font-mono text-slate-800">
                  {formatKz(viewingWO.parts.reduce((sum, p) => sum + p.unitPrice * p.quantity, 0))}
                </span>
              </div>
              
              {/* Total Discount applied */}
              {(() => {
                const totalDisc = (viewingWO.services.reduce((sum, s) => sum + (s.discount || 0), 0) + 
                                  viewingWO.parts.reduce((sum, p) => sum + (p.discount || 0) * p.quantity, 0));
                if (totalDisc > 0) {
                  return (
                    <div className="w-full max-w-xs flex justify-between font-bold text-rose-600">
                      <span>Total de Descontos:</span>
                      <span className="font-mono">-{formatKz(totalDisc)}</span>
                    </div>
                  );
                }
                return null;
              })()}

              <div className="w-full max-w-xs flex justify-between font-bold text-slate-800 text-sm border-t border-slate-200 pt-2.5 mt-1.5">
                <span>VALOR TOTAL SERVIÇO:</span>
                <span className="font-mono text-md text-amber-800 font-black">{formatKz(viewingWO.total)}</span>
              </div>

              {/* Payment details */}
              <div className="w-full max-w-xs border-t border-dashed border-slate-200 pt-2 mt-1 space-y-1">
                <div className="flex justify-between font-bold text-slate-700 text-[11px]">
                  <span>Estado de Pagamento:</span>
                  <span className="uppercase text-amber-800">{viewingWO.paymentStatus || 'Pendente'}</span>
                </div>
                <div className="flex justify-between font-medium text-slate-600 text-[11px]">
                  <span>Valor Pago (Sinal/Integral):</span>
                  <span className="font-mono text-slate-800">{formatKz(viewingWO.amountPaid || 0)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-850 text-[11px] border-t border-slate-150 pt-1">
                  <span>Valor Pendente:</span>
                  <span className="font-mono text-rose-700 font-black">{formatKz(Math.max(0, viewingWO.total - (viewingWO.amountPaid || 0)))}</span>
                </div>
              </div>
            </div>

            {/* Workshop Notes block */}
            {viewingWO.notes && (
              <div className="mt-8 p-4 bg-slate-50 border border-slate-150 rounded-xl text-xs text-slate-600 space-y-1 leading-relaxed">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Observações Técnicas / Diagnóstico da Oficina:</span>
                <p className="font-medium">{viewingWO.notes}</p>
              </div>
            )}

            {/* Invoice footer */}
            <div className="mt-12 pt-8 border-t border-slate-200 text-center space-y-2">
              <p className="text-[11px] text-slate-500 font-medium">Agradecemos a sua preferência na Bike One Luanda!</p>
              <p className="text-[9px] text-slate-400">Este documento serve como garantia de 30 dias para os serviços de afinação descritos.</p>
              <div className="pt-6 flex justify-around text-[10px] text-slate-400 font-bold uppercase tracking-wider print:pt-12">
                <div className="flex flex-col items-center">
                  <div className="w-40 border-b border-slate-300 mb-1.5"></div>
                  <span>Assinatura do Técnico</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-40 border-b border-slate-300 mb-1.5"></div>
                  <span>Assinatura do Cliente</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
