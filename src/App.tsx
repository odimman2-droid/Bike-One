import React, { useState, useEffect, useRef } from 'react';
import { User, Service, Product, WorkOrder, DirectSale, DirectSaleItem, WorkOrderStatus, Customer, Expense, BalanceAdjustment, SalaryAdvance, Employee } from './types';
import { 
  DEFAULT_SERVICES, 
  DEFAULT_PRODUCTS, 
  DEFAULT_WORK_ORDERS, 
  DEFAULT_DIRECT_SALES,
  DEFAULT_EXPENSES
} from './data';

// Central Backend API imports
import { 
  apiFetchProducts, 
  apiCreateProduct, 
  apiUpdateProduct, 
  apiDeleteProduct, 
  apiAddStockEntry, 
  apiGetFullSync, 
  apiPushFullSync, 
  checkServerHealth 
} from './lib/api';

// Google Cloud Database imports (odimman.2@gmail.com / +244 941 448 677)
import {
  getGoogleCloudConfig,
  saveGoogleCloudConfig,
  checkGoogleCloudConnection,
  saveToGoogleCloud,
  pullFromGoogleCloud,
  exportGoogleCloudBackupFile,
  GoogleCloudConfig
} from './lib/googleCloud';

// Apple iCloud & CloudKit imports (odilsonn@icloud.com)
import {
  getICloudConfig,
  saveICloudConfig,
  checkICloudConnection,
  saveToICloud,
  loadAllFromICloud,
  exportICloudBackupFile,
  ICloudConfig
} from './lib/icloud';

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
  // 1. Initialize State lazily from LocalStorage
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
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(DEFAULT_SERVICES));
    return DEFAULT_SERVICES;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (stored) return JSON.parse(stored);
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

  const [activeView, setActiveView] = useState<'dashboard' | 'os' | 'stock' | 'relatorios' | 'clientes' | 'vendas' | 'settings'>('dashboard');
  const [isInitialized, setIsInitialized] = useState(false);
  const [serverOnline, setServerOnline] = useState(true);
  const [lastServerSync, setLastServerSync] = useState<Date>(new Date());
  
  const [icloudConfig, setICloudConfig] = useState<ICloudConfig>(getICloudConfig);
  const [lastICloudSync, setLastICloudSync] = useState<Date>(new Date());

  const [googleConfig, setGoogleConfig] = useState<GoogleCloudConfig>(getGoogleCloudConfig);
  const [lastGoogleSync, setLastGoogleSync] = useState<Date>(new Date());

  // Helper to apply incoming full store dataset
  const applyIncomingData = (data: any) => {
    if (!data || typeof data !== 'object') return;
    if (Array.isArray(data.products) && data.products.length > 0) {
      setProducts(data.products);
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(data.products));
    }
    if (Array.isArray(data.services) && data.services.length > 0) {
      setServices(data.services);
      localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(data.services));
    }
    if (Array.isArray(data.workOrders)) {
      setWorkOrders(data.workOrders);
      localStorage.setItem(STORAGE_KEYS.WORK_ORDERS, JSON.stringify(data.workOrders));
    }
    if (Array.isArray(data.directSales)) {
      setDirectSales(data.directSales);
      localStorage.setItem(STORAGE_KEYS.DIRECT_SALES, JSON.stringify(data.directSales));
    }
    if (Array.isArray(data.expenses)) {
      setExpenses(data.expenses);
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(data.expenses));
    }
    if (Array.isArray(data.balanceAdjustments)) {
      setBalanceAdjustments(data.balanceAdjustments);
      localStorage.setItem(STORAGE_KEYS.BALANCE_ADJUSTMENTS, JSON.stringify(data.balanceAdjustments));
    }
    if (Array.isArray(data.salaryAdvances)) {
      setSalaryAdvances(data.salaryAdvances);
      localStorage.setItem(STORAGE_KEYS.SALARY_ADVANCES, JSON.stringify(data.salaryAdvances));
    }
    if (Array.isArray(data.employees) && data.employees.length > 0) {
      setEmployees(data.employees);
      localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(data.employees));
    }
    if (typeof data.baseBalance === 'number') {
      setBaseBalance(data.baseBalance);
      localStorage.setItem('bikeone_base_balance_v1', data.baseBalance.toString());
    }
  };

  // Helper to pull entire central database from backend server (/api/sync)
  const handlePullFromServer = async (): Promise<boolean> => {
    try {
      const serverData = await apiGetFullSync();
      if (serverData) {
        applyIncomingData(serverData);
        setServerOnline(true);
        setLastServerSync(new Date());
        return true;
      }
      return false;
    } catch (err) {
      setServerOnline(false);
      return false;
    }
  };

  const handlePushToServer = async (): Promise<boolean> => {
    try {
      await apiPushFullSync({
        products,
        services,
        workOrders,
        directSales,
        expenses,
        balanceAdjustments,
        salaryAdvances,
        employees,
        baseBalance
      });
      setServerOnline(true);
      setLastServerSync(new Date());
      return true;
    } catch (err) {
      setServerOnline(false);
      return false;
    }
  };

  // Google Cloud pull & push
  const handlePullFromGoogle = async (): Promise<boolean> => {
    try {
      const res = await pullFromGoogleCloud();
      if (res.success && res.data) {
        applyIncomingData(res.data);
        setLastGoogleSync(new Date());
        setGoogleConfig(getGoogleCloudConfig());
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handlePushToGoogle = async (): Promise<boolean> => {
    try {
      const ok = await saveToGoogleCloud({
        products,
        services,
        workOrders,
        directSales,
        expenses,
        balanceAdjustments,
        salaryAdvances,
        employees,
        baseBalance
      });
      if (ok) {
        setLastGoogleSync(new Date());
        setGoogleConfig(getGoogleCloudConfig());
      }
      return ok;
    } catch {
      return false;
    }
  };

  // Apple iCloud pull & push
  const handlePullFromICloud = async (): Promise<boolean> => {
    try {
      const data = await loadAllFromICloud();
      if (data) {
        applyIncomingData(data);
        setLastICloudSync(new Date());
        setICloudConfig(getICloudConfig());
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handlePushToICloud = async (): Promise<boolean> => {
    try {
      const ok = await saveToICloud({
        products,
        services,
        workOrders,
        directSales,
        expenses,
        balanceAdjustments,
        salaryAdvances,
        employees,
        baseBalance
      });
      if (ok) {
        setLastICloudSync(new Date());
        setICloudConfig(getICloudConfig());
      }
      return ok;
    } catch {
      return false;
    }
  };

  // 1. Initial Load: pull latest permanent state from Central Backend Server & Cloud on startup
  useEffect(() => {
    const initAppSync = async () => {
      const serverSuccess = await handlePullFromServer();
      if (!serverSuccess) {
        // Try Google Cloud or iCloud fallback
        const googleRes = await pullFromGoogleCloud();
        if (googleRes.success && googleRes.data) {
          applyIncomingData(googleRes.data);
        } else {
          const icloudData = await loadAllFromICloud();
          if (icloudData) {
            applyIncomingData(icloudData);
          }
        }
      }
      setIsInitialized(true);
    };

    initAppSync();
  }, []);

  // 2. Real-time Multi-Device Polling (every 5 seconds & on window focus)
  useEffect(() => {
    const interval = setInterval(() => {
      handlePullFromServer();
    }, 5000);

    const onFocus = () => {
      handlePullFromServer();
    };

    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  // 3. Central & Cloud Auto-Save (Syncs to Central Server, Google Cloud, and iCloud whenever any data changes)
  useEffect(() => {
    if (!isInitialized) return;
    const timer = setTimeout(() => {
      const fullPayload = {
        products,
        services,
        workOrders,
        directSales,
        expenses,
        balanceAdjustments,
        salaryAdvances,
        employees,
        baseBalance
      };

      // 1. Central Server DB
      apiPushFullSync(fullPayload).catch(() => {});

      // 2. Google Cloud (odimman.2@gmail.com / +244 941 448 677)
      saveToGoogleCloud(fullPayload).then(() => {
        setLastGoogleSync(new Date());
        setGoogleConfig(getGoogleCloudConfig());
      }).catch(() => {});

      // 3. Apple iCloud (odilsonn@icloud.com)
      saveToICloud(fullPayload).then(() => {
        setLastICloudSync(new Date());
        setICloudConfig(getICloudConfig());
      }).catch(() => {});

    }, 800);

    return () => clearTimeout(timer);
  }, [
    products,
    services,
    workOrders,
    directSales,
    expenses,
    balanceAdjustments,
    salaryAdvances,
    employees,
    baseBalance,
    isInitialized
  ]);

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

  // PRODUCTS CRUD (Persisted directly to Central Server /api/products)
  const handleAddProduct = async (newProductPayload: Omit<Product, 'id'>) => {
    const tempId = 'p_' + Date.now();
    const newProduct: Product = {
      id: tempId,
      ...newProductPayload
    };
    const updated = [...products, newProduct];
    setProducts(updated);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));

    try {
      const serverProduct = await apiCreateProduct(newProduct);
      if (serverProduct && serverProduct.id) {
        setProducts(prev => prev.map(p => p.id === tempId ? serverProduct : p));
      }
      setServerOnline(true);
    } catch (err) {
      console.warn('Could not save product immediately to /api/products:', err);
    }
  };

  const handleEditProduct = async (edited: Product) => {
    const updated = products.map((p) => (p.id === edited.id ? edited : p));
    setProducts(updated);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));

    try {
      await apiUpdateProduct(edited);
      setServerOnline(true);
    } catch (err) {
      console.warn('Could not update product on /api/products:', err);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const updated = products.filter((p) => p.id !== id);
    setProducts(updated);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));

    try {
      await apiDeleteProduct(id);
      setServerOnline(true);
    } catch (err) {
      console.warn('Could not delete product on /api/products:', err);
    }
  };

  // STOCK ENTRY (Top Up Quantities via /api/products/:id/stock)
  const handleAddStockEntry = async (id: string, quantityToAdd: number, newPurchasePrice?: number) => {
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

    try {
      await apiAddStockEntry(id, quantityToAdd, newPurchasePrice);
      setServerOnline(true);
    } catch (err) {
      console.warn('Could not add stock entry on /api/products/:id/stock:', err);
    }
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
      googleAccount={googleConfig.accountEmail || 'odimman.2@gmail.com'}
      googleStatus={googleConfig.status}
      icloudAccount={icloudConfig.accountEmail || 'odilsonn@icloud.com'}
      icloudStatus={icloudConfig.status}
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
          serverOnline={serverOnline}
          lastServerSync={lastServerSync}
          onPullFromServer={handlePullFromServer}
          onPushToServer={handlePushToServer}
          googleConfig={googleConfig}
          lastGoogleSync={lastGoogleSync}
          onPullFromGoogle={handlePullFromGoogle}
          onPushToGoogle={handlePushToGoogle}
          icloudConfig={icloudConfig}
          lastICloudSync={lastICloudSync}
          onPullFromICloud={handlePullFromICloud}
          onPushToICloud={handlePushToICloud}
          allAppData={{
            products,
            services,
            workOrders,
            directSales,
            expenses,
            balanceAdjustments,
            salaryAdvances,
            employees,
            baseBalance
          }}
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
