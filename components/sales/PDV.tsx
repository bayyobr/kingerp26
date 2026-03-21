import React, { useState, useEffect } from 'react';
import { productService } from '../../services/productService';
import { serviceService, Service } from '../../services/serviceService';
import { vendedorService } from '../../services/vendedorService';
import { salesService } from '../../services/salesService';
import { clientService } from '../../services/clientService';
import { supabase } from '../../services/supabase';
import { Client, Product, Vendedor, Aparelho, PaymentMethod, VendaItem, Venda, PaymentDetail } from '../../types';
import { formatPhone, formatCPF } from '../../utils/formatters';
import { generateDeviceTermPDF } from '../../utils/pdfGenerator';

const PDV: React.FC = () => {
    // Catalogs
    const [products, setProducts] = useState<Product[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [devices, setDevices] = useState<Aparelho[]>([]);
    const [sellers, setSellers] = useState<Vendedor[]>([]);

    // UI State
    const [activeTab, setActiveTab] = useState<'products' | 'services' | 'devices'>('products');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);

    // Cart State
    const [cart, setCart] = useState<VendaItem[]>([]);
    const [selectedSellerId, setSelectedSellerId] = useState('');
    const [clientName, setClientName] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [clientCpf, setClientCpf] = useState('');
    const [discount, setDiscount] = useState(0);

    // Client Selection State
    const [clients, setClients] = useState<Client[]>([]);
    const [showClientSuggestions, setShowClientSuggestions] = useState(false);

    // Delivery & Type State
    const [saleType, setSaleType] = useState<'Retirada' | 'Entrega'>('Retirada');
    const [deliveryFee, setDeliveryFee] = useState<number>(0);

    // Payment State
    const [payments, setPayments] = useState<PaymentDetail[]>([]);
    const [currentMethod, setCurrentMethod] = useState<PaymentMethod | ''>('');
    const [currentAmount, setCurrentAmount] = useState<number>(0);
    const [installments, setInstallments] = useState<number>(1);
    const [interestFee, setInterestFee] = useState<number>(0);

    useEffect(() => {
        loadData();
        checkEditMode();
        loadPDVDraft();
    }, []);

    const loadPDVDraft = () => {
        const saved = localStorage.getItem('pdv_draft');
        if (saved) {
            try {
                const draft = JSON.parse(saved);
                if (draft.cart?.length) setCart(draft.cart);
                if (draft.clientName) setClientName(draft.clientName);
                if (draft.clientPhone) setClientPhone(draft.clientPhone);
                if (draft.clientCpf) setClientCpf(draft.clientCpf);
                if (draft.discount) setDiscount(draft.discount);
                if (draft.selectedSellerId) setSelectedSellerId(draft.selectedSellerId);
                if (draft.saleType) setSaleType(draft.saleType);
                if (draft.deliveryFee) setDeliveryFee(draft.deliveryFee);
            } catch (e) {
                console.error('Erro ao carregar rascunho do PDV', e);
            }
        }
    };

    useEffect(() => {
        if (cart.length > 0 || clientName) {
            const draft = {
                cart, clientName, clientPhone, clientCpf,
                discount, selectedSellerId, saleType, deliveryFee
            };
            localStorage.setItem('pdv_draft', JSON.stringify(draft));
        }
    }, [cart, clientName, clientPhone, clientCpf, discount, selectedSellerId, saleType, deliveryFee]);

    const clearPDVDraft = () => {
        localStorage.removeItem('pdv_draft');
    };

    const checkEditMode = async () => {
        const hash = window.location.hash;
        if (hash.includes('edit=')) {
            const saleId = hash.split('edit=')[1];
            if (saleId) {
                try {
                    setLoading(true);
                    const { data: venda, error } = await supabase
                        .from('vendas')
                        .select('*, items:vendas_itens(*)')
                        .eq('id', saleId)
                        .single();

                    if (error) throw error;
                    if (venda) {
                        setClientName(venda.cliente_nome || '');
                        setClientPhone(venda.cliente_telefone || '');
                        setClientCpf(venda.cliente_cpf || '');
                        setDiscount(venda.desconto || 0);
                        setSelectedSellerId(venda.vendedor_id || '');
                        setSaleType(venda.sale_type as any || 'Retirada');
                        setDeliveryFee(venda.delivery_fee || 0);
                        setPayments(venda.payment_details || []);
                        setCart(venda.items || []);
                    }
                } catch (err) {
                    console.error('Erro ao carregar venda para edição:', err);
                } finally {
                    setLoading(false);
                }
            }
        }
    };

    const loadData = async () => {

        setLoading(true);
        try {
            const [p, s, v, d, c] = await Promise.all([
                productService.getAll(),
                serviceService.getAll(),
                vendedorService.getAll(),
                salesService.getAparelhos(),
                clientService.getAllClients()
            ]);
            setProducts(p.filter(x => x.stockQuantity > 0 || (x.variations && x.variations.some(v => v.stock > 0))));
            setServices(s);
            setSellers(v.filter(x => x.ativo));
            setDevices(d.filter(x => x.status === 'Disponível')); // Only Available devices
            setClients(c);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    // Filter Items
    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    const filteredServices = services.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
    const filteredDevices = devices.filter(d =>
        d.modelo.toLowerCase().includes(search.toLowerCase()) ||
        d.marca.toLowerCase().includes(search.toLowerCase())
    );

    // Add to Cart Logic
    const addToCart = (item: any, type: 'produto' | 'servico' | 'aparelho', variationId?: string) => {
        let price = 0;
        let name = '';
        let varName = null;
        let finalVarId = variationId || null;

        if (type === 'produto') {
            const prod = item as Product;
            name = prod.name;
            if (variationId && prod.variations) {
                const v = prod.variations.find(x => x.id === variationId);
                if (v) {
                    price = v.price ? Number(v.price) : prod.salePrice;
                    varName = v.name;
                    // Check stock
                    const inCart = cart.find(x => x.item_id === prod.id && x.variacao_id === variationId);
                    const currentQty = inCart ? inCart.quantidade : 0;
                    if (currentQty + 1 > v.stock) {
                        alert('Estoque insuficiente para esta variação!');
                        return;
                    }
                }
            } else {
                price = prod.salePrice;
                // Check stock
                const inCart = cart.find(x => x.item_id === prod.id && !x.variacao_id);
                const currentQty = inCart ? inCart.quantidade : 0;
                if (currentQty + 1 > prod.stockQuantity) {
                    alert('Estoque insuficiente!');
                    return;
                }
            }
        } else if (type === 'servico') {
            const svc = item as Service;
            name = svc.name;
            price = Number(svc.price);
        } else if (type === 'aparelho') {
            const dev = item as Aparelho;
            name = `${dev.marca} ${dev.modelo}`;
            price = Number(dev.preco_venda);
            // Unique device check
            const inCart = cart.find(x => x.item_id === dev.id);
            if (inCart) {
                alert('Este aparelho já está no carrinho!');
                return;
            }
            if (dev.status && dev.status !== 'Disponível') {
                alert('Aparelho indisponível!');
                return;
            }
        }

        const existingIdx = cart.findIndex(x => x.item_id === item.id && x.variacao_id === finalVarId);

        if (existingIdx >= 0) {
            const newCart = [...cart];
            newCart[existingIdx].quantidade += 1;
            newCart[existingIdx].subtotal = newCart[existingIdx].quantidade * newCart[existingIdx].preco_unitario;
            setCart(newCart);
        } else {
            const newItem: VendaItem = {
                tipo_item: type,
                item_id: item.id,
                item_nome: name,
                variacao_id: finalVarId,
                variacao_nome: varName,
                quantidade: 1,
                preco_unitario: price,
                subtotal: price
            };
            setCart([...cart, newItem]);
        }
    };

    const removeFromCart = (index: number) => {
        const newCart = [...cart];
        newCart.splice(index, 1);
        setCart(newCart);
    };

    const updateQuantity = (index: number, delta: number) => {
        const newCart = [...cart];
        const item = newCart[index];
        const newQty = item.quantidade + delta;
        if (newQty <= 0) return removeFromCart(index);

        item.quantidade = newQty;
        item.subtotal = item.quantidade * item.preco_unitario;
        setCart(newCart);
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setClientPhone(formatPhone(e.target.value));
    };

    const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setClientCpf(formatCPF(e.target.value));
    };

    // Totals
    const subtotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
    // Calculated total with fees from cards if any
    const paymentFees = payments.reduce((acc, p) => acc + (p.fee || 0), 0);

    // Logic: Total = Subtotal - Discount + Delivery + PaymentFees
    const totalWithFees = Math.max(0, subtotal - discount + (saleType === 'Entrega' ? deliveryFee : 0) + paymentFees);

    const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);
    const remaining = Math.max(0, totalWithFees - totalPaid);

    // Auto-set current amount to remaining when tab changes or payments change
    useEffect(() => {
        setCurrentAmount(remaining);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [remaining, currentMethod]);

    const handleAddPayment = () => {
        if (!currentMethod) return alert('Selecione o método!');
        if (currentAmount <= 0) return alert('Valor inválido!');
        if (currentAmount > remaining + 0.01) return alert('Valor maior que o restante!');

        const payment: PaymentDetail = {
            method: currentMethod,
            amount: currentAmount,
            installments: currentMethod === 'Crédito' ? installments : undefined,
            fee: interestFee
        };

        setPayments([...payments, payment]);

        // Reset inputs
        setCurrentMethod('');
        setInstallments(1);
        setInterestFee(0);
    };

    const removePayment = (index: number) => {
        const newP = [...payments];
        newP.splice(index, 1);
        setPayments(newP);
    };

    const handleSelectClient = (client: Client) => {
        setClientName(client.nome);
        setClientPhone(client.telefone || '');
        setClientCpf(client.cpf || '');
        setShowClientSuggestions(false);
    };

    const filteredClientSuggestions = clientName.length >= 2 
        ? clients.filter(c => c.nome.toLowerCase().includes(clientName.toLowerCase()) || (c.cpf && c.cpf.includes(clientName)))
        : [];

    const handleFinish = async () => {
        if (!selectedSellerId) return alert('Selecione um vendedor!');
        if (payments.length === 0) return alert('Adicione pelo menos um pagamento!');
        if (remaining > 0.01) return alert(`Ainda faltam R$ ${remaining.toFixed(2)} para pagar!`);
        if (cart.length === 0) return alert('Carrinho vazio!');

        if (!confirm('Finalizar venda?')) return;

        setLoading(true);
        try {
            // 1. Automatic Client Registration Logic
            if (clientName.trim()) {
                const existingClient = clients.find(c => 
                    (clientCpf && c.cpf === clientCpf) || 
                    (clientPhone && c.telefone === clientPhone)
                );

                if (!existingClient) {
                    await clientService.createClient({
                        nome: clientName,
                        cpf: clientCpf,
                        telefone: clientPhone,
                        is_vip_manual: false
                    });
                    // Note: In a production app, we'd handle errors and update the local clients state
                }
            }

            const venda: Venda = {
                vendedor_id: selectedSellerId,
                cliente_nome: clientName,
                cliente_telefone: clientPhone,
                cliente_cpf: clientCpf,
                subtotal,
                desconto: discount,
                total: totalWithFees,
                forma_pagamento: payments.length > 1 ? 'Múltiplo' : payments[0].method as any,
                payment_details: payments,
                sale_type: saleType,
                delivery_fee: saleType === 'Entrega' ? deliveryFee : 0,
                status: 'Concluída'
            };

            const savedVenda = await salesService.create(venda, cart);

            // Generate PDF for Devices
            const soldDevices = cart.filter(it => it.tipo_item === 'aparelho');
            if (soldDevices.length > 0) {
                const seller = sellers.find(s => s.id === selectedSellerId);
                soldDevices.forEach(sd => {
                    const fullDevice = devices.find(d => d.id === sd.item_id);
                    if (fullDevice) {
                        generateDeviceTermPDF({ ...savedVenda, itens: cart }, fullDevice, seller);
                    }
                });
            }

            alert('Venda realizada com sucesso!');
            // Reset
            setCart([]);
            setPayments([]);
            setClientName('');
            setClientPhone('');
            setClientCpf('');
            setDiscount(0);
            setCurrentMethod('');
            setSaleType('Retirada');
            setDeliveryFee(0);
            clearPDVDraft();
            loadData(); // Refresh stock
        } catch (error: any) {
            console.error('Erro detalhado:', error);
            const msg = error.message || error.details || 'Verifique a conexão ou os dados.';
            alert(`Erro ao finalizar venda: ${msg}`);
        }
        setLoading(false);
    };

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    return (
        <div className="flex flex-col md:flex-row h-screen gap-2 p-2 w-full bg-background-light dark:bg-background-dark overflow-hidden">
            {/* Left: Library */}
            <div className="flex-1 flex flex-col gap-4 bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-slate-200 dark:border-border-dark overflow-hidden transition-colors h-full">
                {/* Search Header */}
                <div className="p-4 border-b border-slate-200 dark:border-border-dark flex flex-col gap-4 flex-none">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">PDV - Nova Venda</h2>
                    <div className="flex gap-2">
                        <button onClick={() => setActiveTab('products')} className={`flex-1 py-3 rounded-lg font-bold text-sm transition-colors ${activeTab === 'products' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-100 dark:bg-surface-darker text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'}`}>PRODUTOS</button>
                        <button onClick={() => setActiveTab('services')} className={`flex-1 py-3 rounded-lg font-bold text-sm transition-colors ${activeTab === 'services' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-100 dark:bg-surface-darker text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'}`}>SERVIÇOS</button>
                        <button onClick={() => setActiveTab('devices')} className={`flex-1 py-3 rounded-lg font-bold text-sm transition-colors ${activeTab === 'devices' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-100 dark:bg-surface-darker text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'}`}>APARELHOS</button>
                    </div>
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar item..."
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-lg outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white placeholder-slate-400 transition-colors"
                        />
                    </div>
                </div>

                {/* List Grid */}
                <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 content-start">
                    {/* Products */}
                    {activeTab === 'products' && filteredProducts.map(p => (
                        <div key={p.id} className="p-3 border border-slate-200 dark:border-slate-700/50 rounded-lg hover:border-primary cursor-pointer transition-colors bg-white dark:bg-surface-darker flex flex-col gap-2 group shadow-sm">
                            <div className="flex justify-between items-start">
                                <span className="font-bold text-slate-800 dark:text-slate-200 line-clamp-2 text-sm">{p.name}</span>
                                <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded flex-shrink-0">
                                    {p.variations?.length ? `${p.variations.reduce((acc, v) => acc + v.stock, 0)} UN` : `${p.stockQuantity} UN`}
                                </span>
                            </div>

                            {p.variations && p.variations.length > 0 ? (
                                <div className="flex flex-col gap-2 mt-auto">
                                    <span className="text-xs text-slate-400 font-medium">Selecione variação:</span>
                                    <select
                                        className="w-full text-xs p-2 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-dark text-slate-700 dark:text-slate-300 outline-none focus:border-primary"
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                addToCart(p, 'produto', e.target.value);
                                                e.target.value = '';
                                            }
                                        }}
                                    >
                                        <option value="">+ Adicionar...</option>
                                        {p.variations.map(v => (
                                            <option key={v.id} value={v.id} disabled={v.stock <= 0}>
                                                {v.name} ({formatCurrency(v.price || p.salePrice)}) - {v.stock}un
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <div className="mt-auto flex justify-between items-center bg-slate-50 dark:bg-surface-dark p-2 rounded-lg">
                                    <span className="font-bold text-primary">{formatCurrency(p.salePrice)}</span>
                                    <button
                                        onClick={() => addToCart(p, 'produto')}
                                        className="bg-primary hover:bg-primary/90 text-white rounded p-1.5 flex items-center justify-center shadow-lg shadow-primary/20 active:scale-95 transition-all"
                                    >
                                        <span className="material-symbols-outlined text-sm">add</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}

                    {activeTab === 'services' && filteredServices.map(s => (
                        <div key={s.id} onClick={() => addToCart(s, 'servico')} className="p-3 border border-slate-200 dark:border-slate-700/50 rounded-lg hover:border-primary cursor-pointer transition-colors bg-white dark:bg-surface-darker flex flex-col justify-between group shadow-sm h-min">
                            <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{s.name}</span>
                            <div className="mt-2 flex justify-between items-center bg-slate-50 dark:bg-surface-dark p-2 rounded-lg">
                                <span className="font-bold text-primary">{formatCurrency(s.price)}</span>
                                <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">add_circle</span>
                            </div>
                        </div>
                    ))}

                    {activeTab === 'devices' && filteredDevices.map(d => (
                        <div key={d.id} className="p-3 border border-slate-200 dark:border-slate-700/50 rounded-lg hover:border-primary cursor-pointer transition-colors bg-white dark:bg-surface-darker flex flex-col gap-1 group shadow-sm h-min">
                            <div className="flex justify-between">
                                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{d.marca} {d.modelo}</span>
                                <span className="text-[10px] bg-slate-100 dark:bg-surface-dark text-slate-500 rounded px-1">{d.estoque} un</span>
                            </div>
                            <span className="text-xs text-slate-400 truncate">IMEI: {d.imei}</span>
                            <div className="mt-2 flex justify-between items-center bg-slate-50 dark:bg-surface-dark p-2 rounded-lg">
                                <span className="font-bold text-primary">{formatCurrency(d.preco_venda)}</span>
                                <button
                                    onClick={() => addToCart(d, 'aparelho')}
                                    className="bg-primary hover:bg-primary/90 text-white rounded p-1.5 active:scale-95 transition-all"
                                >
                                    <span className="material-symbols-outlined text-sm">add</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right: Cart & Checkout */}
            <div className="w-full md:w-[35%] min-w-[450px] flex flex-col bg-white dark:bg-surface-dark rounded-xl shadow-xl border border-slate-200 dark:border-border-dark h-full">
                <div className="p-4 bg-slate-800 dark:bg-slate-900/50 text-white rounded-t-xl flex justify-between items-center border-b border-slate-700 flex-none">
                    <h3 className="font-bold flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">shopping_cart</span>
                        Carrinho
                    </h3>
                    <span className="bg-white/10 px-2 py-0.5 rounded text-sm font-mono">{cart.length} itens</span>
                </div>

                {/* Internal List */}
                <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2 bg-slate-50 dark:bg-[#0f1216] border-b border-slate-200 dark:border-slate-800 min-h-0">
                    {cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                            <span className="material-symbols-outlined text-4xl opacity-20">shopping_bag</span>
                            <p className="text-sm">Carrinho vazio</p>
                        </div>
                    ) : (
                        cart.map((item, idx) => (
                            <div key={idx} className="bg-white dark:bg-surface-dark p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-2 flex-shrink-0">
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm text-slate-800 dark:text-white">{item.item_nome}</span>
                                        {item.variacao_nome && <span className="text-xs text-slate-500">{item.variacao_nome}</span>}
                                        <span className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">{item.tipo_item}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-bold text-slate-700 dark:text-slate-300 block">{formatCurrency(item.subtotal)}</span>
                                        <span className="text-xs text-slate-400">{item.quantidade} x {formatCurrency(item.preco_unitario)}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-2 mt-1">
                                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-surface-darker rounded-lg p-0.5">
                                        <button onClick={() => updateQuantity(idx, -1)} className="w-6 h-6 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded transition-colors">-</button>
                                        <span className="text-xs font-bold w-6 text-center text-slate-800 dark:text-slate-200">{item.quantidade}</span>
                                        <button onClick={() => updateQuantity(idx, 1)} className="w-6 h-6 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded transition-colors">+</button>
                                    </div>
                                    <button onClick={() => removeFromCart(idx)} className="text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 p-1 rounded transition-colors">
                                        <span className="material-symbols-outlined text-lg">delete</span>
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Checkout Section */}
                <div className="flex-none p-4 bg-white dark:bg-surface-dark flex flex-col gap-3 overflow-y-auto max-h-[50vh] border-t border-slate-200 dark:border-slate-800 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] z-10">

                    {/* Seller Select */}
                    <div>
                        {/* Compact Seller Select */}
                        <select
                            value={selectedSellerId}
                            onChange={e => setSelectedSellerId(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-lg p-2 text-sm outline-none text-slate-700 dark:text-white"
                        >
                            <option value="">Selecione Vendedor...</option>
                            {sellers.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                        </select>
                    </div>

                    {/* Client & Logic - More Compact */}
                    <div className="grid grid-cols-1 gap-2">
                        <div className="relative">
                            <input
                                placeholder="Nome Completo (Opcional)"
                                value={clientName}
                                onChange={e => {
                                    setClientName(e.target.value);
                                    setShowClientSuggestions(true);
                                }}
                                onFocus={() => setShowClientSuggestions(true)}
                                className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-lg p-2 text-sm outline-none text-slate-700 dark:text-white"
                            />
                            {showClientSuggestions && filteredClientSuggestions.length > 0 && (
                                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-40 overflow-y-auto">
                                    {filteredClientSuggestions.map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => handleSelectClient(c)}
                                            className="w-full text-left p-2 hover:bg-slate-100 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800 last:border-0"
                                        >
                                            <div className="font-bold text-xs text-slate-800 dark:text-white">{c.nome}</div>
                                            <div className="text-[10px] text-slate-500">{c.cpf || 'Sem CPF'} • {c.telefone || 'Sem Tel'}</div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                placeholder="CPF / RG"
                                value={clientCpf}
                                onChange={handleCpfChange}
                                maxLength={14}
                                className="bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-lg p-2 text-sm outline-none text-slate-700 dark:text-white"
                            />
                            <input
                                placeholder="(00) 0 0000-0000"
                                value={clientPhone}
                                onChange={handlePhoneChange}
                                maxLength={16}
                                className="bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-border-dark rounded-lg p-2 text-sm outline-none text-slate-700 dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Delivery Logic - Compact */}
                    <div className="flex items-center gap-2">
                        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 flex-1">
                            <button
                                onClick={() => { setSaleType('Retirada'); setDeliveryFee(0); }}
                                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${saleType === 'Retirada' ? 'bg-white dark:bg-surface-dark shadow text-primary' : 'text-slate-500'}`}
                            >
                                Retirada
                            </button>
                            <button
                                onClick={() => setSaleType('Entrega')}
                                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${saleType === 'Entrega' ? 'bg-white dark:bg-surface-dark shadow text-primary' : 'text-slate-500'}`}
                            >
                                Entrega
                            </button>
                        </div>
                        {saleType === 'Entrega' && (
                            <div className="w-24">
                                <input
                                    type="number"
                                    placeholder="Taxa"
                                    value={deliveryFee > 0 ? deliveryFee : ''}
                                    onChange={e => setDeliveryFee(Number(e.target.value))}
                                    className="w-full bg-slate-50 dark:bg-surface-darker border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-sm font-bold text-center outline-none text-slate-800 dark:text-white"
                                />
                            </div>
                        )}
                    </div>

                    <hr className="border-slate-100 dark:border-slate-800 my-0.5" />

                    {/* Financial Summary */}
                    <div className="flex flex-col gap-1 p-2 bg-slate-50 dark:bg-surface-darker/50 rounded-lg border border-slate-100 dark:border-slate-800/50">
                        {/* Discount Input */}
                        <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-500">Desconto</span>
                            <div className="flex items-center gap-1 border-b border-orange-200 dark:border-orange-900/50 pb-0.5">
                                <span className="text-orange-500 font-bold">- R$</span>
                                <input
                                    type="number"
                                    value={discount === 0 ? '' : discount}
                                    onChange={e => setDiscount(Number(e.target.value))}
                                    placeholder="0,00"
                                    className="w-16 text-right bg-transparent text-xs outline-none text-orange-600 dark:text-orange-400 font-bold placeholder-orange-300"
                                />
                            </div>
                        </div>

                        {/* Summary Lines */}
                        <div className="flex justify-between items-center text-xs text-slate-500">
                            <span>Subtotal</span>
                            <span>{formatCurrency(subtotal)}</span>
                        </div>

                        {(saleType === 'Entrega' && deliveryFee > 0) && (
                            <div className="flex justify-between items-center text-xs text-slate-500">
                                <span>(+) Entrega</span>
                                <span>{formatCurrency(deliveryFee)}</span>
                            </div>
                        )}

                        {paymentFees > 0 && (
                            <div className="flex justify-between items-center text-xs text-slate-500">
                                <span>(+) Taxas</span>
                                <span>{formatCurrency(paymentFees)}</span>
                            </div>
                        )}

                        <div className="border-t border-slate-200 dark:border-slate-700 my-1 pt-1 flex justify-between items-end">
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">TOTAL</span>
                            <span className="text-xl font-black text-slate-900 dark:text-white">{formatCurrency(totalWithFees)}</span>
                        </div>
                    </div>

                    {/* Payments Manager */}
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pagamento</label>
                            <span className={`text-xs font-bold ${remaining > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                Resta: {formatCurrency(remaining)}
                            </span>
                        </div>

                        {/* Add Payment Form */}
                        {remaining > 0.01 && (
                            <div className="flex flex-col gap-2 bg-slate-50 dark:bg-surface-darker p-2 rounded-lg border border-slate-200 dark:border-border-dark">
                                <div className="flex gap-2">
                                    <select
                                        value={currentMethod}
                                        onChange={e => {
                                            setCurrentMethod(e.target.value as PaymentMethod);
                                            setCurrentAmount(remaining);
                                        }}
                                        className="flex-1 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs outline-none text-slate-700 dark:text-white"
                                    >
                                        <option value="">Forma...</option>
                                        <option value="Dinheiro">Dinheiro</option>
                                        <option value="PIX">PIX</option>
                                        <option value="Débito">Débito</option>
                                        <option value="Crédito">Crédito</option>
                                    </select>
                                    <input
                                        type="number"
                                        value={currentAmount}
                                        onChange={e => setCurrentAmount(Number(e.target.value))}
                                        className="w-20 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs outline-none text-right text-slate-700 dark:text-white"
                                    />
                                    <button
                                        onClick={handleAddPayment}
                                        disabled={!currentMethod}
                                        className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg px-2 disabled:opacity-50"
                                    >
                                        +
                                    </button>
                                </div>
                                {currentMethod === 'Crédito' && (
                                    <div className="flex gap-2 items-center animate-fadeIn">
                                        <div className="flex-1 flex gap-1 items-center bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-lg px-2">
                                            <span className="text-[10px] text-slate-400">Px</span>
                                            <input
                                                type="number"
                                                min="1" max="12"
                                                value={installments}
                                                onChange={e => setInstallments(Number(e.target.value))}
                                                className="w-full py-1 bg-transparent text-xs font-bold outline-none text-slate-700 dark:text-white"
                                            />
                                        </div>
                                        <div className="flex-1 flex gap-1 items-center bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-lg px-2">
                                            <span className="text-[10px] text-slate-400">Juros</span>
                                            <input
                                                type="number"
                                                min="0"
                                                value={interestFee}
                                                onChange={e => setInterestFee(Number(e.target.value))}
                                                className="w-full py-1 bg-transparent text-xs font-bold outline-none text-slate-700 dark:text-white"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Payments List - Compact */}
                        <div className="flex flex-col gap-1 max-h-20 overflow-y-auto custom-scrollbar">
                            {payments.map((p, idx) => (
                                <div key={idx} className="flex justify-between items-center text-xs p-1.5 bg-slate-50 dark:bg-surface-darker rounded border border-slate-100 dark:border-slate-800">
                                    <span className="font-bold text-slate-700 dark:text-slate-300">{p.method} {p.installments ? `${p.installments}x` : ''}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-800 dark:text-white">{formatCurrency(p.amount)}</span>
                                        <button onClick={() => removePayment(idx)} className="text-red-400 hover:text-red-500">
                                            <span className="material-symbols-outlined text-sm">close</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleFinish}
                        disabled={loading || cart.length === 0 || remaining > 0.01}
                        className="w-full mt-auto bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2 transition-all active:scale-95 text-sm uppercase tracking-wider"
                    >
                        {loading ? '...' : (
                            <>
                                <span className="material-symbols-outlined text-lg">check_circle</span>
                                Finalizar
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PDV;
