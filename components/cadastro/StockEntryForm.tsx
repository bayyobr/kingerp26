import React, { useState, useEffect } from 'react';
import { Product, PurchaseOrder, PurchaseOrderProduct, PurchaseOrderPackage } from '../../types';
import { productService } from '../../services/productService';
import { stockService } from '../../services/stockService';
import { useNavigate, useParams } from 'react-router-dom';
import { useExchangeRate } from '../../hooks/useExchangeRate';

// Sub-component for individual package card
const PackageCard: React.FC<{
  pkg: any;
  index: number;
  onChange: (id: string, field: string, value: any) => void;
}> = ({ pkg, index, onChange }) => {
  const isReceived = pkg.status === 'Recebido';

  return (
    <div className={`p-4 rounded-lg flex flex-col gap-3 transition-all duration-300 border ${
      isReceived 
        ? 'bg-emerald-500/5 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]' 
        : 'bg-[#0e1217] border-[#1e242b]'
    }`}>
      <div className="flex items-center justify-between">
        <div className="font-bold text-slate-300 flex items-center gap-2">
          <div className={`size-6 rounded flex items-center justify-center text-xs ${
            isReceived ? 'bg-emerald-500 text-white' : 'bg-blue-500/20 text-blue-400'
          }`}>
            {index + 1}
          </div>
          Pacote {isReceived && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded ml-1">CHEGOU</span>}
        </div>
        <select
          value={pkg.status || 'Pendente'}
          onChange={e => onChange(pkg.id, 'status', e.target.value)}
          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border focus:outline-none transition-colors ${
            isReceived 
              ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' 
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}
        >
          <option value="Pendente">Faltando</option>
          <option value="Recebido">Chegou</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">ID AliExpress</label>
          <input
            type="text"
            value={pkg.aliexpressId || ''}
            onChange={e => onChange(pkg.id, 'aliexpressId', e.target.value)}
            className="w-full bg-[#1e242b] border border-[#2b333c] text-white px-2 py-1.5 rounded-md focus:outline-none focus:border-blue-500 text-xs"
            placeholder="Ex: 812344..."
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Cód. Rastreio</label>
          <input
            type="text"
            value={pkg.trackingNumber || ''}
            onChange={e => onChange(pkg.id, 'trackingNumber', e.target.value)}
            className="w-full bg-[#1e242b] border border-[#2b333c] text-white px-2 py-1.5 rounded-md focus:outline-none focus:border-blue-500 text-xs"
            placeholder="Ex: LB123456789HK"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">O que chegou nesse pacote?</label>
        <textarea
          value={pkg.arrivedProducts || ''}
          onChange={e => onChange(pkg.id, 'arrivedProducts', e.target.value)}
          rows={2}
          className="w-full bg-[#1e242b] border border-[#2b333c] text-white px-2 py-1.5 rounded-md focus:outline-none focus:border-blue-500 text-xs resize-none"
          placeholder="Liste os produtos aqui..."
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Valor do Pacote (BRL)</label>
          <div className="relative">
            <span className="absolute left-2 top-1.5 text-slate-500 text-[10px]">R$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={pkg.valueBrl ?? ''}
              onChange={e => onChange(pkg.id, 'valueBrl', e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full bg-[#1e242b] border border-[#2b333c] pl-7 text-white px-2 py-1.5 rounded-md focus:outline-none focus:border-blue-500 text-xs"
              placeholder="0.00"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Taxa do Pacote (BRL)</label>
          <div className="relative">
            <span className="absolute left-2 top-1.5 text-slate-500 text-[10px]">R$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={pkg.taxBrl ?? ''}
              onChange={e => onChange(pkg.id, 'taxBrl', e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full bg-[#1e242b] border border-[#2b333c] pl-7 text-white px-2 py-1.5 rounded-md focus:outline-none focus:border-blue-500 text-xs"
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      {/* Summary of this package */}
      {(Number(pkg.valueBrl) > 0 || Number(pkg.taxBrl) > 0) && (
        <div className="mt-1 p-2 rounded bg-blue-500/5 border border-blue-500/10 flex justify-between items-center">
          <span className="text-[10px] text-slate-500 font-medium">TOTAL (VALOR + TAXA):</span>
          <span className="text-xs font-bold text-blue-400">
            R$ {(Number(pkg.valueBrl || 0) + Number(pkg.taxBrl || 0)).toFixed(2)}
          </span>
        </div>
      )}
    </div>
  );
};

const StockEntryForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { rate, loading: rateLoading, refresh: refreshRate } = useExchangeRate();

  // Header State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [supplier, setSupplier] = useState('');
  const [usdQuote, setUsdQuote] = useState<number | ''>('');

  // Products State
  const [productsList, setProductsList] = useState<any[]>([
    { id: `p_${Date.now()}`, productName: '', quantity: 1, unitPriceUsd: '', totalProductUsd: 0, finalUnitCostBrl: 0 }
  ]);

  // Shipping & Packages
  const [iofBrl, setIofBrl] = useState<number | ''>('');
  const [packageCount, setPackageCount] = useState<number | ''>('');
  const [packages, setPackages] = useState<any[]>([]);

  // Fees
  const [factoryFeeBrl, setFactoryFeeBrl] = useState<number | ''>('');

  useEffect(() => {
    if (rate && !usdQuote && !isEditing) {
      setUsdQuote(rate);
    }
  }, [rate, usdQuote, isEditing]);

  useEffect(() => {
    const count = Number(packageCount) || 0;
    setPackages(prev => {
      if (prev.length === count) return prev;
      if (prev.length > count) return prev.slice(0, count);
      const toAdd = count - prev.length;
      const newPacks = Array(toAdd).fill(0).map((_, i) => ({
        id: `pkg_${Date.now()}_${Math.random()}_${i}`,
        aliexpressId: '',
        trackingNumber: '',
        taxBrl: '',
        valueBrl: '',
        arrivedProducts: '',
        status: 'Pendente'
      }));
      return [...prev, ...newPacks];
    });
  }, [packageCount]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadDbProducts();
      if (isEditing) {
        await loadOrder();
      }
      setLoading(false);
    };
    init();
  }, [id]);

  const loadOrder = async () => {
    try {
      const order = await stockService.getPurchaseOrderById(id!);
      if (order) {
        setDate(order.date);
        setSupplier(order.supplier);
        setUsdQuote(order.usdQuote);
        setIofBrl(order.iofBrl);
        setPackageCount(order.packageCount);
        setPackages(order.packages);
        setFactoryFeeBrl(order.factoryFeeBrl);

        // Group variations back for the UI
        // We need to group items by productId
        const groupedMap: { [productId: string]: any } = {};
        const simpleProducts: any[] = [];

        order.products.forEach(p => {
          if (p.productId && p.variationId) {
            if (!groupedMap[p.productId]) {
              groupedMap[p.productId] = {
                id: `p_edit_${p.productId}`,
                productId: p.productId,
                productName: p.productName,
                unitPriceUsd: p.unitPriceUsd,
                quantity: 0,
                totalProductUsd: 0,
                variationsQuantities: {}
              };
            }
            groupedMap[p.productId].variationsQuantities[p.variationId] = p.quantity;
            groupedMap[p.productId].quantity += p.quantity;
            groupedMap[p.productId].totalProductUsd += p.totalProductUsd;
          } else {
            simpleProducts.push({
              ...p,
              id: p.id || `p_${Date.now()}_${Math.random()}`
            });
          }
        });

        setProductsList([...Object.values(groupedMap), ...simpleProducts]);
      }
    } catch (error) {
      console.error('Failed to load order', error);
      alert('Erro ao carregar os dados para edição.');
    }
  };

  const loadDbProducts = async () => {
    try {
      const data = await productService.getAll();
      setDbProducts(data);
    } catch (error) {
      console.error('Failed to load products', error);
    }
  };

  // Calculations
  const totalProductsUsd = productsList.reduce((sum, p) => sum + ((Number(p.quantity) || 0) * (Number(p.unitPriceUsd) || 0)), 0);
  const totalPackagesTaxBrl = packages.reduce((sum, p) => sum + (Number(p.taxBrl) || 0), 0);
  const totalExtrasBrl = totalPackagesTaxBrl + (Number(factoryFeeBrl) || 0) + (Number(iofBrl) || 0);
  const totalOrderUsd = totalProductsUsd;

  const getProductFinalUnitBrl = (p: PurchaseOrderProduct) => {
    const productTotalUsd = (Number(p.quantity) || 0) * (Number(p.unitPriceUsd) || 0);
    const quantity = Number(p.quantity) || 0;
    const proportion = totalProductsUsd > 0 ? (productTotalUsd / totalProductsUsd) : 0;
    
    // Base convertida p/ BRL (Preço do produto em USD)
    const baseBrl = (Number(p.unitPriceUsd) || 0) * (Number(usdQuote) || 0);
    
    // Extras em BRL (Taxas de pacote + Factory Fee + IOF)
    const productExtraBrl = totalExtrasBrl * proportion;
    const unitExtraBrl = quantity > 0 ? productExtraBrl / quantity : 0;

    return baseBrl + unitExtraBrl;
  };

  const handleAddProductRow = () => {
    setProductsList(prev => [
      ...prev,
      { id: `p_${Date.now()}`, productName: '', quantity: 1, unitPriceUsd: '', totalProductUsd: 0, finalUnitCostBrl: 0 }
    ]);
  };

  const handleProductChange = (id: string, field: string, value: any) => {
    setProductsList(prev => prev.map(p => {
      if (p.id !== id) return p;
      const updated = { ...p, [field]: value };
      
      // Auto-set productName and variations if productId is selected
      if (field === 'productId') {
        const dbProduct = dbProducts.find(x => x.id === value);
        if (dbProduct) {
          updated.productName = dbProduct.name;
          updated.variationId = ''; 
          updated.variationName = '';
          // Initialize variations quantities
          if (dbProduct.variations && dbProduct.variations.length > 0) {
            updated.variationsQuantities = dbProduct.variations.reduce((acc: any, v: any) => ({ ...acc, [v.id]: 0 }), {});
          } else {
            updated.variationsQuantities = undefined;
          }
        } else {
          updated.productName = ''; // Cleared selection
          updated.variationId = '';
          updated.variationName = '';
          updated.variationsQuantities = undefined;
        }
      }

      // Handle variation quantity change
      if (field.startsWith('var_')) {
        const varId = field.split('var_')[1];
        updated.variationsQuantities = {
          ...updated.variationsQuantities,
          [varId]: Number(value) || 0
        };
      }

      // Recalculate quantity for grouped variations
      if (updated.variationsQuantities) {
        updated.quantity = Object.values(updated.variationsQuantities).reduce((sum: number, q: any) => sum + (Number(q) || 0), 0);
      }

      updated.totalProductUsd = (Number(updated.quantity) || 0) * (Number(updated.unitPriceUsd) || 0);
      return updated;
    }));
  };

  const handlePackageChange = (id: string, field: string, value: any) => {
    setPackages(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const removeProductRow = (id: string) => {
    setProductsList(prev => prev.filter(p => p.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier || !usdQuote) {
      alert("Preencha Fornecedor e Cotação do Dólar.");
      return;
    }
    
    // Check if there are any products with at least some quantity
    const hasProducts = productsList.some(p => (Number(p.quantity) || 0) > 0);
    if (!hasProducts) {
       alert("Sua lista de produtos está vazia ou sem quantidades preenchidas.");
       return;
    }

    if (productsList.some(p => !p.productName || (Number(p.quantity) > 0 && Number(p.unitPriceUsd) <= 0))) {
      alert("Revise a lista de produtos. Todos os produtos com quantidade devem ter nome e valor unitário > 0.");
      return;
    }

    try {
      setSaving(true);
      
      // EXPLODE variations into individual PurchaseOrderProduct entries
      const finalProducts: PurchaseOrderProduct[] = [];
      
      productsList.forEach(p => {
        if (p.variationsQuantities) {
          // It's a product with variations
          const dbProduct = dbProducts.find(x => x.id === p.productId);
          const productUnitCostBrl = getProductFinalUnitBrl(p); // This is unit cost including fees, assuming price is same for all variations

          Object.entries(p.variationsQuantities).forEach(([vId, qty]) => {
            const quantity = Number(qty) || 0;
            if (quantity > 0) {
              const variationName = dbProduct?.variations?.find((v: any) => v.id === vId)?.name || 'Opção';
              finalProducts.push({
                id: `p_${Date.now()}_${vId}`,
                productId: p.productId,
                productName: p.productName,
                variationId: vId,
                variationName: variationName,
                quantity: quantity,
                unitPriceUsd: Number(p.unitPriceUsd) || 0,
                totalProductUsd: quantity * (Number(p.unitPriceUsd) || 0),
                finalUnitCostBrl: productUnitCostBrl
              });
            }
          });
        } else {
          // Simple product
          if ((Number(p.quantity) || 0) > 0) {
            finalProducts.push({
              ...p,
              quantity: Number(p.quantity) || 0,
              unitPriceUsd: Number(p.unitPriceUsd) || 0,
              finalUnitCostBrl: getProductFinalUnitBrl(p)
            });
          }
        }
      });

      const orderPayload: Omit<PurchaseOrder, 'id' | 'createdAt' | 'status'> = {
        date,
        supplier,
        usdQuote: Number(usdQuote),
        iofBrl: Number(iofBrl) || 0,
        packageCount: Number(packageCount) || 0,
        packages: packages.map(p => ({ ...p, taxBrl: Number(p.taxBrl) || 0 })),
        factoryFeeBrl: Number(factoryFeeBrl) || 0,
        products: finalProducts,
        totalProductsUsd,
        totalOrderUsd
      };

      if (isEditing) {
        await stockService.updatePurchaseOrder(id!, orderPayload);
        alert('Entrada Avançada atualizada com sucesso!');
      } else {
        await stockService.registerPurchaseOrder(orderPayload);
        alert('Entrada Avançada registrada com sucesso!');
      }
      navigate('/cadastro/entradas');
    } catch (error) {
      console.error(error);
      alert(`Erro ao ${isEditing ? 'atualizar' : 'registrar'} a entrada avançada.`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <span className="material-symbols-outlined animate-spin text-2xl text-slate-400">sync</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={() => navigate('/cadastro/entradas')}
          className="p-2 text-slate-400 hover:text-white hover:bg-[#1e242b] rounded-lg transition-colors"
          title="Voltar"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <h1 className="text-2xl font-bold text-white uppercase tracking-tight">
          {isEditing ? 'Editar Entrada de Estoque' : 'Nova Entrada de Estoque'} Avançada (Importação)
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* HEADER SECTION */}
        <div className="bg-[#13191f] border border-[#1e242b] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-500">info</span>
            Cabeçalho do Pedido
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-300">Data da Entrada *</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-[#1e242b] border border-[#2b333c] text-white px-4 py-2.5 rounded-lg focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-300">Fornecedor *</label>
              <input
                type="text"
                value={supplier}
                onChange={e => setSupplier(e.target.value)}
                placeholder="Nome do Fornecedor"
                className="w-full bg-[#1e242b] border border-[#2b333c] text-white px-4 py-2.5 rounded-lg focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-300">Cotação do Dólar (R$) *</label>
              <div className="relative group">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={usdQuote}
                  onChange={e => setUsdQuote(e.target.value ? Number(e.target.value) : '')}
                  placeholder="Ex: 5.20"
                  className="w-full bg-[#1e242b] border border-[#2b333c] text-white px-4 py-2.5 rounded-lg focus:outline-none focus:border-blue-500 pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={refreshRate}
                  disabled={rateLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-blue-400 disabled:opacity-50 transition-colors"
                  title="Atualizar Cotação"
                >
                  <span className={`material-symbols-outlined text-[18px] ${rateLoading ? 'animate-spin' : ''}`}>
                    sync
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* PRODUCTS SECTION */}
        <div className="bg-[#13191f] border border-[#1e242b] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-500">inventory_2</span>
              Produtos
            </h2>
            <button
              type="button"
              onClick={handleAddProductRow}
              className="text-sm bg-blue-600/10 text-blue-500 hover:bg-blue-600/20 px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[18px]">add</span> Adicionar Produto
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {productsList.map((p, index) => {
              const finalUnitBrl = getProductFinalUnitBrl(p);
              const selectedProduct = dbProducts.find(db => db.id === p.productId);
              const variations = selectedProduct?.variations || [];
              const hasVariations = variations.length > 0;
              
              return (
                <div key={p.id} className="p-4 border border-[#1e242b] rounded-lg bg-[#0e1217] relative group flex flex-col gap-4">
                  <div className="grid grid-cols-12 gap-4 items-end">
                    <div className="col-span-12 md:col-span-4 flex flex-col gap-1">
                      <label className="text-xs font-medium text-slate-400">Produto Existente</label>
                      <select
                        value={p.productId || ''}
                        onChange={e => handleProductChange(p.id, 'productId', e.target.value)}
                        className="w-full bg-[#1e242b] border border-[#2b333c] text-white px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                      >
                        <option value="">(Produto Novo - Digite abaixo)</option>
                        {dbProducts.map(db => (
                          <option key={db.id} value={db.id}>{db.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-12 md:col-span-4 flex flex-col gap-1">
                      <label className="text-xs font-medium text-slate-400">Nome (Novo ou Existente)</label>
                      <input
                        type="text"
                        value={p.productName}
                        onChange={e => handleProductChange(p.id, 'productName', e.target.value)}
                        disabled={!!p.productId}
                        placeholder={p.productId ? "Nome Automático" : "Digite o nome"}
                        className="w-full bg-[#1e242b] border border-[#2b333c] text-white px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500 text-sm disabled:opacity-50"
                        required
                      />
                    </div>
                    
                    <div className="col-span-6 md:col-span-3 flex flex-col gap-1">
                      <label className="text-xs font-medium text-slate-400">Valor Unitário (USD)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-slate-400 text-sm">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={p.unitPriceUsd}
                          onChange={e => handleProductChange(p.id, 'unitPriceUsd', e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full bg-[#1e242b] border border-[#2b333c] pl-7 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div className="col-span-6 md:col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeProductRow(p.id)}
                        className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Remover Produto"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Variations Quantities Area */}
                  {hasVariations && p.productId && (
                    <div className="bg-[#1e242b]/30 p-4 rounded-lg border border-[#2b333c]/50">
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px]">palette</span>
                        Quantidades por Variação
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {variations.map(v => (
                          <div key={v.id} className="flex flex-col gap-1">
                            <label className="text-[11px] font-medium text-slate-400 truncate" title={v.name}>
                              {v.name}
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={p.variationsQuantities?.[v.id] ?? 0}
                              onChange={e => handleProductChange(p.id, `var_${v.id}`, e.target.value)}
                              placeholder="0"
                              className="w-full bg-[#0e1217] border border-[#2b333c] text-white px-2 py-1.5 rounded-md focus:outline-none focus:border-blue-500 text-sm"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!hasVariations && (
                    <div className="flex flex-col gap-1 max-w-[120px]">
                      <label className="text-xs font-medium text-slate-400">Quantidade Total</label>
                      <input
                        type="number"
                        min="1"
                        value={p.quantity}
                        onChange={e => handleProductChange(p.id, 'quantity', e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full bg-[#1e242b] border border-[#2b333c] text-white px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                        required={!hasVariations}
                      />
                    </div>
                  )}
                  
                  {/* Proportional Display & Summary */}
                  <div className="pt-2 border-t border-[#1e242b] flex items-center justify-between text-xs text-slate-500">
                    <div className="flex flex-wrap gap-x-6 gap-y-1">
                      <span>Qtd Total: <strong className="text-white">{p.quantity}</strong></span>
                      <span>Total Produto: <strong className="text-blue-400">US$ {p.totalProductUsd.toFixed(2)}</strong></span>
                      <span>Custo Final Unitário (Proj.): <strong className="text-emerald-400">R$ {finalUnitBrl.toFixed(2)}</strong></span>
                    </div>
                    {p.productId && <div className="text-blue-400 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">info</span> Registro apenas p/ histórico e recibo</div>}
                    {!p.productId && <div className="text-blue-400 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">info</span> Apenas registro histórico</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* LOGISTICS SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#13191f] border border-[#1e242b] rounded-xl p-6 flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-500">local_shipping</span>
              Tributos e Pacotes
            </h2>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-300">IOF Gasto (BRL)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={iofBrl}
                  onChange={e => setIofBrl(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-[#1e242b] border border-[#2b333c] pl-9 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-300">Quantidade de Pacotes</label>
              <input
                type="number"
                min="0"
                step="1"
                value={packageCount}
                onChange={e => setPackageCount(e.target.value ? parseInt(e.target.value) : '')}
                className="w-full bg-[#1e242b] border border-[#2b333c] text-white px-4 py-2.5 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="bg-[#13191f] border border-[#1e242b] rounded-xl p-6 flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-500">receipt_long</span>
              Encargos Extras
            </h2>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-300">Fee Charge da Fábrica (BRL)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={factoryFeeBrl}
                  onChange={e => setFactoryFeeBrl(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-[#1e242b] border border-[#2b333c] pl-9 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* PACKAGE SLOTS (Dynamic) */}
        {packages.length > 0 && (
          <div className="bg-[#13191f] border border-[#1e242b] rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-500">box</span>
              Tracking e Gestão de Pacotes
            </h2>
            
            <div className="flex flex-col gap-8">
              {/* SECTION: FALTANDO (PENDENTE) */}
              {packages.some(p => (p.status || 'Pendente') === 'Pendente') && (
                <div className="flex flex-col gap-4">
                  <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">pending_actions</span>
                    A Caminho / Faltando ({packages.filter(p => (p.status || 'Pendente') === 'Pendente').length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {packages.filter(p => (p.status || 'Pendente') === 'Pendente').map((pkg) => (
                      <PackageCard 
                        key={pkg.id} 
                        pkg={pkg} 
                        index={packages.findIndex(p => p.id === pkg.id)} 
                        onChange={handlePackageChange} 
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION: CHEGOU (RECEBIDO) */}
              {packages.some(p => p.status === 'Recebido') && (
                <div className="flex flex-col gap-4">
                  <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    Recebidos / Chegou ({packages.filter(p => p.status === 'Recebido').length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {packages.filter(p => p.status === 'Recebido').map((pkg) => (
                      <PackageCard 
                        key={pkg.id} 
                        pkg={pkg} 
                        index={packages.findIndex(p => p.id === pkg.id)} 
                        onChange={handlePackageChange} 
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TOTALS AND SUBMIT */}
        <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-1 text-slate-300 w-full md:w-auto text-sm">
            <p className="flex justify-between md:gap-8">Total Produtos: <span className="font-semibold text-white">US$ {totalProductsUsd.toFixed(2)}</span></p>
            <p className="flex justify-between md:gap-8">Total IOF (BRL): <span className="font-semibold text-white">R$ {(Number(iofBrl) || 0).toFixed(2)}</span></p>
            <p className="flex justify-between md:gap-8">Total Taxas (Pacotes - BRL): <span className="font-semibold text-white">R$ {totalPackagesTaxBrl.toFixed(2)}</span></p>
            <p className="flex justify-between md:gap-8">Fee Charge (BRL): <span className="font-semibold text-white">R$ {(Number(factoryFeeBrl) || 0).toFixed(2)}</span></p>
            <div className="h-px w-full bg-blue-500/20 my-2"></div>
            <p className="flex justify-between font-bold text-lg md:gap-8 text-blue-400">
              VALOR TOTAL (USD): <span>US$ {totalOrderUsd.toFixed(2)}</span>
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 rounded-xl font-medium bg-[#1e242b] text-white hover:bg-[#2b333c] transition-colors w-full md:w-auto"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-8 py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 w-full md:w-auto shadow-lg shadow-blue-500/20"
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
                  Processando...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">check_circle</span>
                  Gravar Entrada Total
                </>
            )}
      </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default StockEntryForm;
