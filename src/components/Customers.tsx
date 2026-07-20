import React, { useState } from 'react';
import { motion } from 'motion/react';
import { WorkOrder, Customer } from '../types';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  Search, 
  Edit3, 
  ArrowLeft, 
  Calendar, 
  Wrench, 
  Package, 
  TrendingUp, 
  FileCheck, 
  X,
  Bike,
  UserCheck,
  CheckCircle,
  Printer
} from 'lucide-react';

interface CustomersProps {
  workOrders: WorkOrder[];
  onUpdateCustomer: (oldPhone: string, updatedCustomer: Customer) => void;
}

export default function Customers({ workOrders, onUpdateCustomer }: CustomersProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Customer>({ name: '', phone: '', email: '', address: '', notes: '' });
  const [currentPage, setCurrentPage] = useState(1);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);
  
  // Modal for viewing a historic Work Order details directly
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

  // 1. Group/Consolidate customers from all Work Orders
  const getUniqueCustomers = (): Customer[] => {
    const customerMap: { [phone: string]: Customer } = {};
    
    // Sort work orders descending by date so we get the most recent customer details first
    const sortedWOs = [...workOrders].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    sortedWOs.forEach((wo) => {
      const phoneKey = (wo.customer.phone || '').trim();
      if (!phoneKey) return;
      
      // If customer phone is already in map, we only add notes or email if they are missing
      if (!customerMap[phoneKey]) {
        customerMap[phoneKey] = {
          name: wo.customer.name,
          phone: wo.customer.phone,
          email: wo.customer.email || '',
          address: wo.customer.address || '',
          notes: wo.customer.notes || '',
        };
      } else {
        // Merge missing details
        if (!customerMap[phoneKey].email && wo.customer.email) {
          customerMap[phoneKey].email = wo.customer.email;
        }
        if (!customerMap[phoneKey].address && wo.customer.address) {
          customerMap[phoneKey].address = wo.customer.address;
        }
        if (!customerMap[phoneKey].notes && wo.customer.notes) {
          customerMap[phoneKey].notes = wo.customer.notes;
        }
      }
    });

    return Object.values(customerMap);
  };

  const customersList = getUniqueCustomers();

  // Filter customers by search term
  const filteredCustomers = customersList.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.phone.includes(term) ||
      (c.email && c.email.toLowerCase().includes(term)) ||
      (c.address && c.address.toLowerCase().includes(term))
    );
  });

  const ITEMS_PER_PAGE = 4;
  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);
  const paginatedCustomers = filteredCustomers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const selectedCustomer = selectedPhone ? customersList.find(c => c.phone === selectedPhone) : null;

  // Get service history (work orders) for the selected customer
  const customerWorkOrders = selectedCustomer 
    ? workOrders.filter(wo => (wo.customer.phone || '').trim() === selectedCustomer.phone.trim())
    : [];

  const totalSpentByCustomer = customerWorkOrders
    .filter(wo => wo.status === 'Entregue')
    .reduce((sum, wo) => sum + wo.total, 0);

  // Edit action
  const handleStartEdit = () => {
    if (!selectedCustomer) return;
    setEditForm({ ...selectedCustomer });
    setIsEditing(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    if (!editForm.name.trim() || !editForm.phone.trim()) {
      alert('Nome e Telefone são obrigatórios.');
      return;
    }
    onUpdateCustomer(selectedCustomer.phone, editForm);
    setSelectedPhone(editForm.phone); // update selector phone pointer in case phone changed
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Detail view / Profile view */}
      {selectedCustomer ? (
        <div className="space-y-6">
          {/* Header & Back Button */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <button
              onClick={() => {
                setSelectedPhone(null);
                setIsEditing(false);
              }}
              className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-amber-500 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para a Lista de Clientes
            </button>

            <div className="flex gap-2">
              {!isEditing && (
                <button
                  onClick={handleStartEdit}
                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-xs font-black rounded-full border border-amber-500/20"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Editar Dados do Perfil
                </button>
              )}
            </div>
          </div>

          {/* Profile Overview and Edit State */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Customer Details Box */}
            <div className="lg:col-span-1 bg-[#111216]/60 border border-slate-800/60 rounded-3xl p-6 space-y-6">
              {isEditing ? (
                <form onSubmit={handleSaveEdit} className="space-y-4">
                  <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider pb-2 border-b border-slate-850">
                    Editar Perfil
                  </h3>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nome Completo</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full bg-[#0a0b0d]/50 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Contacto Telefónico</label>
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full bg-[#0a0b0d]/50 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email</label>
                    <input
                      type="email"
                      value={editForm.email || ''}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full bg-[#0a0b0d]/50 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Morada</label>
                    <input
                      type="text"
                      value={editForm.address || ''}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      className="w-full bg-[#0a0b0d]/50 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Observações do Cliente</label>
                    <textarea
                      value={editForm.notes || ''}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      className="w-full bg-[#0a0b0d]/50 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 h-24 resize-none"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl uppercase tracking-wider cursor-pointer"
                    >
                      Guardar Alterações
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-5">
                  <div className="text-center pb-4 border-b border-slate-850">
                    <div className="h-16 w-16 bg-gradient-to-tr from-amber-500 to-amber-300 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/10">
                      <User className="h-8 w-8 text-slate-950" />
                    </div>
                    <h2 className="text-base font-black text-slate-100 leading-tight">{selectedCustomer.name}</h2>
                    <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2.5 py-1 rounded-full font-extrabold uppercase tracking-wider inline-block mt-2">
                      Ficha de Cliente
                    </span>
                  </div>

                  {/* Contact details */}
                  <div className="space-y-3.5 text-xs">
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-amber-500 shrink-0" />
                      <div>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Telemóvel / Telefone</p>
                        <p className="text-slate-200 font-semibold">{selectedCustomer.phone}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-amber-500 shrink-0" />
                      <div>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Email</p>
                        <p className="text-slate-200 font-semibold">{selectedCustomer.email || <span className="text-slate-600 italic">Não fornecido</span>}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-amber-500 shrink-0" />
                      <div>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Morada</p>
                        <p className="text-slate-200 font-semibold">{selectedCustomer.address || <span className="text-slate-600 italic">Não fornecido</span>}</p>
                      </div>
                    </div>
                  </div>

                  {/* Customer Observations / Notes Box */}
                  <div className="p-4 bg-[#0a0b0d]/50 border border-slate-850 rounded-2xl">
                    <p className="text-[9px] text-slate-450 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <FileText className="h-3 w-3 text-amber-500" /> Observações do Cliente
                    </p>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                      {selectedCustomer.notes || <span className="text-slate-500 italic">Nenhuma observação guardada para este cliente.</span>}
                    </p>
                  </div>

                  {/* Core Customer Stats */}
                  <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl space-y-3">
                    <p className="text-[9px] text-amber-500 font-bold uppercase tracking-wider block">Resumo Comercial</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Visitas</span>
                        <span className="text-lg font-black text-slate-200 font-mono">{customerWorkOrders.length} OS</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Total Gasto</span>
                        <span className="text-lg font-black text-amber-500 font-mono">{formatKz(totalSpentByCustomer)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Service History - "Histórico de ordens de serviço por cliente" */}
            <div className="lg:col-span-2 bg-[#111216]/60 border border-slate-800/60 rounded-3xl p-6 space-y-4">
              <div>
                <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Wrench className="h-4.5 w-4.5 text-amber-500" />
                  Histórico de Ordens de Serviço
                </h3>
                <p className="text-[10px] text-slate-500">Lista completa de reparações e orçamentos registrados para {selectedCustomer.name}</p>
              </div>

              {customerWorkOrders.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-500 italic bg-[#0a0b0d]/30 border border-slate-850 rounded-2xl">
                  Nenhuma ordem de serviço registrada para este contacto.
                </div>
              ) : (
                <div className="space-y-3 overflow-y-auto max-h-[600px] pr-1">
                  {customerWorkOrders.map((wo) => {
                    const statusColors = {
                      'Orçamento': 'bg-slate-800 text-slate-400 border-slate-700/60',
                      'Aprovado': 'bg-blue-950 text-blue-300 border-blue-900/40',
                      'Em Execução': 'bg-amber-950 text-amber-300 border-amber-900/40',
                      'Pronto': 'bg-emerald-950 text-emerald-300 border-emerald-900/40',
                      'Entregue': 'bg-slate-900 text-slate-500 border-slate-800',
                    };

                    return (
                      <div 
                        key={wo.id}
                        className="bg-[#0a0b0d]/60 border border-slate-850 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-slate-800 transition-colors"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-black text-slate-200">OS #{wo.orderNumber}</span>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${statusColors[wo.status]}`}>
                              {wo.status}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1 text-[11px] text-slate-300 font-semibold">
                            <Bike className="h-3.5 w-3.5 text-amber-500" />
                            <span>{wo.bicycle.brand} {wo.bicycle.model}</span>
                            {wo.bicycle.color && <span className="text-slate-500">({wo.bicycle.color})</span>}
                          </div>

                          <p className="text-[10px] text-slate-500">
                            Entrada em: {new Date(wo.createdAt).toLocaleDateString('pt-AO')} às {new Date(wo.createdAt).toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>

                        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end shrink-0">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-500 block">Total Pago</span>
                            <span className="text-sm font-black text-amber-500 font-mono">{formatKz(wo.total)}</span>
                          </div>

                          <button
                            onClick={() => setViewingWO(wo)}
                            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-full text-[10px] font-black text-slate-300 cursor-pointer transition-all"
                          >
                            Visualizar Fatura
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      ) : (
        /* List View */
        <div className="space-y-6">
          
          {/* Header */}
          <div>
            <h1 className="text-xl font-sans font-black text-slate-100 flex items-center gap-2.5">
              <UserCheck className="h-5 w-5 text-amber-500" />
              Gestão de Clientes Bike One
            </h1>
            <p className="text-xs text-slate-400">Consulte informações detalhadas, anotações personalizadas e histórico de ordens de serviço por cliente</p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#111216]/60 border border-slate-800/60 rounded-3xl p-5 shadow-sm">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total de Clientes Registrados</span>
              <span className="text-2xl font-black text-slate-200 block font-mono mt-1">{customersList.length}</span>
              <p className="text-[10px] text-slate-500 mt-1">Clientes recorrentes na oficina</p>
            </div>

            <div className="bg-[#111216]/60 border border-slate-800/60 rounded-3xl p-5 shadow-sm">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Faturado em Oficina</span>
              <span className="text-2xl font-black text-amber-500 block font-mono mt-1">
                {formatKz(workOrders.filter(wo => wo.status === 'Entregue').reduce((sum, wo) => sum + wo.total, 0))}
              </span>
              <p className="text-[10px] text-slate-500 mt-1">Soma móvel de pagamentos de OS</p>
            </div>

            <div className="bg-[#111216]/60 border border-slate-800/60 rounded-3xl p-5 shadow-sm">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Média por Ficha Técnica</span>
              <span className="text-2xl font-black text-emerald-400 block font-mono mt-1">
                {formatKz(
                  workOrders.length > 0 
                    ? (workOrders.reduce((sum, wo) => sum + wo.total, 0) / workOrders.length) 
                    : 0
                )}
              </span>
              <p className="text-[10px] text-slate-500 mt-1">Ticket médio por Ordem de Serviço</p>
            </div>
          </div>

          {/* Search bar & customer cards list */}
          <div className="space-y-4">
            <div className="flex gap-2.5 items-center bg-[#111216]/60 border border-slate-800/60 rounded-2xl px-4 py-2.5 max-w-md">
              <Search className="h-4.5 w-4.5 text-slate-500 shrink-0" />
              <input
                type="text"
                placeholder="Pesquisar por nome, telemóvel, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent text-xs text-slate-200 focus:outline-none placeholder-slate-600 font-medium"
              />
            </div>

            {filteredCustomers.length === 0 ? (
              <div className="p-16 text-center text-xs text-slate-500 bg-[#111216]/40 border border-slate-850 rounded-3xl italic">
                Nenhum cliente correspondente à pesquisa.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedCustomers.map((c) => {
                  const clientOrders = workOrders.filter(wo => (wo.customer.phone || '').trim() === c.phone.trim());
                  const deliveredOrders = clientOrders.filter(wo => wo.status === 'Entregue');
                  const clientSpend = deliveredOrders.reduce((sum, wo) => sum + wo.total, 0);

                  return (
                    <div
                      key={c.phone}
                      onClick={() => setSelectedPhone(c.phone)}
                      className="bg-[#111216]/60 border border-slate-800/60 p-5 rounded-3xl flex flex-col justify-between gap-5 hover:border-amber-500/40 transition-all hover:shadow-lg hover:shadow-amber-500/[0.02] cursor-pointer relative overflow-hidden group"
                    >
                      <div className="space-y-3.5">
                        <div className="flex items-start justify-between">
                          <div className="space-y-0.5">
                            <h3 className="text-sm font-black text-slate-200 group-hover:text-amber-500 transition-colors">
                              {c.name}
                            </h3>
                            <span className="text-[10px] text-slate-500 font-mono">{c.phone}</span>
                          </div>

                          <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                            <User className="h-4 w-4" />
                          </div>
                        </div>

                        {/* Customer simple meta */}
                        <div className="space-y-1.5 text-[11px] text-slate-400">
                          {c.email && (
                            <p className="truncate flex items-center gap-1.5">
                              <Mail className="h-3 w-3 text-slate-500 shrink-0" />
                              <span className="truncate">{c.email}</span>
                            </p>
                          )}
                          {c.address && (
                            <p className="truncate flex items-center gap-1.5">
                              <MapPin className="h-3 w-3 text-slate-500 shrink-0" />
                              <span className="truncate">{c.address}</span>
                            </p>
                          )}
                          {c.notes && (
                            <p className="truncate text-amber-500/80 bg-amber-500/[0.03] px-2 py-1 rounded border border-amber-500/10 text-[10px] italic flex items-center gap-1">
                              <FileText className="h-3 w-3 shrink-0" />
                              <span className="truncate">{c.notes}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Stat Footer */}
                      <div className="pt-3 border-t border-slate-850 flex justify-between items-center text-[10px] font-bold">
                        <div>
                          <span className="text-slate-500 block">Atendimentos</span>
                          <span className="text-slate-200 font-mono font-black">{clientOrders.length} ordens</span>
                        </div>

                        <div className="text-right">
                          <span className="text-slate-500 block">Total Faturado</span>
                          <span className="text-amber-500 font-mono font-black">{formatKz(clientSpend)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center pt-5 border-t border-slate-850/60 mt-4">
                <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">
                  Página {currentPage} de {totalPages} ({filteredCustomers.length} clientes)
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

        </div>
      )}

      {/* Invoice Viewer Modal Overlay */}
      {viewingWO && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 relative border border-slate-200 shadow-2xl">
            
            {/* Modal header */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 mb-6 print:hidden">
              <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Detalhamento Técnico de Fatura</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-500 text-slate-950 hover:bg-amber-400 text-[10px] font-black rounded-full uppercase cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" /> Imprimir
                </button>
                <button
                  onClick={() => setViewingWO(null)}
                  className="p-1.5 text-slate-500 hover:text-slate-800 rounded-full border border-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Print Container */}
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

              {/* Itemized list */}
              <div className="py-2 space-y-4">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                      <th className="py-2 px-3">Descrição do Serviço / Mão de Obra</th>
                      <th className="py-2 px-3 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingWO.services.map((s, index) => (
                      <tr key={index} className="border-b border-slate-100">
                        <td className="py-2 px-3 font-semibold text-slate-800">{s.name}</td>
                        <td className="py-2 px-3 text-right font-mono text-slate-600">{formatKz(s.laborValue)}</td>
                      </tr>
                    ))}
                    {viewingWO.services.length === 0 && (
                      <tr>
                        <td colSpan={2} className="py-3 px-3 text-center text-slate-400 italic">Nenhum serviço registrado.</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Parts */}
                <table className="w-full text-left text-xs text-slate-700 mt-4">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                      <th className="py-2 px-3">Peça / Acessório Utilizado</th>
                      <th className="py-2 px-3 text-center w-24">Qtd.</th>
                      <th className="py-2 px-3 text-right w-28">Unitário</th>
                      <th className="py-2 px-3 text-right w-32">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingWO.parts.map((p, index) => (
                      <tr key={index} className="border-b border-slate-100">
                        <td className="py-2 px-3 font-semibold text-slate-800">{p.name}</td>
                        <td className="py-2 px-3 text-center font-mono">{p.quantity}</td>
                        <td className="py-2 px-3 text-right font-mono">{formatKz(p.unitPrice)}</td>
                        <td className="py-2 px-3 text-right font-mono font-semibold text-slate-800">{formatKz(p.unitPrice * p.quantity)}</td>
                      </tr>
                    ))}
                    {viewingWO.parts.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-3 px-3 text-center text-slate-400 italic">Nenhuma peça ou acessório substituído.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Total Billing */}
              <div className="flex justify-end pt-4 border-t border-slate-200">
                <div className="w-64 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Mão de Obra Total:</span>
                    <span className="font-mono text-slate-800 font-medium">{formatKz(viewingWO.laborTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Peças & Materiais Total:</span>
                    <span className="font-mono text-slate-800 font-medium">{formatKz(viewingWO.partsTotal)}</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-slate-900 border-t border-slate-250 pt-2.5">
                    <span>TOTAL A PAGAR:</span>
                    <span className="font-mono text-amber-800">{formatKz(viewingWO.total)}</span>
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
