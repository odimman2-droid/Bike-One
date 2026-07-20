import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Service, WorkOrder } from '../types';
import { 
  Wrench, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Clock, 
  TrendingUp, 
  Calendar,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';

interface ServicesProps {
  services: Service[];
  workOrders: WorkOrder[];
  onAddService: (service: Omit<Service, 'id'>) => void;
  onEditService: (service: Service) => void;
  onDeleteService: (id: string) => void;
}

export default function Services({
  services,
  workOrders,
  onAddService,
  onEditService,
  onDeleteService,
}: ServicesProps) {
  // Search and filter states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Ativo' | 'Inativo'>('Todos');
  const [currentPage, setCurrentPage] = useState(1);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  // Modal / Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    laborValue: 0,
    estimatedTime: '',
    status: 'Ativo' as 'Ativo' | 'Inativo'
  });
  const [formError, setFormError] = useState('');

  // Usage report states
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);
  
  const [startDateStr, setStartDateStr] = useState(thirtyDaysAgo.toISOString().split('T')[0]);
  const [endDateStr, setEndDateStr] = useState(today.toISOString().split('T')[0]);

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingService(null);
    setFormData({
      name: '',
      description: '',
      laborValue: 0,
      estimatedTime: '',
      status: 'Ativo'
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description,
      laborValue: service.laborValue,
      estimatedTime: service.estimatedTime || '',
      status: service.status
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('O nome do serviço é obrigatório.');
      return;
    }
    if (formData.laborValue <= 0) {
      setFormError('O valor da mão de obra deve ser superior a 0 Kz.');
      return;
    }

    if (editingService) {
      onEditService({
        id: editingService.id,
        ...formData
      });
    } else {
      onAddService(formData);
    }
    setIsModalOpen(false);
  };

  // Delete handler
  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita.')) {
      onDeleteService(id);
    }
  };

  // Filtered services
  const filteredServices = services.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                          s.description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'Todos' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const ITEMS_PER_PAGE = 4;
  const totalPages = Math.ceil(filteredServices.length / ITEMS_PER_PAGE);
  const paginatedServices = filteredServices.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Calculate usage statistics by service within selected period
  const getUsageStatistics = () => {
    // Filter delivered work orders within range
    const ordersInRange = workOrders.filter((wo) => {
      if (wo.status !== 'Entregue') return false;
      const date = wo.updatedAt.split('T')[0];
      return date >= startDateStr && date <= endDateStr;
    });

    // Compute stats per service
    return services.map((service) => {
      let count = 0;
      let totalRevenue = 0;

      ordersInRange.forEach((wo) => {
        wo.services.forEach((s) => {
          if (s.serviceId === service.id) {
            count++;
            totalRevenue += s.laborValue; // Use the actual labor value billed
          }
        });
      });

      return {
        id: service.id,
        name: service.name,
        count,
        totalRevenue
      };
    }).sort((a, b) => b.count - a.count); // Sorted by most popular
  };

  const usageStats = getUsageStatistics();
  const grandTotalRevenue = usageStats.reduce((sum, s) => sum + s.totalRevenue, 0);
  const grandTotalCount = usageStats.reduce((sum, s) => sum + s.count, 0);

  // Currency Formatter
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

  return (
    <div className="space-y-6" id="services-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-sans font-extrabold text-slate-100 flex items-center gap-2.5">
            <Wrench className="h-5 w-5 text-blue-500" />
            Catálogo de Serviços de Manutenção
          </h1>
          <p className="text-xs text-slate-400">Cadastre, edite e acompanhe os serviços oferecidos na oficina</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all active:translate-y-0.5 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Novo Serviço
        </button>
      </div>

      {/* Main Grid: Left is Services List, Right is Usage Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: CRUD list & search */}
        <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Pesquisar serviço..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-800/40 border border-slate-700/80 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            {/* Status Filter */}
            <div className="flex bg-slate-800/40 border border-slate-700/80 p-0.5 rounded-xl text-xs">
              {(['Todos', 'Ativo', 'Inativo'] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setStatusFilter(opt)}
                  className={`px-3 py-1.5 rounded-lg transition-all font-bold cursor-pointer ${
                    statusFilter === opt
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {filteredServices.length === 0 ? (
            <div className="py-16 text-center text-slate-500 space-y-2">
              <Wrench className="h-10 w-10 mx-auto opacity-30 text-slate-400" />
              <p className="text-sm">Nenhum serviço encontrado com os filtros atuais.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paginatedServices.map((service) => (
                <motion.div
                  layout
                  key={service.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                    service.status === 'Ativo'
                      ? 'bg-slate-950/40 border-slate-800 hover:border-slate-700/80'
                      : 'bg-slate-950/20 border-slate-900/60 opacity-60'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="text-xs font-extrabold text-slate-200 line-clamp-1">{service.name}</h3>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        service.status === 'Ativo' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-slate-800 text-slate-500 border border-slate-700'
                      }`}>
                        {service.status}
                      </span>
                    </div>
                    
                    <p className="text-[11px] text-slate-400 line-clamp-2 min-h-[32px]">{service.description}</p>
                    
                    <div className="flex items-center gap-4 text-[10px] text-slate-500 pt-1">
                      {service.estimatedTime && (
                        <span className="flex items-center gap-1.5 font-medium">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {service.estimatedTime}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 mt-3 border-t border-slate-900/80">
                    <span className="font-mono text-xs font-black text-slate-200">
                      {formatKz(service.laborValue)}
                    </span>
                    
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(service)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 hover:text-blue-400 text-slate-400 rounded-lg transition-colors cursor-pointer"
                        title="Editar Serviço"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(service.id)}
                        className="p-1.5 bg-slate-800 hover:bg-rose-950/50 hover:text-rose-400 text-slate-400 rounded-lg transition-colors cursor-pointer"
                        title="Excluir Serviço"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center pt-5 border-t border-slate-850/60 mt-4">
              <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">
                Página {currentPage} de {totalPages} ({filteredServices.length} serviços)
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

        {/* RIGHT COLUMN: Usage Reports by Period */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
            <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
            <div>
              <h3 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider">Uso por Período</h3>
              <p className="text-[10px] text-slate-500">Estatísticas de serviços prestados</p>
            </div>
          </div>

          {/* Date range selection */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Desde</label>
                <input
                  type="date"
                  value={startDateStr}
                  onChange={(e) => setStartDateStr(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-1.5 text-[10px] text-slate-300 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Até</label>
                <input
                  type="date"
                  value={endDateStr}
                  onChange={(e) => setEndDateStr(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-1.5 text-[10px] text-slate-300 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Aggregated Totals */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl">
            <div className="space-y-0.5">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Serviços Prestados</span>
              <span className="text-sm font-black text-slate-200 block">{grandTotalCount} execuções</span>
            </div>
            <div className="space-y-0.5 border-l border-slate-850 pl-3">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Total Faturado</span>
              <span className="text-sm font-black text-blue-400 block">{formatKz(grandTotalRevenue)}</span>
            </div>
          </div>

          {/* Ranked list of service usage */}
          <div className="space-y-3 pt-2 max-h-72 overflow-y-auto pr-1">
            <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-blue-500" /> Ranking de Popularidade
            </h4>
            {usageStats.length === 0 ? (
              <p className="text-[11px] text-slate-500 text-center py-4">Nenhum serviço realizado neste período.</p>
            ) : (
              usageStats.map((stat) => {
                // Calculate percentage for progress meter
                const percentage = grandTotalCount > 0 ? (stat.count / grandTotalCount) * 100 : 0;
                return (
                  <div key={stat.id} className="space-y-1 text-xs">
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-bold text-slate-300 truncate max-w-[150px]">{stat.name}</span>
                      <span className="font-mono font-bold text-slate-400 shrink-0">{stat.count}x</span>
                    </div>
                    {/* Visual meter */}
                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                      <div 
                        className="bg-blue-600 h-full rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-500 font-medium">
                      <span>{percentage.toFixed(0)}% do total</span>
                      <span className="font-bold text-slate-400">{formatKz(stat.totalRevenue)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* CREATE/EDIT MODAL DIALOG */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
          >
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/40 flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-100 flex items-center gap-2">
                <Wrench className="h-4.5 w-4.5 text-blue-500" />
                {editingService ? 'Editar Serviço' : 'Novo Serviço de Manutenção'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-xs font-bold cursor-pointer"
              >
                Fechar
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="flex items-start gap-2 text-rose-400 text-xs bg-rose-950/30 border border-rose-800/30 p-3 rounded-lg">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Service Name */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Nome do Serviço <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Centrar Roda Traseira, Revisão Hidráulica..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Descrição do Serviço
                </label>
                <textarea
                  placeholder="Descreva as tarefas englobadas..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 h-20 resize-none"
                />
              </div>

              {/* Labor Value & Estimated Time */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Mão de Obra (Kz) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={formData.laborValue || ''}
                    onChange={(e) => setFormData({ ...formData, laborValue: Number(e.target.value) })}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
                    required
                    min={0}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Tempo Estimado
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 45 min, 1 hora, 2 dias"
                    value={formData.estimatedTime}
                    onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500"
                  />
                </div>
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Estado de Serviço
                </label>
                <div className="flex gap-2">
                  {(['Ativo', 'Inativo'] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setFormData({ ...formData, status })}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                        formData.status === status
                          ? 'bg-blue-600/20 border-blue-500 text-blue-200'
                          : 'bg-slate-800/50 border-slate-700/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t border-slate-800 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md cursor-pointer"
                >
                  {editingService ? 'Salvar Alterações' : 'Criar Serviço'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
