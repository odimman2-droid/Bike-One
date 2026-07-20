import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Product } from '../types';
import { 
  Package, 
  Plus, 
  Search, 
  ArrowUpRight, 
  ArrowDownRight, 
  Edit, 
  Trash2, 
  AlertTriangle,
  TrendingUp,
  FolderMinus,
  Coins
} from 'lucide-react';

interface StockProps {
  products: Product[];
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onAddStockEntry: (id: string, quantityToAdd: number, newPurchasePrice?: number) => void;
}

const CATEGORIES = ['Todos', 'Peças', 'Acessórios', 'Pneus/Câmaras', 'Equipamento', 'Outros'];

export default function Stock({
  products,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onAddStockEntry,
}: StockProps) {
  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [currentPage, setCurrentPage] = useState(1);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory]);

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  
  // Product Form State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    category: 'Peças',
    quantity: 0,
    purchasePrice: 0,
    salePrice: 0,
    minStock: 5,
  });

  // Entry Form State
  const [selectedProductIdForEntry, setSelectedProductIdForEntry] = useState('');
  const [entryQuantity, setEntryQuantity] = useState(1);
  const [entryCost, setEntryCost] = useState(0);

  // Open Product Modal
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      category: 'Peças',
      quantity: 0,
      purchasePrice: 0,
      salePrice: 0,
      minStock: 5,
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name,
      category: p.category,
      quantity: p.quantity,
      purchasePrice: p.purchasePrice,
      salePrice: p.salePrice,
      minStock: p.minStock || 5,
    });
    setIsProductModalOpen(true);
  };

  // Open Entry Modal
  const handleOpenEntry = (product?: Product) => {
    const pId = product ? product.id : (products[0]?.id || '');
    const pCost = product ? product.purchasePrice : (products[0]?.purchasePrice || 0);
    
    setSelectedProductIdForEntry(pId);
    setEntryQuantity(10);
    setEntryCost(pCost);
    setIsEntryModalOpen(true);
  };

  // Submit Product Form
  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name.trim()) return;

    if (editingProduct) {
      onEditProduct({
        id: editingProduct.id,
        ...productForm,
      });
    } else {
      onAddProduct(productForm);
    }
    setIsProductModalOpen(false);
  };

  // Submit Entry Form
  const handleEntrySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductIdForEntry) return;

    onAddStockEntry(selectedProductIdForEntry, entryQuantity, entryCost);
    setIsEntryModalOpen(false);
  };

  // Delete product
  const handleDeleteProduct = (id: string) => {
    if (confirm('Tem certeza de que deseja excluir este produto?')) {
      onDeleteProduct(id);
    }
  };

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const ITEMS_PER_PAGE = 4;
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Stock general statistics
  const totalStockItems = products.reduce((sum, p) => sum + p.quantity, 0);
  const totalInventoryCostValue = products.reduce((sum, p) => sum + (p.quantity * p.purchasePrice), 0);
  const totalPotentialSalesValue = products.reduce((sum, p) => sum + (p.quantity * p.salePrice), 0);
  const totalPotentialProfit = totalPotentialSalesValue - totalInventoryCostValue;

  const lowStockCount = products.filter((p) => p.quantity <= (p.minStock || 5)).length;

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

  return (
    <div className="space-y-6" id="stock-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-sans font-black text-slate-100 flex items-center gap-2.5">
            <Package className="h-5 w-5 text-amber-500" />
            Controlo de Stock & Inventário
          </h1>
          <p className="text-xs text-slate-400">Gerencie acessórios, pneus, selantes e peças de substituição</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => handleOpenEntry()}
            disabled={products.length === 0}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#111216] hover:bg-slate-800 text-slate-100 text-xs font-bold rounded-full border border-slate-800/80 transition-all active:translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:pointer-events-none uppercase tracking-wider text-[11px]"
          >
            <ArrowUpRight className="h-4 w-4 text-amber-400" />
            Entrada de Stock
          </button>
          <button
            onClick={handleOpenAddProduct}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold rounded-full shadow-lg shadow-amber-500/10 transition-all active:translate-y-0.5 cursor-pointer uppercase tracking-wider text-[11px]"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            Novo Produto
          </button>
        </div>
      </div>

      {/* Stock Quick Info Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-[#111216] to-[#111216]/60 border border-slate-800/60 p-5 rounded-3xl space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Artigos em Stock</span>
          <span className="text-lg font-black text-slate-100 block">{totalStockItems} unidades</span>
          <span className="text-[9px] text-slate-500 block">{products.length} referências registadas</span>
        </div>
        <div className="bg-gradient-to-br from-[#111216] to-[#111216]/60 border border-slate-800/60 p-5 rounded-3xl space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Valor a Preço de Custo</span>
          <span className="text-lg font-black text-slate-100 block">{formatKz(totalInventoryCostValue)}</span>
          <span className="text-[9px] text-slate-500 block">Total empatado em inventário</span>
        </div>
        <div className="bg-gradient-to-br from-[#111216] to-[#111216]/60 border border-slate-800/60 p-5 rounded-3xl space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Valor de Venda Potencial</span>
          <span className="text-lg font-black text-amber-500 block">{formatKz(totalPotentialSalesValue)}</span>
          <span className="text-[9px] text-slate-500 block">Total faturável estimado</span>
        </div>
        <div className="bg-gradient-to-br from-[#111216] to-[#111216]/60 border border-slate-800/60 p-5 rounded-3xl space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Lucro Estimado</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-black text-amber-400 block">{formatKz(totalPotentialProfit)}</span>
            {totalInventoryCostValue > 0 && (
              <span className="text-[10px] font-bold text-amber-500">
                (+{((totalPotentialProfit / totalInventoryCostValue) * 100).toFixed(0)}%)
              </span>
            )}
          </div>
          <span className="text-[9px] text-slate-500 block">Margem média sobre compras</span>
        </div>
      </div>

      {/* Product list section */}
      <div className="bg-[#111216]/60 border border-slate-800/60 rounded-3xl p-6 shadow-md space-y-4">
        
        {/* Search & Category Filter */}
        <div className="flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Pesquisar produto pelo nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#0a0b0d]/50 border border-slate-800 rounded-2xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
            />
          </div>

          <div className="flex flex-wrap gap-1.5 overflow-x-auto max-w-full pb-1 md:pb-0">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-extrabold transition-all cursor-pointer shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/10'
                    : 'bg-slate-900/50 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Inventory list */}
        {filteredProducts.length === 0 ? (
          <div className="py-16 text-center text-slate-500 space-y-2">
            <Package className="h-10 w-10 mx-auto opacity-30 text-slate-400" />
            <p className="text-sm">Nenhum produto cadastrado nesta categoria ou com este nome.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0a0b0d]/50 text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-800 font-bold">
                  <th className="py-3 px-4">Artigo / Nome</th>
                  <th className="py-3 px-4 hidden md:table-cell">Categoria</th>
                  <th className="py-3 px-4 text-center">Stock</th>
                  <th className="py-3 px-4 text-right hidden lg:table-cell">Custo (Compra)</th>
                  <th className="py-3 px-4 text-right">Preço Venda</th>
                  <th className="py-3 px-4 text-right text-amber-500">Lucro Unit.</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-xs">
                {paginatedProducts.map((p) => {
                  const unitProfit = p.salePrice - p.purchasePrice;
                  const profitMargin = p.purchasePrice > 0 ? (unitProfit / p.purchasePrice) * 100 : 0;
                  const isLowStock = p.quantity <= (p.minStock || 5);

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-200 flex items-center gap-2">
                          {p.name}
                          {isLowStock && (
                            <span className="p-0.5 bg-rose-500/10 text-rose-400 rounded hover:scale-105 transition-transform" title="Stock Crítico!">
                              <AlertTriangle className="h-3 w-3" />
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 md:hidden">{p.category}</span>
                      </td>
                      <td className="py-3.5 px-4 hidden md:table-cell text-slate-400 font-medium">
                        {p.category}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-md font-mono font-bold text-[11px] ${
                          p.quantity === 0
                            ? 'bg-rose-950/50 text-rose-400 border border-rose-800/30'
                            : isLowStock
                            ? 'bg-amber-950/50 text-amber-400 border border-amber-800/30'
                            : 'bg-slate-950 text-slate-300'
                        }`}>
                          {p.quantity} un
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-400 hidden lg:table-cell font-medium">
                        {formatKz(p.purchasePrice)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-extrabold text-slate-200">
                        {formatKz(p.salePrice)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono">
                        <div className="flex flex-col items-end">
                          <span className="font-bold text-amber-400 flex items-center gap-0.5">
                            <Coins className="h-3 w-3 opacity-70 text-amber-500" />
                            {formatKz(unitProfit)}
                          </span>
                          <span className="text-[9px] text-amber-500/70 font-bold font-sans mt-0.5">
                            (+{profitMargin.toFixed(0)}%)
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex gap-1.5 justify-end">
                          <button
                            onClick={() => handleOpenEntry(p)}
                            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-lg transition-colors cursor-pointer border border-slate-800"
                            title="Entrada rápida"
                          >
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditProduct(p)}
                            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-amber-500 rounded-lg transition-colors cursor-pointer border border-slate-800"
                            title="Editar Artigo"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-1.5 bg-slate-900 hover:bg-rose-950/40 hover:text-rose-400 text-slate-500 rounded-lg transition-colors cursor-pointer border border-slate-800"
                            title="Excluir Artigo"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center pt-5 border-t border-slate-850/60 mt-4">
            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">
              Página {currentPage} de {totalPages} ({filteredProducts.length} artigos)
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

      {/* CREATE/EDIT PRODUCT MODAL */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#111216] border border-slate-800/80 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl text-slate-100"
          >
            <div className="px-6 py-4 border-b border-slate-800 bg-[#0a0b0d]/50 flex justify-between items-center">
              <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2">
                <Package className="h-4.5 w-4.5 text-amber-500" />
                {editingProduct ? 'Editar Produto' : 'Cadastrar Novo Artigo'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-xs font-bold cursor-pointer"
              >
                Fechar
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="p-6 space-y-4">
              {/* Product Name */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nome do Artigo *</label>
                <input
                  type="text"
                  placeholder="Ex: Corrente Shimano HG-601 11v..."
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full bg-[#0a0b0d]/50 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                  required
                />
              </div>

              {/* Category & Min Stock */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Categoria</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full bg-[#0a0b0d]/50 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
                  >
                    {CATEGORIES.filter((c) => c !== 'Todos').map((c) => (
                      <option key={c} value={c} className="bg-slate-900">{c}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alerta Stock Baixo</label>
                  <input
                    type="number"
                    value={productForm.minStock}
                    onChange={(e) => setProductForm({ ...productForm, minStock: Number(e.target.value) })}
                    className="w-full bg-[#0a0b0d]/50 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
                    min={0}
                  />
                </div>
              </div>

              {/* Quantities (Disabled if editing, handle via entries) */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5 col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Qtd. Inicial</label>
                  <input
                    type="number"
                    value={productForm.quantity}
                    onChange={(e) => setProductForm({ ...productForm, quantity: Number(e.target.value) })}
                    disabled={!!editingProduct}
                    className="w-full bg-[#0a0b0d]/50 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 disabled:opacity-40"
                    min={0}
                  />
                </div>
                <div className="space-y-1.5 col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Custo Unit. (Kz)</label>
                  <input
                    type="number"
                    value={productForm.purchasePrice || ''}
                    onChange={(e) => setProductForm({ ...productForm, purchasePrice: Number(e.target.value) })}
                    className="w-full bg-[#0a0b0d]/50 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
                    min={0}
                  />
                </div>
                <div className="space-y-1.5 col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Venda Unit. (Kz)</label>
                  <input
                    type="number"
                    value={productForm.salePrice || ''}
                    onChange={(e) => setProductForm({ ...productForm, salePrice: Number(e.target.value) })}
                    className="w-full bg-[#0a0b0d]/50 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
                    min={0}
                  />
                </div>
              </div>

              {/* Simulated Profit Calculations */}
              {productForm.salePrice > 0 && (
                <div className="p-3.5 bg-[#0a0b0d]/55 border border-slate-850 rounded-xl space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold uppercase text-[9px] tracking-wider">Margem de Lucro Estimada:</span>
                    <span className="font-extrabold text-amber-400">
                      {formatKz(productForm.salePrice - productForm.purchasePrice)}
                      {' '}
                      ({productForm.purchasePrice > 0 ? (((productForm.salePrice - productForm.purchasePrice) / productForm.purchasePrice) * 100).toFixed(0) : 0}%)
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="flex-1 py-2.5 text-xs font-bold bg-slate-800/60 hover:bg-slate-800 text-slate-300 rounded-full cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-full shadow-lg shadow-amber-500/20 cursor-pointer uppercase tracking-wider"
                >
                  {editingProduct ? 'Salvar Alterações' : 'Cadastrar Artigo'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* QUICK STOCK ENTRY MODAL */}
      {isEntryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#111216] border border-slate-800/80 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl text-slate-100"
          >
            <div className="px-6 py-4 border-b border-slate-800 bg-[#0a0b0d]/50 flex justify-between items-center">
              <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2">
                <ArrowUpRight className="h-4.5 w-4.5 text-amber-500" />
                Registrar Entrada de Stock
              </h3>
              <button
                onClick={() => setIsEntryModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-xs font-bold cursor-pointer"
              >
                Fechar
              </button>
            </div>

            <form onSubmit={handleEntrySubmit} className="p-6 space-y-4">
              {/* Product Selection */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Selecione o Artigo</label>
                <select
                  value={selectedProductIdForEntry}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedProductIdForEntry(id);
                    const prod = products.find((prod) => prod.id === id);
                    if (prod) setEntryCost(prod.purchasePrice);
                  }}
                  className="w-full bg-[#0a0b0d]/50 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none"
                >
                  {products.map((prod) => (
                    <option key={prod.id} value={prod.id} className="bg-slate-900">
                      {prod.name} (Qtd: {prod.quantity})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantities & cost */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quantidade a Adicionar</label>
                  <input
                    type="number"
                    value={entryQuantity}
                    onChange={(e) => setEntryQuantity(Number(e.target.value))}
                    className="w-full bg-[#0a0b0d]/50 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
                    min={1}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Custo Unit. de Compra (Kz)</label>
                  <input
                    type="number"
                    value={entryCost || ''}
                    onChange={(e) => setEntryCost(Number(e.target.value))}
                    className="w-full bg-[#0a0b0d]/50 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
                    min={0}
                    required
                  />
                </div>
              </div>

              {/* Simulated total cost of transaction */}
              <div className="p-3.5 bg-[#0a0b0d]/55 border border-slate-850 rounded-xl space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold uppercase text-[9px] tracking-wider">Custo Total da Compra:</span>
                  <span className="font-extrabold text-amber-500">
                    {formatKz(entryQuantity * entryCost)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEntryModalOpen(false)}
                  className="flex-1 py-2.5 text-xs font-bold bg-slate-800/60 hover:bg-slate-800 text-slate-300 rounded-full cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-full shadow-lg shadow-amber-500/20 cursor-pointer uppercase tracking-wider"
                >
                  Salvar Entrada
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
