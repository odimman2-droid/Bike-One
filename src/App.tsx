import React, { useState, useEffect } from 'react';
import { User, Service, Product, WorkOrder, DirectSale, DirectSaleItem, WorkOrderStatus, Customer, Expense, BalanceAdjustment, SalaryAdvance, Employee } from './types';
import { 
  DEFAULT_SERVICES, 
  DEFAULT_PRODUCTS, 
  DEFAULT_WORK_ORDERS, 
  DEFAULT_DIRECT_SALES,
  DEFAULT_EXPENSES
} from './data';

// Supabase Cloud Sync imports
import { saveToSupabase, loadAllFromSupabase, saveAllToSupabase, checkSupabaseConnection } from './lib/supabase';


// Component imports
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import WorkOrders from './components/WorkOrders';
import StockAndServices from './components/StockAndServices';
import SettingsView from './components/Settings';
import Pessoas from './components/Pessoas';
import Sales from './components/Sales';
import QuickSaleModal from './components/QuickSaleModal';

// LocalStorage Keys
const STORAGE_KEYS = {
  USER: 'bikeone_logged_user',
  SERVICES: 'bikeone_services_v1',
  PRODUCTS: 'bikeone_products_v1',
  WORK_ORDERS: 'bikeone_workorders_v1',
  DIRECT_SALES: 'bikeone_directsales_v1',
  EXPENSES: 'bikeone_expenses_v1',
  BALANCE_ADJUSTMENTS: 'bikeone_balance_adjustments_v1',
  SALARY_ADVANCES: 'bikeone_salary_advances_v1',
  EMPLOYEES: 'bikeone_employees_v1',
};

export default function App() {
  // 1. Initialize State lazily from LocalStorage (Avoiding redundant re-runs)
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.USER);
    return stored ? JSON.parse(stored) : null;
  });

  const [baseBalance, setBaseBalance] = useState<number>(() => {
    const stored = localStorage.getItem('bikeone_base_balance_v1');
    return stored ? parseFloat(stored) : 0;
  });

  const [services, setServices] = useState<Service[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.SERVICES);
    if (stored) return JSON.parse(stored);
    // Initial Seed
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(DEFAULT_SERVICES));
    return DEFAULT_SERVICES;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (stored) return JSON.parse(stored);
    // Initial Seed
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(DEFAULT_PRODUCTS));
    return DEFAULT_PRODUCTS;
  });

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.WORK_ORDERS);
    return stored ? JSON.parse(stored) : [];
  });

  const [directSales, setDirectSales] = useState<DirectSale[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.DIRECT_SALES);
    return stored ? JSON.parse(stored) : [];
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    return stored ? JSON.parse(stored) : [];
  });

  const [balanceAdjustments, setBalanceAdjustments] = useState<BalanceAdjustment[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.BALANCE_ADJUSTMENTS);
    return stored ? JSON.parse(stored) : [];
  });

  const [salaryAdvances, setSalaryAdvances] = useState<SalaryAdvance[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.SALARY_ADVANCES);
    return stored ? JSON.parse(stored) : [];
  });

  const [employees, setEmployees] = useState<Employee[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    if (stored) return JSON.parse(stored);
    const initialSeed: Employee[] = [
      {
        id: 'emp1',
        name: 'Mateus Gaspar',
        phone: '923112233',
        role: 'Mecânico',
        salary: 180000,
        status: 'Ativo',
        hiredAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'emp2',
        name: 'Helena da Silva',
        phone: '931445566',
        role: 'Atendente',
        salary: 120000,
        status: 'Ativo',
        hiredAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(initialSeed));
    return initialSeed;
  });

  const [activeView, setActiveView] = useState<'dashboard' | 'os' | 'stock' | 'relatorios' | 'clientes' | 'vendas'>('dashboard');
  const [isLoadedFromSupabase, setIsLoadedFromSupabase] = useState(false);

  // Connection list keys to sync
  const SYNC_KEYS = [
    'bikeone_base_balance_v1',
    STORAGE_KEYS.SERVICES,
    STORAGE_KEYS.PRODUCTS,
    STORAGE_KEYS.WORK_ORDERS,
    STORAGE_KEYS.DIRECT_SALES,
    STORAGE_KEYS.EXPENSES,
    STORAGE_KEYS.BALANCE_ADJUSTMENTS,
    STORAGE_KEYS.SALARY_ADVANCES,
    STORAGE_KEYS.EMPLOYEES,
  ];

  const handlePullFromSupabase = async (): Promise<boolean> => {
    try {
      const conn = await checkSupabaseConnection();
      if (conn.status !== 'connected') return false;

      const data = await loadAllFromSupabase(SYNC_KEYS);
      
      if (data['bikeone_base_balance_v1'] !== undefined && data['bikeone_base_balance_v1'] !== null) {
        setBaseBalance(parseFloat(data['bikeone_base_balance_v1']));
        localStorage.setItem('bikeone_base_balance_v1', data['bikeone_base_balance_v1'].toString());
      }
      if (data[STORAGE_KEYS.SERVICES] !== undefined && data[STORAGE_KEYS.SERVICES] !== null) {
        setServices(data[STORAGE_KEYS.SERVICES]);
        localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(data[STORAGE_KEYS.SERVICES]));
      }
      if (data[STORAGE_KEYS.PRODUCTS] !== undefined && data[STORAGE_KEYS.PRODUCTS] !== null) {
        setProducts(data[STORAGE_KEYS.PRODUCTS]);
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(data[STORAGE_KEYS.PRODUCTS]));
      }
      if (data[STORAGE_KEYS.WORK_ORDERS] !== undefined && data[STORAGE_KEYS.WORK_ORDERS] !== null) {
        setWorkOrders(data[STORAGE_KEYS.WORK_ORDERS]);
        localStorage.setItem(STORAGE_KEYS.WORK_ORDERS, JSON.stringify(data[STORAGE_KEYS.WORK_ORDERS]));
      }
      if (data[STORAGE_KEYS.DIRECT_SALES] !== undefined && data[STORAGE_KEYS.DIRECT_SALES] !== null) {
        setDirectSales(data[STORAGE_KEYS.DIRECT_SALES]);
        localStorage.setItem(STORAGE_KEYS.DIRECT_SALES, JSON.stringify(data[STORAGE_KEYS.DIRECT_SALES]));
      }
      if (data[STORAGE_KEYS.EXPENSES] !== undefined && data[STORAGE_KEYS.EXPENSES] !== null) {
        setExpenses(data[STORAGE_KEYS.EXPENSES]);
        localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(data[STORAGE_KEYS.EXPENSES]));
      }
      if (data[STORAGE_KEYS.BALANCE_ADJUSTMENTS] !== undefined && data[STORAGE_KEYS.BALANCE_ADJUSTMENTS] !== null) {
        setBalanceAdjustments(data[STORAGE_KEYS.BALANCE_ADJUSTMENTS]);
        localStorage.setItem(STORAGE_KEYS.BALANCE_ADJUSTMENTS, JSON.stringify(data[STORAGE_KEYS.BALANCE_ADJUSTMENTS]));
      }
      if (data[STORAGE_KEYS.SALARY_ADVANCES] !== undefined && data[STORAGE_KEYS.SALARY_ADVANCES] !== null) {
        setSalaryAdvances(data[STORAGE_KEYS.SALARY_ADVANCES]);
        localStorage.setItem(STORAGE_KEYS.SALARY_ADVANCES, JSON.stringify(data[STORAGE_KEYS.SALARY_ADVANCES]));
      }
      if (data[STORAGE_KEYS.EMPLOYEES] !== undefined && data[STORAGE_KEYS.EMPLOYEES] !== null) {
        setEmployees(data[STORAGE_KEYS.EMPLOYEES]);
        localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(data[STORAGE_KEYS.EMPLOYEES]));
      }

      return true;
    } catch (err) {
      console.error('Error pulling from Supabase:', err);
      return false;
    }
  };

  const handlePushToSupabase = async (): Promise<boolean> => {
    try {
      const conn = await checkSupabaseConnection();
      if (conn.status !== 'connected') return false;

      const payload = {
        'bikeone_base_balance_v1': baseBalance,
        [STORAGE_KEYS.SERVICES]: services,
        [STORAGE_KEYS.PRODUCTS]: products,
        [STORAGE_KEYS.WORK_ORDERS]: workOrders,
        [STORAGE_KEYS.DIRECT_SALES]: directSales,
        [STORAGE_KEYS.EXPENSES]: expenses,
        [STORAGE_KEYS.BALANCE_ADJUSTMENTS]: balanceAdjustments,
        [STORAGE_KEYS.SALARY_ADVANCES]: salaryAdvances,
        [STORAGE_KEYS.EMPLOYEES]: employees,
      };

      const results = await saveAllToSupabase(payload);
      return Object.values(results).every(v => v);
    } catch (err) {
      console.error('Error pushing to Supabase:', err);
      return false;
    }
  };

  // 1. Load from Supabase on start
  useEffect(() => {
    const initSync = async () => {
      const conn = await checkSupabaseConnection();
      if (conn.status === 'connected') {
        const data = await loadAllFromSupabase(SYNC_KEYS);
        const hasData = Object.keys(data).length > 0;
        
        if (hasData) {
          if (data['bikeone_base_balance_v1'] !== undefined && data['bikeone_base_balance_v1'] !== null) {
            setBaseBalance(parseFloat(data['bikeone_base_balance_v1']));
          }
          if (data[STORAGE_KEYS.SERVICES] !== undefined && data[STORAGE_KEYS.SERVICES] !== null) {
            setServices(data[STORAGE_KEYS.SERVICES]);
          }
          if (data[STORAGE_KEYS.PRODUCTS] !== undefined && data[STORAGE_KEYS.PRODUCTS] !== null) {
            setProducts(data[STORAGE_KEYS.PRODUCTS]);
          }
          if (data[STORAGE_KEYS.WORK_ORDERS] !== undefined && data[STORAGE_KEYS.WORK_ORDERS] !== null) {
            setWorkOrders(data[STORAGE_KEYS.WORK_ORDERS]);
          }
          if (data[STORAGE_KEYS.DIRECT_SALES] !== undefined && data[STORAGE_KEYS.DIRECT_SALES] !== null) {
            setDirectSales(data[STORAGE_KEYS.DIRECT_SALES]);
          }
          if (data[STORAGE_KEYS.EXPENSES] !== undefined && data[STORAGE_KEYS.EXPENSES] !== null) {
            setExpenses(data[STORAGE_KEYS.EXPENSES]);
          }
          if (data[STORAGE_KEYS.BALANCE_ADJUSTMENTS] !== undefined && data[STORAGE_KEYS.BALANCE_ADJUSTMENTS] !== null) {
            setBalanceAdjustments(data[STORAGE_KEYS.BALANCE_ADJUSTMENTS]);
          }
          if (data[STORAGE_KEYS.SALARY_ADVANCES] !== undefined && data[STORAGE_KEYS.SALARY_ADVANCES] !== null) {
            setSalaryAdvances(data[STORAGE_KEYS.SALARY_ADVANCES]);
          }
          if (data[STORAGE_KEYS.EMPLOYEES] !== undefined && data[STORAGE_KEYS.EMPLOYEES] !== null) {
            setEmployees(data[STORAGE_KEYS.EMPLOYEES]);
          }
        } else {
          await saveAllToSupabase({
            'bikeone_base_balance_v1': baseBalance,
            [STORAGE_KEYS.SERVICES]: services,
            [STORAGE_KEYS.PRODUCTS]: products,
            [STORAGE_KEYS.WORK_ORDERS]: workOrders,
            [STORAGE_KEYS.DIRECT_SALES]: directSales,
            [STORAGE_KEYS.EXPENSES]: expenses,
            [STORAGE_KEYS.BALANCE_ADJUSTMENTS]: balanceAdjustments,
            [STORAGE_KEYS.SALARY_ADVANCES]: salaryAdvances,
            [STORAGE_KEYS.EMPLOYEES]: employees,
          });
        }
      }
      setIsLoadedFromSupabase(true);
    };

    initSync();
  }, []);

  // 2. Real-time changes synchronization
  useEffect(() => {
    if (!isLoadedFromSupabase) return;

    const timer = setTimeout(async () => {
      const conn = await checkSupabaseConnection();
      if (conn.status === 'connected') {
        saveToSupabase('bikeone_base_balance_v1', baseBalance);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [baseBalance, isLoadedFromSupabase]);

  useEffect(() => {
    if (!isLoadedFromSupabase) return;

    const timer = setTimeout(async () => {
      const conn = await checkSupabaseConnection();
      if (conn.status === 'connected') {
        saveToSupabase(STORAGE_KEYS.SERVICES, services);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [services, isLoadedFromSupabase]);

  useEffect(() => {
    if (!isLoadedFromSupabase) return;

    const timer = setTimeout(async () => {
      const conn = await checkSupabaseConnection();
      if (conn.status === 'connected') {
        saveToSupabase(STORAGE_KEYS.PRODUCTS, products);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [products, isLoadedFromSupabase]);

  useEffect(() => {
    if (!isLoadedFromSupabase) return;

    const timer = setTimeout(async () => {
      const conn = await checkSupabaseConnection();
      if (conn.status === 'connected') {
        saveToSupabase(STORAGE_KEYS.WORK_ORDERS, workOrders);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [workOrders, isLoadedFromSupabase]);

  useEffect(() => {
    if (!isLoadedFromSupabase) return;

    const timer = setTimeout(async () => {
      const conn = await checkSupabaseConnection();
      if (conn.status === 'connected') {
        saveToSupabase(STORAGE_KEYS.DIRECT_SALES, directSales);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [directSales, isLoadedFromSupabase]);

  useEffect(() => {
    if (!isLoadedFromSupabase) return;

    const timer = setTimeout(async () => {
      const conn = await checkSupabaseConnection();
      if (conn.status === 'connected') {
        saveToSupabase(STORAGE_KEYS.EXPENSES, expenses);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [expenses, isLoadedFromSupabase]);

  useEffect(() => {
    if (!isLoadedFromSupabase) return;

    const timer = setTimeout(async () => {
      const conn = await checkSupabaseConnection();
      if (conn.status === 'connected') {
        saveToSupabase(STORAGE_KEYS.BALANCE_ADJUSTMENTS, balanceAdjustments);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [balanceAdjustments, isLoadedFromSupabase]);

  useEffect(() => {
    if (!isLoadedFromSupabase) return;

    const timer = setTimeout(async () => {
      const conn = await checkSupabaseConnection();
      if (conn.status === 'connected') {
        saveToSupabase(STORAGE_KEYS.SALARY_ADVANCES, salaryAdvances);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [salaryAdvances, isLoadedFromSupabase]);

  useEffect(() => {
    if (!isLoadedFromSupabase) return;

    const timer = setTimeout(async () => {
      const conn = await checkSupabaseConnection();
      if (conn.status === 'connected') {
        saveToSupabase(STORAGE_KEYS.EMPLOYEES, employees);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [employees, isLoadedFromSupabase]);

  const [woInitialTab, setWoInitialTab] = useState<'list' | 'create'>('list');
  const [isQuickSaleOpen, setIsQuickSaleOpen] = useState(false);

  // Helper references to toggle modal or change tabs from dashboard
  const [triggerCreateOS, setTriggerCreateOS] = useState<(() => void) | null>(null);

  // -------------------------------------------------------------
  // MUTATION HANDLERS (Synchronize state and LocalStorage)

  // Auth
  const handleLogin = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEYS.USER);
  };

  // SERVICES CRUD
  const handleAddService = (newServicePayload: Omit<Service, 'id'>) => {
    const updated = [
      ...services,
      {
        id: 's_' + Date.now(),
        ...newServicePayload
      }
    ];
    setServices(updated);
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(updated));
  };

  const handleEditService = (edited: Service) => {
    const updated = services.map((s) => (s.id === edited.id ? edited : s));
    setServices(updated);
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(updated));
  };

  const handleDeleteService = (id: string) => {
    const updated = services.filter((s) => s.id !== id);
    setServices(updated);
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(updated));
  };

  // PRODUCTS CRUD
  const handleAddProduct = (newProductPayload: Omit<Product, 'id'>) => {
    const updated = [
      ...products,
      {
        id: 'p_' + Date.now(),
        ...newProductPayload
      }
    ];
    setProducts(updated);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
  };

  const handleEditProduct = (edited: Product) => {
    const updated = products.map((p) => (p.id === edited.id ? edited : p));
    setProducts(updated);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
  };

  const handleDeleteProduct = (id: string) => {
    const updated = products.filter((p) => p.id !== id);
    setProducts(updated);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
  };

  // STOCK ENTRY (Top Up Quantities)
  const handleAddStockEntry = (id: string, quantityToAdd: number, newPurchasePrice?: number) => {
    const updated = products.map((p) => {
      if (p.id === id) {
        return {
          ...p,
          quantity: p.quantity + quantityToAdd,
          purchasePrice: newPurchasePrice !== undefined && newPurchasePrice > 0 ? newPurchasePrice : p.purchasePrice
        };
      }
      return p;
    });
    setProducts(updated);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
  };

  // WORK ORDER MUTATIONS (Including automatic stock adjustment on payment delivery)
  const handleAddWorkOrder = (woPayload: Omit<WorkOrder, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>) => {
    const maxOrderNum = workOrders.reduce((max, wo) => (wo.orderNumber > max ? wo.orderNumber : max), 1000);
    const orderNumber = maxOrderNum + 1;
    const nowISO = new Date().toISOString();

    const newWO: WorkOrder = {
      id: 'wo_' + Date.now(),
      orderNumber,
      createdAt: nowISO,
      updatedAt: nowISO,
      ...woPayload
    };

    // If registered straight as 'Entregue' (delivered and paid), subtract stock instantly
    let updatedProducts = [...products];
    if (newWO.status === 'Entregue') {
      updatedProducts = products.map((p) => {
        const itemInWO = newWO.parts.find((part) => part.productId === p.id);
        if (itemInWO) {
          return {
            ...p,
            quantity: Math.max(0, p.quantity - itemInWO.quantity)
          };
        }
        return p;
      });
      setProducts(updatedProducts);
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updatedProducts));
    }

    const updatedWOs = [newWO, ...workOrders];
    setWorkOrders(updatedWOs);
    localStorage.setItem(STORAGE_KEYS.WORK_ORDERS, JSON.stringify(updatedWOs));
  };

  const handleEditWorkOrder = (edited: WorkOrder) => {
    const original = workOrders.find((w) => w.id === edited.id);
    if (!original) return;

    let updatedProducts = [...products];

    // Trigger stock deduction ONLY when status transitions from something else to 'Entregue'
    if (edited.status === 'Entregue' && original.status !== 'Entregue') {
      updatedProducts = products.map((p) => {
        const itemInWO = edited.parts.find((part) => part.productId === p.id);
        if (itemInWO) {
          return {
            ...p,
            quantity: Math.max(0, p.quantity - itemInWO.quantity)
          };
        }
        return p;
      });
      setProducts(updatedProducts);
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updatedProducts));
    } 
    // Revert stock if transitioning AWAY from 'Entregue' (e.g. error correction)
    else if (original.status === 'Entregue' && edited.status !== 'Entregue') {
      updatedProducts = products.map((p) => {
        const itemInWO = original.parts.find((part) => part.productId === p.id);
        if (itemInWO) {
          return {
            ...p,
            quantity: p.quantity + itemInWO.quantity
          };
        }
        return p;
      });
      setProducts(updatedProducts);
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updatedProducts));
    }

    const updatedWOs = workOrders.map((wo) => (wo.id === edited.id ? edited : wo));
    setWorkOrders(updatedWOs);
    localStorage.setItem(STORAGE_KEYS.WORK_ORDERS, JSON.stringify(updatedWOs));
  };

  const handleDeleteWorkOrder = (id: string) => {
    const original = workOrders.find((w) => w.id === id);
    let updatedProducts = [...products];

    // Revert stock of parts if deleting a finalized delivered OS
    if (original && original.status === 'Entregue') {
      updatedProducts = products.map((p) => {
        const itemInWO = original.parts.find((part) => part.productId === p.id);
        if (itemInWO) {
          return {
            ...p,
            quantity: p.quantity + itemInWO.quantity
          };
        }
        return p;
      });
      setProducts(updatedProducts);
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updatedProducts));
    }

    const updatedWOs = workOrders.filter((wo) => wo.id !== id);
    setWorkOrders(updatedWOs);
    localStorage.setItem(STORAGE_KEYS.WORK_ORDERS, JSON.stringify(updatedWOs));
  };

  // DIRECT POINT OF SALE (POS) SALES
  const handleConfirmDirectSale = (
    customerName: string, 
    items: DirectSaleItem[],
    paymentStatus: 'Pendente' | 'Pago 50%' | 'Pago Integral' = 'Pago Integral',
    amountPaid?: number,
    paymentMethod: 'Dinheiro' | 'Transferência' = 'Dinheiro'
  ) => {
    const total = items.reduce((sum, item) => sum + ((item.unitPrice - (item.discount || 0)) * item.quantity), 0);
    const finalAmountPaid = amountPaid !== undefined ? amountPaid 
                          : paymentStatus === 'Pendente' ? 0 
                          : paymentStatus === 'Pago 50%' ? Math.round(total * 0.5) 
                          : total;
    
    const newSale: DirectSale = {
      id: 'ds_' + Date.now(),
      customerName,
      items,
      total,
      createdAt: new Date().toISOString(),
      paymentStatus,
      amountPaid: finalAmountPaid,
      paymentMethod,
    };

    // Deduct stock
    const updatedProducts = products.map((p) => {
      const soldItem = items.find((item) => item.productId === p.id);
      if (soldItem) {
        return {
          ...p,
          quantity: Math.max(0, p.quantity - soldItem.quantity)
        };
      }
      return p;
    });

    setProducts(updatedProducts);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updatedProducts));

    const updatedSales = [newSale, ...directSales];
    setDirectSales(updatedSales);
    localStorage.setItem(STORAGE_KEYS.DIRECT_SALES, JSON.stringify(updatedSales));
  };

  const handleEditDirectSale = (edited: DirectSale) => {
    const updated = directSales.map((ds) => (ds.id === edited.id ? edited : ds));
    setDirectSales(updated);
    localStorage.setItem(STORAGE_KEYS.DIRECT_SALES, JSON.stringify(updated));
  };

  // CUSTOMER PROFILE UPDATES
  const handleUpdateCustomer = (oldPhone: string, updatedCustomer: Customer) => {
    const updatedWOs = workOrders.map((wo) => {
      if ((wo.customer.phone || '').trim() === oldPhone.trim()) {
        return {
          ...wo,
          customer: {
            ...wo.customer,
            ...updatedCustomer
          }
        };
      }
      return wo;
    });
    setWorkOrders(updatedWOs);
    localStorage.setItem(STORAGE_KEYS.WORK_ORDERS, JSON.stringify(updatedWOs));
  };

  // EXPENSE CRUD
  const handleAddExpense = (newExpensePayload: Omit<Expense, 'id'>) => {
    const updated = [
      {
        id: 'exp_' + Date.now(),
        ...newExpensePayload
      },
      ...expenses
    ];
    setExpenses(updated);
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(updated));
  };

  const handleDeleteExpense = (id: string) => {
    const updated = expenses.filter(e => e.id !== id);
    setExpenses(updated);
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(updated));
  };

  // BALANCE ADJUSTMENTS CRUD
  const handleAddBalanceAdjustment = (adj: Omit<BalanceAdjustment, 'id' | 'createdAt'>) => {
    const updated = [
      {
        id: 'adj_' + Date.now(),
        createdAt: new Date().toISOString(),
        ...adj
      },
      ...balanceAdjustments
    ];
    setBalanceAdjustments(updated);
    localStorage.setItem(STORAGE_KEYS.BALANCE_ADJUSTMENTS, JSON.stringify(updated));
  };

  const handleDeleteBalanceAdjustment = (id: string) => {
    const updated = balanceAdjustments.filter((a) => a.id !== id);
    setBalanceAdjustments(updated);
    localStorage.setItem(STORAGE_KEYS.BALANCE_ADJUSTMENTS, JSON.stringify(updated));
  };

  // SALARY ADVANCES CRUD
  const handleAddSalaryAdvance = (adv: Omit<SalaryAdvance, 'id' | 'createdAt' | 'status'>) => {
    const updated = [
      {
        id: 'adv_' + Date.now(),
        createdAt: new Date().toISOString(),
        status: 'Pendente' as const,
        ...adv
      },
      ...salaryAdvances
    ];
    setSalaryAdvances(updated);
    localStorage.setItem(STORAGE_KEYS.SALARY_ADVANCES, JSON.stringify(updated));
  };

  const handleToggleSalaryAdvanceStatus = (id: string) => {
    const updated = salaryAdvances.map((adv) => {
      if (adv.id === id) {
        return {
          ...adv,
          status: adv.status === 'Pendente' ? ('Liquidado' as const) : ('Pendente' as const)
        };
      }
      return adv;
    });
    setSalaryAdvances(updated);
    localStorage.setItem(STORAGE_KEYS.SALARY_ADVANCES, JSON.stringify(updated));
  };

  const handleDeleteSalaryAdvance = (id: string) => {
    const updated = salaryAdvances.filter((adv) => adv.id !== id);
    setSalaryAdvances(updated);
    localStorage.setItem(STORAGE_KEYS.SALARY_ADVANCES, JSON.stringify(updated));
  };

  // EMPLOYEES CRUD
  const handleAddEmployee = (newEmp: Omit<Employee, 'id'>) => {
    const updated = [
      {
        id: 'emp_' + Date.now(),
        ...newEmp
      },
      ...employees
    ];
    setEmployees(updated);
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(updated));
  };

  const handleEditEmployee = (edited: Employee) => {
    const updated = employees.map(emp => emp.id === edited.id ? edited : emp);
    setEmployees(updated);
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(updated));
  };

  const handleDeleteEmployee = (id: string) => {
    const updated = employees.filter(emp => emp.id !== id);
    setEmployees(updated);
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(updated));
  };

  const handleUpdateBaseBalance = (newBalance: number) => {
    setBaseBalance(newBalance);
    localStorage.setItem('bikeone_base_balance_v1', newBalance.toString());
  };

  const handleResetAllData = () => {
    setBaseBalance(0);
    localStorage.setItem('bikeone_base_balance_v1', '0');

    setWorkOrders([]);
    localStorage.setItem(STORAGE_KEYS.WORK_ORDERS, JSON.stringify([]));

    setDirectSales([]);
    localStorage.setItem(STORAGE_KEYS.DIRECT_SALES, JSON.stringify([]));

    setExpenses([]);
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify([]));

    setBalanceAdjustments([]);
    localStorage.setItem(STORAGE_KEYS.BALANCE_ADJUSTMENTS, JSON.stringify([]));

    setSalaryAdvances([]);
    localStorage.setItem(STORAGE_KEYS.SALARY_ADVANCES, JSON.stringify([]));
  };

  const handleResetBalanceOnly = () => {
    setBaseBalance(0);
    localStorage.setItem('bikeone_base_balance_v1', '0');

    setBalanceAdjustments([]);
    localStorage.setItem(STORAGE_KEYS.BALANCE_ADJUSTMENTS, JSON.stringify([]));
  };

  // -------------------------------------------------------------
  // NAVIGATION ROUTER

  // Check if unauthenticated
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Sidebar
      user={user}
      activeView={activeView}
      onNavigate={(view) => {
        if (view === 'os') setWoInitialTab('list');
        setActiveView(view);
      }}
      onLogout={handleLogout}
    >
      {/* Active Screen Routers */}
      {activeView === 'dashboard' && (
        <Dashboard
          user={user}
          workOrders={workOrders}
          products={products}
          directSales={directSales}
          expenses={expenses}
          balanceAdjustments={balanceAdjustments}
          salaryAdvances={salaryAdvances}
          baseBalance={baseBalance}
          onNavigate={(view) => {
            if (view === 'os') setWoInitialTab('list');
            setActiveView(view);
          }}
          onAddBalanceAdjustment={handleAddBalanceAdjustment}
          onDeleteBalanceAdjustment={handleDeleteBalanceAdjustment}
          onAddSalaryAdvance={handleAddSalaryAdvance}
          onToggleSalaryAdvanceStatus={handleToggleSalaryAdvanceStatus}
          onDeleteSalaryAdvance={handleDeleteSalaryAdvance}
          onOpenCreateOS={() => {
            setWoInitialTab('create');
            setActiveView('os');
          }}
          onOpenQuickSale={() => setIsQuickSaleOpen(true)}
        />
      )}

      {activeView === 'os' && (
        <WorkOrders
          workOrders={workOrders}
          services={services}
          products={products}
          onAddWorkOrder={handleAddWorkOrder}
          onEditWorkOrder={handleEditWorkOrder}
          onDeleteWorkOrder={handleDeleteWorkOrder}
          initialTab={woInitialTab}
        />
      )}

      {activeView === 'stock' && (
        <StockAndServices
          products={products}
          services={services}
          workOrders={workOrders}
          onAddProduct={handleAddProduct}
          onEditProduct={handleEditProduct}
          onDeleteProduct={handleDeleteProduct}
          onAddStockEntry={handleAddStockEntry}
          onAddService={handleAddService}
          onEditService={handleEditService}
          onDeleteService={handleDeleteService}
        />
      )}

      {activeView === 'settings' && (
        <SettingsView
          baseBalance={baseBalance}
          onUpdateBaseBalance={handleUpdateBaseBalance}
          onResetAllData={handleResetAllData}
          onResetBalanceOnly={handleResetBalanceOnly}
          onPullFromSupabase={handlePullFromSupabase}
          onPushToSupabase={handlePushToSupabase}
        />
      )}

      {activeView === 'clientes' && (
        <Pessoas
          workOrders={workOrders}
          onUpdateCustomer={handleUpdateCustomer}
          employees={employees}
          onAddEmployee={handleAddEmployee}
          onEditEmployee={handleEditEmployee}
          onDeleteEmployee={handleDeleteEmployee}
        />
      )}

      {activeView === 'vendas' && (
        <Sales
          directSales={directSales}
          workOrders={workOrders}
          products={products}
          expenses={expenses}
          onAddExpense={handleAddExpense}
          onDeleteExpense={handleDeleteExpense}
          onEditDirectSale={handleEditDirectSale}
          onOpenQuickSale={() => setIsQuickSaleOpen(true)}
        />
      )}

      {/* POS Quick Sale Overlay Modal */}
      <QuickSaleModal
        products={products}
        isOpen={isQuickSaleOpen}
        onClose={() => setIsQuickSaleOpen(false)}
        onConfirmSale={handleConfirmDirectSale}
      />
    </Sidebar>
  );
}
