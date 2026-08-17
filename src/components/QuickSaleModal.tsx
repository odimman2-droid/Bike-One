import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Product, DirectSaleItem } from '../types';
import { ShoppingCart, Plus, Trash2, Coins, AlertCircle, Sparkles } from 'lucide-react';

interface QuickSaleModalProps {
  products: Product[];
  isOpen: boolean;
  onClose: () => void;
  onConfirmSale: (
    customerName: string, 
    items: DirectSaleItem[],
    paymentStatus: 'Pendente' | 'Pago 50%' | 'Pago Integral',
    amountPaid: number,
    paymentMethod: 'Dinheiro' | 'Transferência' | 'Dinheiro + Transferência'
  ) => void;
}

export default function QuickSaleModal({
  products,
  isOpen,
  onClose,
  onConfirmSale,
}: QuickSaleModalProps) {
  const [customerName, setCustomerName] = useState('Cliente Final');
  const [saleItems, setSaleItems] = useState<DirectSaleItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedDiscount, setSelectedDiscount] = useState<number>(0);
  const [paymentStatus, setPaymentStatus] = useState<'Pendente' | 'Pago 50%' | 'Pago Integral'>('Pago Integral');
  const [paymentMethod, setPaymentMethod] = useState<'Dinheiro' | 'Transferência' | 'Dinheiro + Transferência'>('Dinheiro');
  const [error, setError] = useState('');

  if (!isOpen) return null;

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

  // Add item to draft
  const handleAddItem = () => {
    if (!selectedProductId) return;
    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;

    if (selectedQuantity <= 0) {
      setError('A quantidade deve ser superior a 0.');
      return;
    }

    if (prod.quantity < selectedQuantity) {
      setError(`Stock insuficiente! Apenas ${prod.quantity} un de "${prod.name}" disponíveis.`);
      return;
    }

    if (selectedDiscount < 0 || selectedDiscount > prod.salePrice) {
      setError(`Desconto inválido! O desconto unitário não pode exceder o preço de venda (${formatKz(prod.salePrice)}).`);
      return;
    }

    setError('');

    // Check if product with same discount is already in draft
    const existingIdx = saleItems.findIndex(
      (item) => item.productId === prod.id && (item.discount || 0) === selectedDiscount
    );

    if (existingIdx > -1) {
      const updated = [...saleItems];
      const newQty = updated[existingIdx].quantity + selectedQuantity;
      if (prod.quantity < newQty) {
        setError(`Stock insuficiente! Adicionar mais esta quantidade excederia as ${prod.quantity} un em stock.`);
        return;
      }
      updated[existingIdx].quantity = newQty;
      setSaleItems(updated);
    } else {
      setSaleItems([
        ...saleItems,
        {
          productId: prod.id,
          name: prod.name,
          quantity: selectedQuantity,
          unitPrice: prod.salePrice,
          purchasePrice: prod.purchasePrice,
          discount: selectedDiscount > 0 ? selectedDiscount : undefined
        },
      ]);
    }

    setSelectedProductId('');
    setSelectedQuantity(1);
    setSelectedDiscount(0);
  };

  const handleRemoveItem = (index: number) => {
    setSaleItems(saleItems.filter((_, i) => i !== index));
  };

  // Submit Sale
  const handleSubmitSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (saleItems.length === 0) {
      setError('Adicione pelo menos um artigo ao carrinho.');
      return;
    }

    const total = saleItems.reduce(
      (sum, item) => sum + ((item.unitPrice - (item.discount || 0)) * item.quantity), 
      0
    );

    const finalAmountPaid = paymentStatus === 'Pendente' ? 0 
                          : paymentStatus === 'Pago 50%' ? Math.round(total * 0.5) 
                          : total;

    onConfirmSale(customerName || 'Cliente Final', saleItems, paymentStatus, finalAmountPaid, paymentMethod);
    setCustomerName('Cliente Final');
    setSaleItems([]);
    setPaymentStatus('Pago Integral');
    setPaymentMethod('Dinheiro');
    onClose();
  };

  const totalSaleValue = saleItems.reduce(
    (sum, item) => sum + ((item.unitPrice - (item.discount || 0)) * item.quantity), 
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#111216] border border-slate-800/80 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl text-slate-100"
      >
        <div className="px-6 py-4 border-b border-slate-800 bg-[#0a0b0d]/50 flex justify-between items-center">
          <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2">
            <ShoppingCart className="h-4.5 w-4.5 text-amber-500" />
            Terminal de Venda Direta
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-xs font-bold cursor-pointer"
          >
            Fechar
          </button>
        </div>

        <form onSubmit={handleSubmitSale} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2 text-rose-400 text-xs bg-rose-950/30 border border-rose-800/30 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Customer Name */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cliente (Identificação)</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Ex: João Kanda ou Cliente Final"
              className="w-full bg-[#0a0b0d]/50 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
            />
          </div>

          {/* Add Product selectors */}
          <div className="bg-[#0a0b0d]/40 p-4 border border-slate-800 rounded-2xl space-y-3">
            <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Adicionar Artigo</h4>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-xs px-3 py-2 rounded-xl text-slate-200 flex-1 focus:outline-none"
              >
                <option value="">-- Selecione o artigo --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id} disabled={p.quantity <= 0}>
                    {p.name} ({formatKz(p.salePrice)} - {p.quantity} un em stock)
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <div className="flex flex-col items-center">
                  <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Qtd</span>
                  <input
                    type="number"
                    value={selectedQuantity}
                    onChange={(e) => setSelectedQuantity(Number(e.target.value))}
                    className="bg-slate-900 border border-slate-800 text-xs px-2 py-2 rounded-xl text-slate-200 w-14 text-center focus:outline-none"
                    min={1}
                  />
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Desc (Kz)</span>
                  <input
                    type="number"
                    value={selectedDiscount || ''}
                    onChange={(e) => setSelectedDiscount(parseFloat(e.target.value) || 0)}
                    className="bg-slate-900 border border-slate-800 text-xs px-2 py-2 rounded-xl text-slate-200 w-20 text-center focus:outline-none font-mono"
                    min={0}
                    placeholder="0"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="p-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-md transition-all cursor-pointer h-[38px] flex items-center justify-center"
                  >
                    <Plus className="h-4 w-4 stroke-[3]" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Draft Item List */}
          <div className="space-y-2">
            <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Itens no Carrinho</h4>
            {saleItems.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">Nenhum produto adicionado ao carrinho.</p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {saleItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2.5 bg-[#0a0b0d]/50 border border-slate-850 rounded-xl text-xs font-medium">
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-slate-300 truncate">{item.name}</p>
                      <p className="text-[9px] text-slate-500">
                        Qtd: <strong className="text-slate-400 font-mono">{item.quantity}</strong> x {formatKz(item.unitPrice)}
                        {item.discount ? <span className="text-rose-500 ml-1 font-semibold">(-{formatKz(item.discount)} un)</span> : null}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono text-slate-200 font-bold">{formatKz((item.unitPrice - (item.discount || 0)) * item.quantity)}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-rose-950/20 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Condição de Pagamento */}
          <div className="space-y-1 bg-[#0a0b0d]/40 p-4 border border-slate-800 rounded-2xl">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Condição de Pagamento (50% / 50%)</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentStatus('Pendente')}
                className={`py-2 px-1 rounded-xl border text-[10px] font-bold transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                  paymentStatus === 'Pendente'
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <span>Pendente</span>
                <span className="text-[8px] opacity-70 font-mono">0% Pago</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentStatus('Pago 50%')}
                className={`py-2 px-1 rounded-xl border text-[10px] font-bold transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                  paymentStatus === 'Pago 50%'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <span>Sinal 50%</span>
                <span className="text-[8px] opacity-70 font-mono">{formatKz(Math.round(totalSaleValue * 0.5))}</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentStatus('Pago Integral')}
                className={`py-2 px-1 rounded-xl border text-[10px] font-bold transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                  paymentStatus === 'Pago Integral'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <span>Integral 100%</span>
                <span className="text-[8px] opacity-70 font-mono">{formatKz(totalSaleValue)}</span>
              </button>
            </div>
          </div>

          {/* Meio de Pagamento */}
          {paymentStatus !== 'Pendente' && (
            <div className="space-y-1 bg-[#0a0b0d]/40 p-4 border border-slate-800 rounded-2xl">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Meio de Pagamento</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Dinheiro')}
                  className={`py-2 px-1 rounded-xl border text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    paymentMethod === 'Dinheiro'
                      ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <span>Cash / Dinheiro</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Transferência')}
                  className={`py-2 px-1 rounded-xl border text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    paymentMethod === 'Transferência'
                      ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <span>Transferência</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Dinheiro + Transferência')}
                  className={`py-2 px-1 rounded-xl border text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    paymentMethod === 'Dinheiro + Transferência'
                      ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <span>Metade de Cada</span>
                </button>
              </div>
            </div>
          )}

          {/* Totals panel */}
          <div className="p-4 bg-gradient-to-r from-[#0a0b0d] to-[#111216] rounded-2xl border border-amber-500/20 flex justify-between items-center text-xs">
            <span className="font-bold text-slate-400">VALOR TOTAL DA VENDA:</span>
            <span className="text-xl font-black text-amber-400 font-mono">
              {formatKz(totalSaleValue)}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-800/60 hover:bg-slate-800 text-slate-300 font-bold rounded-full text-xs cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-full text-xs shadow-lg shadow-amber-500/20 transition-all active:translate-y-0.5 cursor-pointer uppercase tracking-wider text-[11px]"
            >
              Finalizar Venda (Kz)
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
