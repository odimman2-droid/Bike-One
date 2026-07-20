import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Users, Briefcase } from 'lucide-react';
import Customers from './Customers';
import Employees from './Employees';
import { Customer, Employee, WorkOrder } from '../types';

interface PessoasProps {
  workOrders: WorkOrder[];
  onUpdateCustomer: (phone: string, updatedCustomer: Customer) => void;
  employees: Employee[];
  onAddEmployee: (employee: Omit<Employee, 'id'>) => void;
  onEditEmployee: (employee: Employee) => void;
  onDeleteEmployee: (id: string) => void;
}

export default function Pessoas({
  workOrders,
  onUpdateCustomer,
  employees,
  onAddEmployee,
  onEditEmployee,
  onDeleteEmployee,
}: PessoasProps) {
  const [activeLayer, setActiveLayer] = useState<'customers' | 'employees'>('customers');

  return (
    <div className="space-y-6" id="pessoas-view">
      {/* Tab Layer Selector Buttons */}
      <div className="flex gap-2 p-1.5 bg-[#111216]/60 border border-slate-800/60 rounded-3xl w-fit print:hidden">
        <button
          onClick={() => setActiveLayer('customers')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer uppercase tracking-wider ${
            activeLayer === 'customers'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/15'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="h-4 w-4" />
          Clientes Recorrentes
        </button>
        <button
          onClick={() => setActiveLayer('employees')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer uppercase tracking-wider ${
            activeLayer === 'employees'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/15'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Briefcase className="h-4 w-4" />
          Gerir Funcionários
        </button>
      </div>

      {/* Layer view rendering with motion fade/slide */}
      <motion.div
        key={activeLayer}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        {activeLayer === 'customers' ? (
          <Customers
            workOrders={workOrders}
            onUpdateCustomer={onUpdateCustomer}
          />
        ) : (
          <Employees
            employees={employees}
            onAddEmployee={onAddEmployee}
            onEditEmployee={onEditEmployee}
            onDeleteEmployee={onDeleteEmployee}
          />
        )}
      </motion.div>
    </div>
  );
}
