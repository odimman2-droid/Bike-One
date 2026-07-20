import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Package, Wrench } from 'lucide-react';
import Stock from './Stock';
import Services from './Services';
import { Product, Service, WorkOrder } from '../types';

interface StockAndServicesProps {
  products: Product[];
  services: Service[];
  workOrders: WorkOrder[];
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onAddStockEntry: (id: string, quantityToAdd: number, newPurchasePrice?: number) => void;
  onAddService: (service: Omit<Service, 'id'>) => void;
  onEditService: (service: Service) => void;
  onDeleteService: (id: string) => void;
}

export default function StockAndServices({
  products,
  services,
  workOrders,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onAddStockEntry,
  onAddService,
  onEditService,
  onDeleteService,
}: StockAndServicesProps) {
  const [activeLayer, setActiveLayer] = useState<'stock' | 'services'>('stock');

  return (
    <div className="space-y-6" id="stock-and-services-view">
      {/* Tab Layer Selector Buttons */}
      <div className="flex gap-2 p-1.5 bg-[#111216]/60 border border-slate-800/60 rounded-3xl w-fit print:hidden">
        <button
          onClick={() => setActiveLayer('stock')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer uppercase tracking-wider ${
            activeLayer === 'stock'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/15'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Package className="h-4 w-4" />
          Stock / Inventário
        </button>
        <button
          onClick={() => setActiveLayer('services')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer uppercase tracking-wider ${
            activeLayer === 'services'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/15'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Wrench className="h-4 w-4" />
          Serviços (Oficina)
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
        {activeLayer === 'stock' ? (
          <Stock
            products={products}
            onAddProduct={onAddProduct}
            onEditProduct={onEditProduct}
            onDeleteProduct={onDeleteProduct}
            onAddStockEntry={onAddStockEntry}
          />
        ) : (
          <Services
            services={services}
            workOrders={workOrders}
            onAddService={onAddService}
            onEditService={onEditService}
            onDeleteService={onDeleteService}
          />
        )}
      </motion.div>
    </div>
  );
}
