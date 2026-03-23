import React, { useState, useEffect } from 'react';
import { Product, PurchaseOrder, PurchaseOrderProduct, PurchaseOrderPackage } from '../../types';
import { productService } from '../../services/productService';
import { stockService } from '../../services/stockService';
import { useNavigate } from 'react-router-dom';
import { useExchangeRate } from '../../hooks/useExchangeRate';

const StockEntryForm: React.FC = () => {
  const navigate = useNavigate();
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
  const [shippingUsd, setShippingUsd] = useState<number | ''>('');
  const [packageCount, setPackageCount] = useState<number | ''>('');
  const [packages, setPackages] = useState<any[]>([]);

  // Fees
  const [factoryFeeUsd, setFactoryFeeUsd] = useState<number | ''>('');

  useEffect(() => {
    loadDbProducts();
  }, []);

  useEffect(() => {
    if (rate && !usdQuote) {
      setUsdQuote(rate);
    }
  }, [rate, usdQuote]);

  useEffect(() => {
    const count = Number(packageCount) || 0;
    setPackages(prev => {
      if (prev.length === count) return prev;
      if (prev.length > count) return prev.slice(0, count);
      const toAdd = count - prev.length;
      const newPacks = Array(toAdd).fill(0).map((_, i) => ({
        id: `pkg_${Date.now()}_${Math.random()}`,
        aliexpressId: '',
        taxUsd: ''
      }));
      return [...prev, ...newPacks];
    });
  }, [packageCount]);

  const loadDbProducts = async () => {
    try {
      const data = await productService.getAll();
      setDbProducts(data);
    } catch (error) {
      console.error('Failed to load products', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculations
  const totalProductsUsd = productsList.reduce((sum, p) => sum + ((Number(p.quantity) || 0) * (Number(p.unitPriceUsd) || 0)), 0);
  const totalPackagesTaxUsd = packages.reduce((sum, p) => sum + (Number(p.taxUsd) || 0), 0);
  const totalExtrasUsd = (Number(shippingUsd) || 0) + totalPackagesTaxUsd + (Number(factoryFeeUsd) || 0);
  const totalOrderUsd = totalProductsUsd + totalExtrasUsd;

  const getProductFinalUnitBrl = (p: PurchaseOrderProduct) => {
    const productTotalUsd = (Number(p.quantity) || 0) * (Number(p.unitPriceUsd) || 0);
    const proportion = totalProductsUsd > 0 ? (productTotalUsd / totalProductsUsd) : 0;
    const productExtraUsd = totalExtrasUsd * proportion;
    const productFinalTotalUsd = productTotalUsd + productExtraUsd;
    const productFinalUnitUsd = (Number(p.quantity) || 0) > 0 ? productFinalTotalUsd / (Number(p.quantity) || 0) : 0;
    return productFinalUnitUsd * (Number(usdQuote) || 0);
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
        shippingUsd: Number(shippingUsd) || 0,
        packageCount: Number(packageCount) || 0,
        packages: packages.map(p => ({ ...p, taxUsd: Number(p.taxUsd) || 0 })),
        factoryFeeUsd: Number(factoryFeeUsd) || 0,
        products: finalProducts,
        totalProductsUsd,
        totalOrderUsd
      };

      await stockService.registerPurchaseOrder(orderPayload);
      alert('Entrada Avançada registrada com sucesso!');
      navigate('/cadastro/entradas');
    } catch (error) {
      console.error(error);
      alert('Erro ao registrar a entrada avançada.');
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
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-2xl font-bold text-white">Entrada de Estoque Avançada (Importação)</h1>
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
                    {p.productId && <div className="text-yellow-500 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">warning</span> Atualizará estoque no banco</div>}
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
              Frete e Embalagem
            </h2>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-300">Valor do Frete (USD)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={shippingUsd}
                  onChange={e => setShippingUsd(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-[#1e242b] border border-[#2b333c] pl-7 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:border-blue-500"
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
              <label className="text-sm font-medium text-slate-300">Fee Charge da Fábrica (USD)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={factoryFeeUsd}
                  onChange={e => setFactoryFeeUsd(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-[#1e242b] border border-[#2b333c] pl-7 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* PACKAGE SLOTS (Dynamic) */}
        {packages.length > 0 && (
          <div className="bg-[#13191f] border border-[#1e242b] rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-500">box</span>
              Tracking e Taxas dos Pacotes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {packages.map((pkg, index) => (
                <div key={pkg.id} className="bg-[#0e1217] border border-[#1e242b] p-4 rounded-lg flex flex-col gap-3">
                  <div className="font-semibold text-slate-300 flex items-center gap-2">
                    <div className="bg-blue-500/20 text-blue-400 size-6 rounded flex items-center justify-center text-xs">
                      {index + 1}
                    </div>
                    Pacote
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-400">ID AliExpress</label>
                    <input
                      type="text"
                      value={pkg.aliexpressId}
                      onChange={e => handlePackageChange(pkg.id, 'aliexpressId', e.target.value)}
                      className="w-full bg-[#1e242b] border border-[#2b333c] text-white px-3 py-1.5 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                      placeholder="Ex: 812344..."
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-400">Preço com Taxas (USD)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1.5 text-slate-400 text-sm">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={pkg.taxUsd}
                        onChange={e => handlePackageChange(pkg.id, 'taxUsd', e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full bg-[#1e242b] border border-[#2b333c] pl-7 text-white px-3 py-1.5 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TOTALS AND SUBMIT */}
        <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-1 text-slate-300 w-full md:w-auto text-sm">
            <p className="flex justify-between md:gap-8">Total Produtos: <span className="font-semibold text-white">US$ {totalProductsUsd.toFixed(2)}</span></p>
            <p className="flex justify-between md:gap-8">Total Frete: <span className="font-semibold text-white">US$ {(Number(shippingUsd) || 0).toFixed(2)}</span></p>
            <p className="flex justify-between md:gap-8">Total Taxas (Pacotes): <span className="font-semibold text-white">US$ {totalPackagesTaxUsd.toFixed(2)}</span></p>
            <p className="flex justify-between md:gap-8">Fee Charge: <span className="font-semibold text-white">US$ {(Number(factoryFeeUsd) || 0).toFixed(2)}</span></p>
            <div className="h-px w-full bg-blue-500/20 my-2"></div>
            <p className="flex justify-between font-bold text-lg md:gap-8 text-blue-400">
              VALOR TOTAL DO PEDIDO: <span>US$ {totalOrderUsd.toFixed(2)}</span>
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
