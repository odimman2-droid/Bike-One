import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Employee } from '../types';
import { 
  UserPlus, 
  Search, 
  Edit3, 
  Trash2, 
  Phone, 
  Coins, 
  Briefcase, 
  Calendar, 
  CheckCircle, 
  X,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

interface EmployeesProps {
  employees: Employee[];
  onAddEmployee: (employee: Omit<Employee, 'id'>) => void;
  onEditEmployee: (employee: Employee) => void;
  onDeleteEmployee: (id: string) => void;
}

export default function Employees({
  employees,
  onAddEmployee,
  onEditEmployee,
  onDeleteEmployee,
}: EmployeesProps) {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    role: 'Mecânico' as 'Administrador' | 'Mecânico' | 'Atendente',
    salary: 0,
    status: 'Ativo' as 'Ativo' | 'Inativo',
  });
  const [formError, setFormError] = useState('');

  // Reset pagination when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [search]);

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

  const handleOpenAdd = () => {
    setEditingEmployee(null);
    setFormData({
      name: '',
      phone: '',
      role: 'Mecânico',
      salary: 0,
      status: 'Ativo',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({
      name: emp.name,
      phone: emp.phone,
      role: emp.role,
      salary: emp.salary,
      status: emp.status,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('O nome do funcionário é obrigatório.');
      return;
    }
    if (!formData.phone.trim()) {
      setFormError('O telefone do funcionário é obrigatório.');
      return;
    }
    if (formData.salary <= 0) {
      setFormError('O salário deve ser superior a 0 Kz.');
      return;
    }

    if (editingEmployee) {
      onEditEmployee({
        id: editingEmployee.id,
        hiredAt: editingEmployee.hiredAt,
        ...formData
      });
    } else {
      onAddEmployee({
        ...formData,
        hiredAt: new Date().toISOString()
      });
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja remover este funcionário?')) {
      onDeleteEmployee(id);
    }
  };

  // Filters
  const filteredEmployees = employees.filter((emp) => {
    const term = search.toLowerCase();
    return (
      emp.name.toLowerCase().includes(term) ||
      emp.phone.includes(term) ||
      emp.role.toLowerCase().includes(term)
    );
  });

  // Pagination
  const ITEMS_PER_PAGE = 4;
  const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Statistics
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e => e.status === 'Ativo').length;
  const totalSalaryRoll = employees.filter(e => e.status === 'Ativo').reduce((sum, e) => sum + e.salary, 0);
  const mechanicsCount = employees.filter(e => e.status === 'Ativo' && e.role === 'Mecânico').length;

  return (
    <div className="space-y-6" id="employees-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-sans font-black text-slate-100 flex items-center gap-2.5">
            <Briefcase className="h-5 w-5 text-amber-500" />
            Gestão de Funcionários
          </h1>
          <p className="text-xs text-slate-400">Gerencie equipe, cargos, folhas de pagamento e contratações</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold rounded-full shadow-lg shadow-amber-500/10 transition-all active:translate-y-0.5 cursor-pointer uppercase tracking-wider text-[11px]"
        >
          <UserPlus className="h-4 w-4 stroke-[3]" />
          Adicionar Funcionário
        </button>
      </div>

      {/* Staff Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111216]/60 border border-slate-800/60 p-5 rounded-3xl space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Equipe Total</span>
          <span className="text-lg font-black text-slate-100 block">{totalEmployees} colaboradores</span>
          <span className="text-[9px] text-slate-500 block">{activeEmployees} ativos neste momento</span>
        </div>
        <div className="bg-[#111216]/60 border border-slate-800/60 p-5 rounded-3xl space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Folha Mensal</span>
          <span className="text-lg font-black text-slate-100 block">{formatKz(totalSalaryRoll)}</span>
          <span className="text-[9px] text-slate-500 block">Apenas funcionários ativos</span>
        </div>
        <div className="bg-[#111216]/60 border border-slate-800/60 p-5 rounded-3xl space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Mecânicos Oficiais</span>
          <span className="text-lg font-black text-amber-500 block">{mechanicsCount} mecânicos</span>
          <span className="text-[9px] text-slate-500 block">Especialistas na oficina</span>
        </div>
        <div className="bg-[#111216]/60 border border-slate-800/60 p-5 rounded-3xl space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Média Salarial</span>
          <span className="text-lg font-black text-emerald-400 block">
            {formatKz(activeEmployees > 0 ? Math.round(totalSalaryRoll / activeEmployees) : 0)}
          </span>
          <span className="text-[9px] text-slate-500 block">Por funcionário ativo</span>
        </div>
      </div>

      {/* List section */}
      <div className="bg-[#111216]/60 border border-slate-800/60 rounded-3xl p-6 shadow-md space-y-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Pesquisar funcionário por nome, telefone, cargo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#0a0b0d]/50 border border-slate-800 rounded-2xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
          />
        </div>

        {/* Cards Grid */}
        {filteredEmployees.length === 0 ? (
          <div className="py-16 text-center text-slate-500 space-y-2">
            <Briefcase className="h-10 w-10 mx-auto opacity-30 text-slate-400" />
            <p className="text-sm">Nenhum funcionário encontrado.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paginatedEmployees.map((emp) => (
                <div
                  key={emp.id}
                  className={`p-5 rounded-3xl border flex flex-col justify-between transition-all ${
                    emp.status === 'Ativo'
                      ? 'bg-slate-950/40 border-slate-850 hover:border-slate-800/80'
                      : 'bg-slate-950/20 border-slate-900/60 opacity-60'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-sm font-black text-slate-200 leading-snug">{emp.name}</h3>
                        <span className="text-[10px] text-slate-500 font-mono">{emp.phone}</span>
                      </div>
                      <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full ${
                        emp.status === 'Ativo'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-800 text-slate-500 border border-slate-700'
                      }`}>
                        {emp.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Briefcase className="h-4 w-4 text-amber-500 shrink-0" />
                        <div>
                          <p className="text-[8px] text-slate-500 uppercase tracking-wider font-extrabold">Cargo</p>
                          <p className="font-bold text-slate-300">{emp.role}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-slate-400">
                        <Coins className="h-4 w-4 text-emerald-500 shrink-0" />
                        <div>
                          <p className="text-[8px] text-slate-500 uppercase tracking-wider font-extrabold">Salário Base</p>
                          <p className="font-bold font-mono text-slate-200">{formatKz(emp.salary)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[9px] text-slate-500 pt-2 border-t border-slate-900/40">
                      <Calendar className="h-3 w-3" />
                      <span>Contratado em: {new Date(emp.hiredAt).toLocaleDateString('pt-AO')}</span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-1.5 pt-4 mt-3 border-t border-slate-900/40">
                    <button
                      onClick={() => handleOpenEdit(emp)}
                      className="p-2 bg-slate-900 hover:bg-slate-800 hover:text-amber-500 text-slate-400 rounded-xl transition-all cursor-pointer border border-slate-850"
                      title="Editar Ficha"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(emp.id)}
                      className="p-2 bg-slate-900 hover:bg-rose-950/40 hover:text-rose-400 text-slate-500 rounded-xl transition-all cursor-pointer border border-slate-850"
                      title="Excluir Colaborador"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center pt-5 border-t border-slate-850/60 mt-4">
                <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">
                  Página {currentPage} de {totalPages} ({filteredEmployees.length} funcionários)
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
      </div>

      {/* CREATE/EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#111216] border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-850">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <Briefcase className="h-4.5 w-4.5 text-amber-500" />
                {editingEmployee ? 'Editar Funcionário' : 'Novo Funcionário'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-950/30 border border-rose-900/30 rounded-xl text-rose-400 text-[10px] font-bold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: João Baptista"
                  className="w-full bg-[#0a0b0d]/50 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Telemóvel / Telefone</label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Ex: 923456789"
                  className="w-full bg-[#0a0b0d]/50 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cargo / Função</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full bg-[#0a0b0d]/50 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="Mecânico">Mecânico</option>
                    <option value="Atendente">Atendente</option>
                    <option value="Administrador">Administrador</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Salário Base (Kz)</label>
                  <input
                    type="number"
                    required
                    value={formData.salary || ''}
                    onChange={(e) => setFormData({ ...formData, salary: Math.max(0, parseInt(e.target.value) || 0) })}
                    placeholder="Ex: 150000"
                    className="w-full bg-[#0a0b0d]/50 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500/20 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estado</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full bg-[#0a0b0d]/50 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl uppercase tracking-wider cursor-pointer"
                >
                  {editingEmployee ? 'Atualizar Ficha' : 'Adicionar Funcionário'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
