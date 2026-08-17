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
  FileText,
  ChevronDown,
  ChevronUp
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
  const shopName = localStorage.getItem('bikeone_shop_name') || 'BIKE ONE';
  const shopPhone = localStorage.getItem('bikeone_shop_phone') || '+244 923 000 000';
  const shopAddress = localStorage.getItem('bikeone_shop_address') || 'Avenida Pedro de Castro Van-Dúnem Loy, Luanda';
  const shopNif = localStorage.getItem('bikeone_shop_nif') || '500123456';

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
  const [paymentMethod, setPaymentMethod] = useState<'Dinheiro' | 'Transferência' | 'Dinheiro + Transferência'>('Dinheiro');
  const [externalAccessories, setExternalAccessories] = useState('');
  const [externalAccessoriesValue, setExternalAccessoriesValue] = useState<number>(0);
  const [formError, setFormError] = useState('');
  const [showServicesList, setShowServicesList] = useState(false);
  const [showPartsList, setShowPartsList] = useState(false);

  // Invoice view state
  const [viewingWO, setViewingWO] = useState<WorkOrder | null>(null);

  // Computed values for current form (accounting for discounts)
  const laborTotal = selectedServices.reduce((sum, s) => sum + (s.laborValue - (s.discount || 0)), 0);
  const partsTotal = selectedParts.reduce((sum, p) => sum + ((p.unitPrice - (p.discount || 0)) * p.quantity), 0);
  const formTotal = laborTotal + partsTotal + (externalAccessoriesValue || 0);

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
    setExternalAccessories('');
    setExternalAccessoriesValue(0);
    setFormError('');
    setShowServicesList(false);
    setShowPartsList(false);
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
    setExternalAccessories(wo.externalAccessories || '');
    setExternalAccessoriesValue(wo.externalAccessoriesValue || 0);
    setFormError('');
    setShowServicesList(false);
    setShowPartsList(false);
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
    if (!bikeForm.brand.trim()) {
      setFormError('A marca da bicicleta é obrigatória.');
      return;
    }
    if (selectedServices.length === 0) {
      setFormError('Selecione pelo menos um serviço a ser executado.');
      return;
    }

    setFormError('');

    const finalAmountPaid = paymentStatus === 'Pendente' ? 0 
                          : paymentStatus === 'Pago 50%' ? Math.round(formTotal * 0.5) 
                          : formTotal;

    const cleanedBikeForm = {
      brand: bikeForm.brand.trim(),
      model: bikeForm.model?.trim() || 'Geral',
      color: bikeForm.color?.trim() || 'N/D',
      notes: bikeForm.notes?.trim() || '',
    };

    const woPayload = {
      customer: customerForm,
      bicycle: cleanedBikeForm,
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
      externalAccessories,
      externalAccessoriesValue: externalAccessoriesValue || 0,
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
    onDeleteWorkOrder(id);
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
                                  <button
                                    onClick={() => {
                                      onEditWorkOrder({
                                        ...wo,
                                        paymentStatus: 'Pago 50%',
                                        paymentMethod: 'Dinheiro + Transferência',
                                        amountPaid: Math.round(wo.total * 0.5),
                                        updatedAt: new Date().toISOString()
                                      });
                                    }}
                                    className="text-[8px] font-extrabold bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 border border-amber-500/20 px-1.5 py-0.5 rounded transition-all cursor-pointer"
                                  >
                                    Misto
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
                                  <button
                                    onClick={() => {
                                      onEditWorkOrder({
                                        ...wo,
                                        paymentStatus: 'Pago Integral',
                                        paymentMethod: 'Dinheiro + Transferência',
                                        amountPaid: wo.total,
                                        updatedAt: new Date().toISOString()
                                      });
                                    }}
                                    className="text-[8px] font-extrabold bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 border border-emerald-500/20 px-1.5 py-0.5 rounded transition-all cursor-pointer"
                                  >
                                    Misto
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
                                <button
                                  onClick={() => {
                                    onEditWorkOrder({
                                      ...wo,
                                      paymentStatus: 'Pago Integral',
                                      paymentMethod: 'Dinheiro + Transferência',
                                      amountPaid: wo.total,
                                      updatedAt: new Date().toISOString()
                                    });
                                  }}
                                  className="text-[8px] font-extrabold bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 border border-emerald-500/20 px-1.5 py-0.5 rounded transition-all cursor-pointer"
                                >
                                  Misto
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

          {/* Core Simplified Fields: Customer and Bicycle Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Contact Information */}
            <div className="bg-[#0a0b0d]/50 p-5 rounded-2xl border border-slate-850 space-y-4">
              <h3 className="text-[10px] font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-850 pb-2.5">
                <User className="h-4 w-4 text-amber-500" /> Dados do Cliente
              </h3>
              
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nome do Cliente *</label>
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
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Contacto / Telefone *</label>
                  <input
                    type="tel"
                    placeholder="Ex: 923 456 789"
                    value={customerForm.phone}
                    onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                    className="w-full bg-[#0a0b0d]/50 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Bicycle Brand and Problem Description */}
            <div className="bg-[#0a0b0d]/50 p-5 rounded-2xl border border-slate-850 space-y-4">
              <h3 className="text-[10px] font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-850 pb-2.5">
                <Bike className="h-4 w-4 text-amber-500" /> Detalhes da Bicicleta
              </h3>
              
              <div className="space-y-3.5">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Marca da Bicicleta *</label>
                  <div className="flex flex-wrap gap-1.5 mb-1.5">
                    {['Specialized', 'Trek', 'Scott', 'Cannondale', 'Caloi', 'Giant', 'GT', 'Outra'].map((brand) => {
                      const isSelected = brand === 'Outra'
                        ? !['Specialized', 'Trek', 'Scott', 'Cannondale', 'Caloi', 'Giant', 'GT'].includes(bikeForm.brand) && bikeForm.brand !== ''
                        : bikeForm.brand === brand;
                      return (
                        <button
                          key={brand}
                          type="button"
                          onClick={() => {
                            if (brand === 'Outra') {
                              setBikeForm({ ...bikeForm, brand: '' });
                            } else {
                              setBikeForm({ ...bikeForm, brand });
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                              : 'bg-slate-900/50 text-slate-400 border-slate-800 hover:bg-slate-800/50'
                          }`}
                        >
                          {brand}
                        </button>
                      );
                    })}
                  </div>
                  <input
                    type="text"
                    placeholder="Introduza a marca da bicicleta..."
                    value={bikeForm.brand}
                    onChange={(e) => setBikeForm({ ...bikeForm, brand: e.target.value })}
                    className="w-full bg-[#0a0b0d]/50 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Descrição de Problemas da Bicicleta</label>
                  <textarea
                    placeholder="Ex: Barulho no pedaleiro ao subir, travar de trás esponjoso..."
                    value={bikeForm.notes || ''}
                    onChange={(e) => setBikeForm({ ...bikeForm, notes: e.target.value })}
                    className="w-full bg-[#0a0b0d]/50 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 h-16 resize-none placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Multiple Choices: Services to Execute as Visual Toggle Buttons */}
          <div className="bg-[#0a0b0d]/50 p-5 rounded-2xl border border-slate-850 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-850 pb-2.5">
              <h3 className="text-[10px] font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Wrench className="h-4 w-4 text-amber-500" /> Serviço a ser Executado
              </h3>
              
              <button
                type="button"
                onClick={() => setShowServicesList(!showServicesList)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-amber-500/30 hover:bg-slate-850 text-[10px] font-black text-amber-400 uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                {showServicesList ? 'Ocultar catálogo' : 'Escolher do catálogo'}
                {showServicesList ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
              </button>
            </div>
            
            {showServicesList ? (
              services.filter(s => s.status === 'Ativo').length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2 text-center">Nenhum serviço ativo registado no catálogo.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {services.filter(s => s.status === 'Ativo').map((s) => {
                    const isSelected = selectedServices.some(item => item.serviceId === s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedServices(selectedServices.filter(item => item.serviceId !== s.id));
                          } else {
                            setSelectedServices([...selectedServices, { serviceId: s.id, name: s.name, laborValue: s.laborValue }]);
                          }
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 shadow-md'
                            : 'bg-slate-900/40 border-slate-850 text-slate-300 hover:bg-slate-850/50'
                        }`}
                      >
                        <div className="flex justify-between items-start w-full gap-2">
                          <span className="font-extrabold text-xs block truncate leading-tight">{s.name}</span>
                          {isSelected && <CheckCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                        </div>
                        <span className="text-[10px] font-bold font-mono text-slate-400">{formatKz(s.laborValue)}</span>
                      </button>
                    );
                  })}
                </div>
              )
            ) : (
              <div>
                {selectedServices.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-1">Nenhum serviço selecionado ainda. Clique em "Escolher do catálogo" acima.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedServices.map((s, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl text-xs text-amber-400">
                        <span className="font-extrabold">{s.name}</span>
                        <span className="text-[10px] font-bold font-mono text-slate-400">({formatKz(s.laborValue)})</span>
                        <button
                          type="button"
                          onClick={() => setSelectedServices(selectedServices.filter(item => item.serviceId !== s.serviceId))}
                          className="text-amber-500 hover:text-rose-400 font-extrabold px-1 text-sm leading-none cursor-pointer transition-colors"
                          title="Remover serviço"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Multiple Choices: Active Products/Parts in Stock as Visual Toggle/Counter Cards */}
          <div className="bg-[#0a0b0d]/50 p-5 rounded-2xl border border-slate-850 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-850 pb-2.5">
              <h3 className="text-[10px] font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="h-4 w-4 text-amber-500" /> Acessórios / Peças a ser substituído (Stock)
              </h3>
              
              <button
                type="button"
                onClick={() => setShowPartsList(!showPartsList)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-amber-500/30 hover:bg-slate-850 text-[10px] font-black text-amber-400 uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                {showPartsList ? 'Ocultar stock' : 'Escolher do stock'}
                {showPartsList ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
              </button>
            </div>
            
            {showPartsList ? (
              products.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2 text-center">Nenhuma peça registada no stock.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {products.map((p) => {
                    const selectedItem = selectedParts.find(item => item.productId === p.id);
                    const quantitySelected = selectedItem ? selectedItem.quantity : 0;
                    const isOutOfStock = p.quantity <= 0;
                    
                    return (
                      <div
                        key={p.id}
                        className={`p-3 rounded-2xl border transition-all flex flex-col justify-between gap-2.5 ${
                          quantitySelected > 0
                            ? 'bg-amber-500/10 border-amber-500/45 text-amber-400'
                            : isOutOfStock
                              ? 'bg-slate-950/20 border-slate-900 opacity-40'
                              : 'bg-slate-900/40 border-slate-850 text-slate-300'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-1">
                          <div>
                            <span className="font-extrabold text-xs block truncate leading-tight" title={p.name}>{p.name}</span>
                            <span className="text-[9px] text-slate-500 block font-bold uppercase tracking-wider mt-0.5">
                              Stock: {p.quantity} un
                            </span>
                          </div>
                          <span className="text-[10px] font-bold font-mono bg-slate-950/40 px-2 py-0.5 border border-slate-800 rounded text-slate-300 shrink-0">
                            {formatKz(p.salePrice)}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between border-t border-slate-800/40 pt-1.5">
                          <span className="text-[9px] text-slate-500 uppercase font-black tracking-wider">Quantidade</span>
                          {quantitySelected > 0 ? (
                            <div className="flex items-center gap-1 bg-slate-950/60 p-0.5 rounded-xl border border-slate-800">
                              <button
                                type="button"
                                onClick={() => {
                                  if (quantitySelected === 1) {
                                    setSelectedParts(selectedParts.filter(item => item.productId !== p.id));
                                  } else {
                                    setSelectedParts(selectedParts.map(item => 
                                      item.productId === p.id 
                                        ? { ...item, quantity: quantitySelected - 1 }
                                        : item
                                    ));
                                  }
                                }}
                                className="w-6 h-6 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-200 text-xs font-black flex items-center justify-center transition-all cursor-pointer"
                              >
                                -
                              </button>
                              <span className="w-6 text-center text-xs font-black font-mono text-slate-100">{quantitySelected}</span>
                              <button
                                type="button"
                                disabled={quantitySelected >= p.quantity}
                                onClick={() => {
                                  setSelectedParts(selectedParts.map(item => 
                                    item.productId === p.id 
                                      ? { ...item, quantity: quantitySelected + 1 }
                                      : item
                                  ));
                                }}
                                className="w-6 h-6 rounded-lg bg-[#0a0b0d] hover:bg-slate-850 text-slate-200 text-xs font-black flex items-center justify-center transition-all disabled:opacity-35 cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              disabled={isOutOfStock}
                              onClick={() => {
                                setSelectedParts([...selectedParts, { 
                                  productId: p.id, 
                                  name: p.name, 
                                  quantity: 1, 
                                  unitPrice: p.salePrice, 
                                  purchasePrice: p.purchasePrice 
                                }]);
                              }}
                              className={`px-3 py-1 rounded-xl text-[9px] font-extrabold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
                                isOutOfStock
                                  ? 'bg-slate-900 text-slate-600 border border-slate-950 cursor-not-allowed'
                                  : 'bg-amber-500/10 hover:bg-amber-500 hover:text-slate-950 text-amber-500 border border-amber-500/20'
                              }`}
                            >
                              <Plus className="h-3 w-3" />
                              Substituir
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              <div>
                {selectedParts.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-1">Nenhuma peça selecionada ainda. Clique em "Escolher do stock" acima.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedParts.map((p, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl text-xs text-amber-400">
                        <span className="font-extrabold">{p.name}</span>
                        <span className="text-[10px] font-bold font-mono text-slate-400">({p.quantity} un &times; {formatKz(p.unitPrice)})</span>
                        <button
                          type="button"
                          onClick={() => setSelectedParts(selectedParts.filter(item => item.productId !== p.productId))}
                          className="text-amber-500 hover:text-rose-400 font-extrabold px-1 text-sm leading-none cursor-pointer transition-colors"
                          title="Remover peça"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Opcional: Acessórios comprados noutro sítio e o valor */}
          <div className="bg-[#0a0b0d]/50 p-5 rounded-2xl border border-slate-850 space-y-3.5">
            <div className="flex items-center gap-2 border-b border-slate-850/60 pb-2">
              <Package className="h-4 w-4 text-amber-500" />
              <h3 className="text-[10px] font-extrabold text-slate-300 uppercase tracking-wider">Acessórios de outro sítio (Opcional)</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Acessórios / Peças Externas</label>
                <input
                  type="text"
                  placeholder="Ex: Suporte de Bidão carbono..."
                  value={externalAccessories}
                  onChange={(e) => setExternalAccessories(e.target.value)}
                  className="w-full bg-[#0a0b0d]/50 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Valor do Acessório (Kz)</label>
                <input
                  type="number"
                  placeholder="Ex: 5000"
                  value={externalAccessoriesValue || ''}
                  onChange={(e) => setExternalAccessoriesValue(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#0a0b0d]/50 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none"
                  min={0}
                />
              </div>
            </div>
          </div>

          {/* Tipo de Pagamento por Percentagem e Método de Pagamento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tipo de Pagamento por Percentagem */}
            <div className="bg-[#0a0b0d]/50 p-5 rounded-2xl border border-slate-850 space-y-4">
              <h3 className="text-[10px] font-extrabold text-slate-300 uppercase tracking-wider block">Tipo de Pagamento por Percentagem</h3>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentStatus('Pendente')}
                  className={`p-3 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    paymentStatus === 'Pendente'
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <span>Pendente</span>
                  <span className="text-[9px] opacity-70 font-mono">0% Pago</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentStatus('Pago 50%')}
                  className={`p-3 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    paymentStatus === 'Pago 50%'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <span>Sinal (50%)</span>
                  <span className="text-[9px] opacity-70 font-mono">{formatKz(Math.round(formTotal * 0.5))}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentStatus('Pago Integral')}
                  className={`p-3 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    paymentStatus === 'Pago Integral'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <span>Integral (100%)</span>
                  <span className="text-[9px] opacity-70 font-mono">{formatKz(formTotal)}</span>
                </button>
              </div>
            </div>

            {/* Meio de Pagamento */}
            <div className="bg-[#0a0b0d]/50 p-5 rounded-2xl border border-slate-850 space-y-4">
              <h3 className="text-[10px] font-extrabold text-slate-300 uppercase tracking-wider block">Meio de Pagamento</h3>
              {paymentStatus === 'Pendente' ? (
                <div className="h-[62px] flex items-center justify-center border border-dashed border-slate-800 rounded-2xl text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                  Não Aplicável (Estado Pendente)
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Dinheiro')}
                    className={`p-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center text-center cursor-pointer ${
                      paymentMethod === 'Dinheiro'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 font-extrabold'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <span>Dinheiro</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Transferência')}
                    className={`p-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center text-center cursor-pointer ${
                      paymentMethod === 'Transferência'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 font-extrabold'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <span>Transferência</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Dinheiro + Transferência')}
                    className={`p-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center text-center cursor-pointer ${
                      paymentMethod === 'Dinheiro + Transferência'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 font-extrabold'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <span>Metade de Cada</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Pricing Breakdown Summary / Total do Valor */}
          <div className="p-5 bg-gradient-to-br from-[#111216] to-[#111216]/60 border border-slate-850 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Detalhamento Financeiro:</p>
              <div className="flex flex-wrap gap-x-6 text-xs font-semibold text-slate-300">
                <span>Manutenção: <strong className="text-amber-400 font-mono font-bold">{formatKz(laborTotal)}</strong></span>
                <span className="hidden sm:inline text-slate-700">|</span>
                <span>Produtos/Peças: <strong className="text-amber-400 font-mono font-bold">{formatKz(partsTotal)}</strong></span>
                {externalAccessoriesValue > 0 && (
                  <>
                    <span className="hidden sm:inline text-slate-700">|</span>
                    <span>Outro Sítio: <strong className="text-amber-400 font-mono font-bold">{formatKz(externalAccessoriesValue)}</strong></span>
                  </>
                )}
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Valor Total Geral</span>
              <span className="text-2xl font-black text-amber-500 font-mono">
                {formatKz(formTotal)}
              </span>
            </div>
          </div>

          {/* Submit/Cancel buttons */}
          <div className="flex gap-3 pt-3 border-t border-slate-850">
            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className="flex-1 py-3 bg-slate-800/60 hover:bg-slate-850 text-slate-300 font-bold rounded-full text-xs transition-colors cursor-pointer"
            >
              Cancelar & Voltar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-full text-xs shadow-lg shadow-amber-500/20 transition-all active:translate-y-0.5 cursor-pointer uppercase tracking-wider"
            >
              {editingWOId ? 'Salvar Alterações' : 'Criar Ordem de Serviço'}
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
                  <span className="text-2xl font-black tracking-tighter text-amber-800 uppercase">{shopName}</span>
                  <span className="px-2 py-0.5 bg-slate-100 text-[10px] text-slate-600 font-extrabold border border-slate-200 rounded">FACTURA DE SERVIÇO</span>
                </div>
                <div className="text-[11px] text-slate-500 leading-relaxed font-medium">
                  <p>{shopName} - Oficina de Bicicletas</p>
                  <p>{shopAddress}</p>
                  <p>Contacto: {shopPhone} | NIF: {shopNif}</p>
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

            {/* 1. Nome do Cliente e Telefone */}
            <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-200 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nome do Cliente</span>
                <span className="text-sm font-black text-slate-800 block">{viewingWO.customer.name}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Telefone</span>
                <span className="text-sm font-bold text-slate-800 block font-mono">{viewingWO.customer.phone}</span>
              </div>
            </div>

            {/* 2. Marca da Bicicleta */}
            <div className="py-4 border-b border-slate-200 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Marca da Bicicleta</span>
              <span className="text-sm font-black text-slate-850 block">{viewingWO.bicycle.brand} <span className="text-xs font-medium text-slate-500">({viewingWO.bicycle.model} - {viewingWO.bicycle.color || 'Sem Cor'})</span></span>
            </div>

            {/* 3. Serviço que vai ser executado */}
            <div className="py-4 border-b border-slate-200 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Serviço que vai ser executado</span>
              <div className="mt-1.5 space-y-1">
                {viewingWO.services.map((s, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span className="font-extrabold text-slate-800">{s.name}</span>
                    <span className="font-mono text-slate-600 font-bold">{formatKz(s.laborValue)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Peça a ser substituída */}
            <div className="py-4 border-b border-slate-200 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Peça a ser substituída</span>
              <div className="mt-1.5 space-y-1">
                {viewingWO.parts.length === 0 ? (
                  <p className="text-slate-400 italic p-2 bg-slate-50 border border-slate-100 rounded-lg">Nenhuma peça cadastrada para substituição nesta Ordem de Serviço.</p>
                ) : (
                  viewingWO.parts.map((p, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="font-extrabold text-slate-800">
                        {p.name} <span className="text-slate-400 font-normal">({p.quantity}x)</span>
                      </span>
                      <span className="font-mono text-slate-600 font-bold">{formatKz(p.unitPrice * p.quantity)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 5. Acessórios que vai se comprar em outro sítio e o valor */}
            <div className="py-4 border-b border-slate-200 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Acessórios que vai se comprar em outro sítio e o valor</span>
              <div className="mt-1.5 bg-amber-50/50 p-2.5 border border-amber-100/60 rounded-xl flex justify-between items-center">
                <div>
                  <span className="font-extrabold text-amber-900">{viewingWO.externalAccessories || 'Nenhum acessório externo registado'}</span>
                </div>
                <div>
                  <span className="font-mono text-amber-800 font-extrabold bg-amber-50 px-2 py-0.5 border border-amber-200 rounded">{formatKz(viewingWO.externalAccessoriesValue || 0)}</span>
                </div>
              </div>
            </div>

            {/* 6 & 7. Resumo Financeiro (Valor de produtos, valor de manutenção, Valor total) */}
            <div className="py-5 flex flex-col items-end text-xs space-y-2 bg-slate-50/40 p-4 rounded-xl border border-slate-150 mt-4">
              <div className="w-full max-w-xs flex justify-between font-medium text-slate-600">
                <span>Valor de Manutenção (Mão de Obra):</span>
                <span className="font-mono text-slate-800 font-extrabold">{formatKz(viewingWO.laborTotal)}</span>
              </div>
              <div className="w-full max-w-xs flex justify-between font-medium text-slate-600">
                <span>Valor de Produtos (Peças):</span>
                <span className="font-mono text-slate-800 font-extrabold">{formatKz(viewingWO.partsTotal)}</span>
              </div>
              <div className="w-full max-w-xs flex justify-between font-medium text-slate-600">
                <span>Acessórios de Outro Sítio:</span>
                <span className="font-mono text-slate-800 font-extrabold">{formatKz(viewingWO.externalAccessoriesValue || 0)}</span>
              </div>
              <div className="w-full max-w-xs flex justify-between font-bold text-slate-900 text-sm border-t border-slate-200 pt-2.5 mt-1.5 font-sans">
                <span className="uppercase text-amber-950 font-black">Valor Total Geral:</span>
                <span className="font-mono text-md text-amber-800 font-black">{formatKz(viewingWO.total)}</span>
              </div>

              {/* Payment Details */}
              <div className="w-full max-w-xs border-t border-dashed border-slate-200 pt-2.5 mt-2 space-y-1 text-[11px]">
                <div className="flex justify-between font-extrabold text-slate-700">
                  <span>Estado de Pagamento:</span>
                  <span className="uppercase text-amber-900 font-black">{viewingWO.paymentStatus || 'Pendente'}</span>
                </div>
                {viewingWO.paymentMethod && (
                  <div className="flex justify-between font-semibold text-slate-600">
                    <span>Método de Pagamento:</span>
                    <span className="text-slate-800">{viewingWO.paymentMethod}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-slate-850 border-t border-slate-150 pt-1">
                  <span>Valor Pago:</span>
                  <span className="font-mono text-emerald-800 font-bold">{formatKz(viewingWO.amountPaid || 0)}</span>
                </div>
                <div className="flex justify-between font-black text-slate-900 border-t border-slate-150 pt-1">
                  <span>Valor em Falta:</span>
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
