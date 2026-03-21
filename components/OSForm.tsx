import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ServiceOrder, OSStatus, Checklist } from '../types';
import { INITIAL_CHECKLIST, IPHONE_MODELS, CHECKLIST_LABELS } from '../constants';
import { getSmartDiagnosis } from '../services/geminiService';
import { generatePDF } from '../services/pdfService';
import { productService } from '../services/productService';
import { serviceService, Service } from '../services/serviceService';
import { Product, Vendedor } from '../types';
import { formatCPF, formatPhone } from '../utils/formatters';
import { vendedorService } from '../services/vendedorService';
import { useFormPersistence } from '../hooks/useFormPersistence';

interface OSFormProps {
  orders?: ServiceOrder[];
  onSave: (order: ServiceOrder) => void;
}

// Helper: Creatable Select Component
const CreatableSelect = ({
  options,
  value,
  onChange,
  placeholder,
  onAddCustom,
  type
}: {
  options: { id: string, label: string, price?: number }[],
  value: string,
  onChange: (val: string, price?: number) => void,
  placeholder: string,
  onAddCustom?: (val: string) => void,
  type: 'service' | 'item'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(inputValue.toLowerCase())
  );

  const handleSelect = (opt: { id: string, label: string, price?: number }) => {
    onChange(opt.label, opt.price);
    setInputValue('');
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue) {
      e.preventDefault();
      onChange(inputValue);
      if (onAddCustom) onAddCustom(inputValue);
      setInputValue('');
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
          {type === 'service' ? 'build' : 'shopping_bag'}
        </span>
        <input
          type="text"
          value={inputValue}
          onFocus={() => setIsOpen(true)}
          onChange={e => { setInputValue(e.target.value); setIsOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-lg py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all"
        />
        {isOpen && (inputValue || filtered.length > 0) && (
          <div className="absolute z-[100] w-full mt-1 bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-lg shadow-2xl max-h-60 overflow-y-auto animate-fadeIn">
            {filtered.length > 0 ? (
              filtered.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelect(opt)}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-surface-darker text-slate-700 dark:text-slate-300 border-b border-slate-50 dark:border-slate-800 last:border-0 flex justify-between items-center group"
                >
                  <span className="font-medium">{opt.label}</span>
                  {opt.price !== undefined && (
                    <span className="text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded text-[10px]">
                      R$ {opt.price.toFixed(2)}
                    </span>
                  )}
                </button>
              ))
            ) : inputValue && (
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); onChange(inputValue); if (onAddCustom) onAddCustom(inputValue); }}
                className="w-full text-left px-4 py-3 text-sm text-primary font-bold hover:bg-primary/5 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">add_circle</span>
                Adicionar "{inputValue}"
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const OSForm: React.FC<OSFormProps> = ({ orders, onSave }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [loadingAI, setLoadingAI] = useState(false);
  const [availableServices, setAvailableServices] = useState<Service[]>([]);

  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [availableTechnicians, setAvailableTechnicians] = useState<Vendedor[]>([]);

  const [formData, setFormData] = useState<ServiceOrder>({
    id: Math.random().toString(36).substr(2, 9),
    osNumber: `#${new Date().getFullYear()}${Math.floor(Math.random() * 9000) + 1000}`,
    status: OSStatus.ABERTO,
    entryDate: new Date().toISOString().split('T')[0],
    expectedExitDate: '',
    client: { name: '', cpf: '', phone: '' },
    device: { brand: 'Apple', model: '', color: '', imei: '', password: '' },
    problemReported: '',
    technicalDiagnosis: '',
    services: '',
    items: '',
    checklist: { ...INITIAL_CHECKLIST },
    warrantyDays: 90,
    priceParts: 0,
    priceTotal: 0,
  });

  const { draftRequest, saveDraft, clearDraft } = useFormPersistence<ServiceOrder>(
    'os_form',
    {
        id: '', osNumber: '', status: OSStatus.ABERTO, entryDate: '', expectedExitDate: '',
        client: { name: '', cpf: '', phone: '' },
        device: { brand: 'Apple', model: '', color: '', imei: '', password: '' },
        problemReported: '', technicalDiagnosis: '', services: '', items: '',
        checklist: { ...INITIAL_CHECKLIST }, warrantyDays: 90, priceParts: 0, priceTotal: 0
    },
    !id
  );

  // Restore draft if available
  useEffect(() => {
    if (draftRequest && !id) {
        setFormData(prev => ({
            ...draftRequest,
            id: prev.id, // Keep newly generated ID
            osNumber: prev.osNumber // Keep newly generated OS number
        }));
    }
  }, [draftRequest, id]);

  // Save draft on changes
  useEffect(() => {
    if (!id && (formData.client.name || formData.problemReported)) {
        saveDraft(formData);
    }
  }, [formData, id, saveDraft]);

  const [quantity, setQuantity] = useState(1);
  const [serviceQuantity, setServiceQuantity] = useState(1);
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [prods, servs] = await Promise.all([
        productService.getAll(),
        serviceService.getAll()
      ]);
      setAvailableProducts(prods);
      setAvailableServices(servs);

      const vendedores = await vendedorService.getAll();
      const techs = vendedores.filter(v =>
        v.ativo && (v.cargo === 'Técnico' || v.cargo === 'Gerente')
      );
      setAvailableTechnicians(techs);
    } catch (error) {
      console.error("Failed to load catalog", error);
    }
  };

  useEffect(() => {
    if (id && orders) {
      const order = orders.find(o => o.id === id);
      if (order) setFormData(order);
    }
  }, [id, orders]);

  const handleGeminiDiagnose = async () => {
    if (!formData.device.brand || !formData.device.model || !formData.problemReported) {
      alert("Preencha marca, modelo e problema primeiro!");
      return;
    }
    setLoadingAI(true);
    const result = await getSmartDiagnosis(formData.device.brand, formData.device.model, formData.problemReported);
    setFormData(prev => ({ ...prev, technicalDiagnosis: result || '' }));
    setLoadingAI(false);
  };

  const handleChecklistToggle = (key: keyof Checklist, val: boolean | null) => {
    setFormData(prev => ({
      ...prev,
      checklist: { ...prev.checklist, [key]: val }
    }));
  };

  const addServiceItem = (name: string, price?: number) => {
    const unitPrice = price || 0;
    const cost = unitPrice * serviceQuantity;
    const itemText = `${serviceQuantity}x ${name}${price !== undefined ? ` - R$ ${unitPrice.toFixed(2)}` : ''}`;

    setFormData(prev => ({
      ...prev,
      services: prev.services ? `${prev.services}\n${itemText}` : itemText,
      priceTotal: (prev.priceTotal || 0) + cost
    }));
    setServiceQuantity(1);
  };

  const addProductItem = (name: string, price?: number) => {
    // Check if it's a registered product to handle variations
    const product = availableProducts.find(p => p.name === name);
    if (product && product.variations && product.variations.length > 0) {
      setPendingProduct(product);
      return;
    }

    const unitPrice = price || 0;
    const cost = unitPrice * quantity;
    const itemText = `${quantity}x ${name}${price !== undefined ? ` - R$ ${unitPrice.toFixed(2)}` : ''}`;

    setFormData(prev => ({
      ...prev,
      items: prev.items ? `${prev.items}\n${itemText}` : itemText,
      priceTotal: (prev.priceTotal || 0) + cost
    }));
    setQuantity(1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.client.name) return alert("Nome do cliente é obrigatório!");
    if (!formData.device.model) return alert("Modelo do aparelho é obrigatório!");
    if (!formData.technicianId) return alert("Selecione um técnico responsável!");

    onSave(formData);
    clearDraft();
    navigate('/vendas/ordens');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {id ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço'}
          </h1>
          <p className="text-slate-500 dark:text-[#a2aab4] mt-1 text-sm md:text-base">Preencha os dados abaixo para registrar a entrada do dispositivo.</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2.5 border border-slate-300 dark:border-border-dark rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-surface-dark transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              if (!formData.client.name || !formData.device.model || !formData.technicianId) {
                alert("Preencha os campos obrigatórios (Cliente, Modelo, Técnico) antes de salvar.");
                return;
              }
              onSave(formData);
              generatePDF(formData);
              navigate('/vendas/ordens');
            }}
            className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-800 text-white font-bold py-2.5 px-6 rounded-lg shadow-lg shadow-slate-900/20 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">print</span>
            <span>Salvar e Imprimir</span>
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold py-2.5 px-6 rounded-lg shadow-lg shadow-primary/20 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">save</span>
            <span>Salvar OS</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-slate-200 dark:border-border-dark p-6 md:p-8">
        <form className="flex flex-col gap-8" onSubmit={handleSubmit}>
          {/* Header Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Número da OS</label>
              <div className="flex items-center px-4 py-2.5 bg-slate-100 dark:bg-surface-darker rounded-lg border border-slate-200 dark:border-border-dark text-slate-500 dark:text-slate-400 font-mono font-bold select-none text-sm">
                {formData.osNumber}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as OSStatus })}
                className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-lg py-2.5 px-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              >
                {Object.values(OSStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Data Entrada</label>
              <input
                type="date"
                value={formData.entryDate}
                onChange={(e) => setFormData({ ...formData, entryDate: e.target.value })}
                className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-lg py-2.5 px-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Previsão Saída</label>
              <input
                type="date"
                value={formData.expectedExitDate}
                onChange={(e) => setFormData({ ...formData, expectedExitDate: e.target.value })}
                className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-lg py-2.5 px-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              />
            </div>
          </div>

          <hr className="border-slate-200 dark:border-border-dark" />

          {/* Client & Device */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">person</span>
                Dados do Cliente
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <input
                  placeholder="Nome Completo *"
                  required
                  value={formData.client.name}
                  onChange={(e) => setFormData({ ...formData, client: { ...formData.client, name: e.target.value } })}
                  className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    placeholder="CPF"
                    value={formData.client.cpf}
                    onChange={(e) => setFormData({ ...formData, client: { ...formData.client, cpf: formatCPF(e.target.value) } })}
                    maxLength={14}
                    className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-primary/50 outline-none font-mono"
                  />
                  <input
                    placeholder="Telefone"
                    value={formData.client.phone}
                    onChange={(e) => setFormData({ ...formData, client: { ...formData.client, phone: formatPhone(e.target.value) } })}
                    maxLength={16}
                    className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-primary/50 outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">smartphone</span>
                Dados do Aparelho
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Modelo do iPhone *</label>
                    <select
                      value={formData.device.model}
                      required
                      onChange={(e) => setFormData({
                        ...formData,
                        device: {
                          ...formData.device,
                          brand: 'Apple',
                          model: e.target.value
                        }
                      })}
                      className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-lg py-2.5 px-4 focus:ring-2 focus:ring-primary/50 outline-none text-sm transition-all"
                    >
                      <option value="">Selecione o modelo...</option>
                      {IPHONE_MODELS.map(model => (
                        <option key={model} value={model}>{model}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    placeholder="Cor"
                    value={formData.device.color}
                    onChange={(e) => setFormData({ ...formData, device: { ...formData.device, color: e.target.value } })}
                    className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-lg py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <input
                    placeholder="IMEI / Serial"
                    value={formData.device.imei}
                    onChange={(e) => setFormData({ ...formData, device: { ...formData.device, imei: e.target.value } })}
                    className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-lg py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/50 font-mono"
                  />
                </div>
                <input
                  placeholder="Senha de Bloqueio (Opcional)"
                  value={formData.device.password}
                  onChange={(e) => setFormData({ ...formData, device: { ...formData.device, password: e.target.value } })}
                  className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-lg py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-200 dark:border-border-dark" />

          {/* Checklist */}
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">fact_check</span>
              Checklist de Entrada
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {Object.keys(INITIAL_CHECKLIST).map((key) => (
                <div key={key} className="flex flex-col gap-1.5 p-2 bg-slate-50 dark:bg-surface-darker rounded-lg border border-slate-200 dark:border-border-dark transition-all hover:bg-slate-100 dark:hover:bg-slate-800">
                  <span className="text-[10px] font-bold text-slate-500 uppercase truncate">{CHECKLIST_LABELS[key as keyof Checklist]}</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => handleChecklistToggle(key as keyof Checklist, true)}
                      className={`flex-1 py-1 rounded-md transition-all ${formData.checklist[key as keyof Checklist] === true ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}
                    >
                      <span className="material-symbols-outlined text-sm">check</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChecklistToggle(key as keyof Checklist, false)}
                      className={`flex-1 py-1 rounded-md transition-all ${formData.checklist[key as keyof Checklist] === false ? 'bg-red-500 text-white shadow-md shadow-red-500/20' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChecklistToggle(key as keyof Checklist, null)}
                      className={`flex-1 py-1 rounded-md transition-all ${formData.checklist[key as keyof Checklist] === null ? 'bg-slate-400 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 opacity-50'}`}
                      title="Limpar"
                    >
                      <span className="material-symbols-outlined text-xs">block</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <hr className="border-slate-200 dark:border-border-dark" />

          {/* Services & Items */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Services Section */}
            <div className="flex flex-col gap-4">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">build</span>
                Serviços Executados
              </label>
              <div className="flex gap-2 mb-2">
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setServiceQuantity(Math.max(1, serviceQuantity - 1))}
                    className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-l-lg px-2 py-2 font-bold border border-r-0 border-slate-300 dark:border-border-dark transition-colors h-10"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={serviceQuantity}
                    onChange={(e) => setServiceQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-10 bg-white dark:bg-surface-dark border-y border-slate-300 dark:border-border-dark py-2 text-center text-xs font-bold focus:outline-none appearance-none h-10"
                  />
                  <button
                    type="button"
                    onClick={() => setServiceQuantity(serviceQuantity + 1)}
                    className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-r-lg px-2 py-2 font-bold border border-l-0 border-slate-300 dark:border-border-dark transition-colors h-10"
                  >
                    +
                  </button>
                </div>
                <div className="flex-1">
                  <CreatableSelect
                    type="service"
                    options={availableServices.map(s => ({ id: s.id, label: s.name, price: s.price }))}
                    value=""
                    onChange={(val, price) => addServiceItem(val, price)}
                    placeholder="Buscar ou adicionar serviço..."
                  />
                </div>
              </div>
              {/* Summary of Services */}
              <div className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-xl overflow-hidden flex flex-col min-h-[100px]">
                {(!formData.services || formData.services.trim() === '') ? (
                  <div className="p-4 text-xs text-slate-400 italic">Nenhum serviço adicionado.</div>
                ) : (
                  formData.services.split('\n').filter(line => line.trim()).map((line, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                      <span className="text-xs font-mono text-slate-700 dark:text-slate-300">{line}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const lines = (formData.services || '').split('\n').filter(l => l.trim());
                          const lineToRemove = lines[idx];
                          const priceMatch = lineToRemove.match(/R\$ (\d+(\.\d{1,2})?)/);
                          const priceToDeduct = priceMatch ? parseFloat(priceMatch[1]) : 0;
                          const newLines = lines.filter((_, i) => i !== idx);
                          setFormData({
                            ...formData,
                            services: newLines.join('\n'),
                            priceTotal: Math.max(0, (formData.priceTotal || 0) - priceToDeduct)
                          });
                        }}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Items Section */}
            <div className="flex flex-col gap-4">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">shopping_bag</span>
                Itens / Peças Adicionadas
              </label>
              <div className="flex gap-2 mb-2">
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-l-lg px-2 py-2 font-bold border border-r-0 border-slate-300 dark:border-border-dark transition-colors h-10"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-10 bg-white dark:bg-surface-dark border-y border-slate-300 dark:border-border-dark py-2 text-center text-xs font-bold focus:outline-none appearance-none h-10"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-r-lg px-2 py-2 font-bold border border-l-0 border-slate-300 dark:border-border-dark transition-colors h-10"
                  >
                    +
                  </button>
                </div>

                {pendingProduct ? (
                  <div className="flex-1 flex gap-2 animate-fadeIn">
                    <select
                      className="flex-1 bg-white dark:bg-surface-dark border-2 border-primary text-slate-800 dark:text-white rounded-lg py-2 px-3 text-xs font-bold focus:outline-none shadow-xl shadow-primary/10 transition-all h-10"
                      autoFocus
                      value=""
                      onChange={(e) => {
                        const variationId = e.target.value;
                        if (variationId === 'cancel') {
                          setPendingProduct(null);
                          return;
                        }
                        const variation = pendingProduct.variations?.find(v => v.id === variationId);
                        if (variation) {
                          const finalPrice = variation.price !== undefined ? Number(variation.price) : pendingProduct.salePrice;
                          const cost = finalPrice * quantity;
                          const itemText = `${quantity}x ${pendingProduct.name} (${variation.name}) - R$ ${finalPrice.toFixed(2)}`;
                          setFormData(prev => ({
                            ...prev,
                            items: prev.items ? `${prev.items}\n${itemText}` : itemText,
                            priceTotal: (prev.priceTotal || 0) + cost
                          }));
                          setPendingProduct(null);
                          setQuantity(1);
                        }
                      }}
                    >
                      <option value="">Selecione Variação...</option>
                      {pendingProduct.variations?.map(v => (
                        <option key={v.id} value={v.id} disabled={v.stock <= 0}>
                          {v.name} ({v.stock} un) {v.price ? `- R$ ${v.price.toFixed(2)}` : ''}
                        </option>
                      ))}
                      <option value="cancel" className="text-red-500 font-bold">Cancelar</option>
                    </select>
                  </div>
                ) : (
                  <div className="flex-1">
                    <CreatableSelect
                      type="item"
                      options={availableProducts.map(p => ({ id: p.id, label: p.name, price: p.salePrice }))}
                      value=""
                      onChange={(val, price) => addProductItem(val, price)}
                      placeholder="Buscar ou adicionar peça..."
                    />
                  </div>
                )}
              </div>
              {/* Summary of Items */}
              <div className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-xl overflow-hidden flex flex-col min-h-[100px]">
                {(!formData.items || formData.items.trim() === '') ? (
                  <div className="p-4 text-xs text-slate-400 italic">Nenhum item adicionado.</div>
                ) : (
                  formData.items.split('\n').filter(line => line.trim()).map((line, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                      <span className="text-xs font-mono text-slate-700 dark:text-slate-300">{line}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const lines = (formData.items || '').split('\n').filter(l => l.trim());
                          const lineToRemove = lines[idx];
                          const priceMatch = lineToRemove.match(/R\$ (\d+(\.\d{1,2})?)/);
                          const priceToDeduct = priceMatch ? parseFloat(priceMatch[1]) : 0;
                          const newLines = lines.filter((_, i) => i !== idx);
                          setFormData({
                            ...formData,
                            items: newLines.join('\n'),
                            priceTotal: Math.max(0, (formData.priceTotal || 0) - priceToDeduct)
                          });
                        }}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-3">
              <label className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <span className="material-symbols-outlined text-base">report_problem</span>
                Problema Relatado
              </label>
              <textarea
                rows={3}
                value={formData.problemReported}
                onChange={(e) => setFormData({ ...formData, problemReported: e.target.value })}
                className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all placeholder:italic"
                placeholder="Descreva o defeito informado pelo cliente..."
              />
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">analytics</span>
                  Diagnóstico Técnico
                </label>
                <button
                  type="button"
                  onClick={handleGeminiDiagnose}
                  disabled={loadingAI}
                  className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20 hover:bg-primary hover:text-white transition-all disabled:opacity-50 active:scale-95 shadow-sm"
                >
                  <span className="material-symbols-outlined text-sm">{loadingAI ? 'refresh' : 'auto_awesome'}</span>
                  {loadingAI ? 'Analisando...' : 'IA Diagnosis'}
                </button>
              </div>
              <textarea
                rows={3}
                value={formData.technicalDiagnosis}
                onChange={(e) => setFormData({ ...formData, technicalDiagnosis: e.target.value })}
                className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all placeholder:italic"
                placeholder="Insira o diagnóstico ou use a IA..."
              />
            </div>
          </div>

          <hr className="border-slate-200 dark:border-border-dark" />

          {/* Technician Selection */}
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">engineering</span>
              Responsável Técnico
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Técnico Responsável *</label>
                <select
                  value={formData.technicianId || ''}
                  required
                  onChange={(e) => setFormData({ ...formData, technicianId: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-lg py-3 px-4 focus:ring-2 focus:ring-primary/50 outline-none text-sm font-medium transition-all"
                >
                  <option value="">Selecione o profissional...</option>
                  {availableTechnicians.map(t => (
                    <option key={t.id} value={t.id}>{t.nome} ({t.cargo})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Totals Section */}
          <div className="bg-slate-50 dark:bg-surface-darker p-8 rounded-3xl border border-slate-200 dark:border-border-dark flex flex-col gap-6 shadow-inner">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-end">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Garantia (dias)</label>
                <div className="relative max-w-[150px]">
                  <input
                    type="number"
                    value={formData.warrantyDays}
                    onChange={(e) => setFormData({ ...formData, warrantyDays: parseInt(e.target.value) || 0 })}
                    className="w-full bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-xl py-3 px-4 font-bold focus:ring-2 focus:ring-primary/50 outline-none shadow-sm"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">DIAS</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 items-end">
                <label className="text-xs font-bold text-primary uppercase tracking-widest text-right">Valor Total da Ordem</label>
                <div className="relative w-full max-w-[250px]">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-black text-xl">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.priceTotal}
                    onChange={(e) => setFormData({ ...formData, priceTotal: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white dark:bg-surface-dark border-primary border-2 rounded-2xl py-4 pl-14 pr-4 text-right font-black text-3xl text-slate-800 dark:text-white shadow-xl shadow-primary/10 focus:ring-4 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-4 mt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-8 py-3.5 border border-slate-300 dark:border-border-dark rounded-xl text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                if (!formData.client.name || !formData.device.model || !formData.technicianId) {
                  alert("Preencha os campos obrigatórios (*) antes de salvar.");
                  return;
                }
                onSave(formData);
                clearDraft();
                generatePDF(formData);
                navigate('/ordens');
              }}
              className="px-8 py-3.5 bg-slate-700 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-slate-900/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="material-symbols-outlined">print</span>
              Salvar e Imprimir
            </button>
            <button
              type="submit"
              className="px-8 py-3.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-black text-lg flex items-center gap-2 shadow-xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="material-symbols-outlined">save</span>
              FINALIZAR ORDEM
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OSForm;
