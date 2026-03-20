import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { productService } from '../../services/productService';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ProductList: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterType, setFilterType] = useState('');

    // Novos Filtros e Ordenação
    const [filterModel, setFilterModel] = useState('');
    const [filterColor, setFilterColor] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'most_sold' | 'least_sold'>('name');

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            setLoading(true);
            const data = await productService.getAll();
            
            const { data: sales, error: salesError } = await supabase
                .from('vendas_itens')
                .select('item_id, quantidade')
                .eq('tipo_item', 'produto');
                
            if (salesError) throw salesError;
            
            const salesCounts: Record<string, number> = {};
            sales?.forEach(s => {
                salesCounts[s.item_id] = (salesCounts[s.item_id] || 0) + s.quantidade;
            });
            
            const updatedData = data.map(p => ({
                ...p,
                salesCount: salesCounts[p.id] || 0
            }));
            
            setProducts(updatedData);
        } catch (error) {
            console.error('Error loading products', error);
            alert('Erro ao carregar produtos.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esse produto?')) return;
        try {
            await productService.delete(id);
            setProducts(prev => prev.filter(p => p.id !== id));
        } catch (error) {
            alert('Erro ao excluir.');
        }
    };

    const generateReport = () => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('Relatório de Estoque - King Carcaças', 14, 20);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Data: ${new Date().toLocaleString('pt-BR')}`, 14, 26);

        // Summary Data
        const totalItems = products.reduce((acc, p) => acc + p.stockQuantity, 0);
        const totalCost = products.reduce((acc, p) => acc + (p.costPrice * p.stockQuantity), 0);
        const totalSale = products.reduce((acc, p) => acc + (p.salePrice * p.stockQuantity), 0);
        const potentialProfit = totalSale - totalCost;

        doc.setFillColor(240, 240, 240);
        doc.rect(14, 30, 180, 25, 'F');

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Resumo Geral', 20, 38);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Produtos Cadastrados: ${products.length}`, 20, 45);
        doc.text(`Total de Itens: ${totalItems}`, 100, 45);

        doc.text(`Investimento: R$ ${totalCost.toFixed(2)}`, 20, 50);
        doc.text(`Valor de Venda: R$ ${totalSale.toFixed(2)}`, 100, 50);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 150, 0);
        doc.text(`Lucro Potencial: R$ ${potentialProfit.toFixed(2)}`, 20, 55);
        doc.setTextColor(0);

        // Tables grouped by category
        let lastY = 60;
        const categories = Array.from(new Set(products.map(p => p.category || 'Sem Categoria')));

        categories.forEach(cat => {
            const catProducts = products.filter(p => (p.category || 'Sem Categoria') === cat);

            if (lastY > 250) {
                doc.addPage();
                lastY = 20;
            }

            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(cat, 14, lastY + 10);

            autoTable(doc, {
                startY: lastY + 12,
                head: [['SKU', 'Produto', 'Qtd', 'Custo', 'Venda', 'Margem']],
                body: catProducts.map(p => [
                    p.sku || '-',
                    p.name + (p.variations?.length ? ` (${p.variations.length} v.)` : ''),
                    p.stockQuantity,
                    `R$ ${p.costPrice.toFixed(2)}`,
                    `R$ ${p.salePrice.toFixed(2)}`,
                    `${p.salePrice > 0 ? (((p.salePrice - p.costPrice) / p.salePrice) * 100).toFixed(0) : 0}%`
                ]),
                theme: 'striped',
                headStyles: { fillColor: [25, 25, 25] },
                margin: { left: 14, right: 14 }
            });

            lastY = (doc as any).lastAutoTable.finalY;
        });

        // Stock Alerts
        const lowStock = products.filter(p => p.stockQuantity <= (p.minStock || 0));
        if (lowStock.length > 0) {
            if (lastY > 230) doc.addPage();
            else lastY += 10;

            doc.setTextColor(200, 0, 0);
            doc.setFontSize(12);
            doc.text('ALERTA DE ESTOQUE BAIXO', 14, lastY + 10);

            autoTable(doc, {
                startY: lastY + 12,
                head: [['Produto', 'Estoque Atual', 'Mínimo']],
                body: lowStock.map(p => [p.name, p.stockQuantity, p.minStock || 0]),
                theme: 'grid',
                headStyles: { fillColor: [200, 50, 50] }
            });
        }

        doc.save('relatorio_estoque_king_carcacas.pdf');
    };

    // Derived state for filters
    const uniqueCategories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
    const filtered = products.filter(p => {
        const matchSearch = (p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase())));
        const matchCategory = filterCategory ? p.category === filterCategory : true;
        const matchType = filterType ? p.type === filterType : true;

        const searchTarget = (p.name + ' ' + (p.description || '') + ' ' + (p.variations?.map(v => v.name).join(' ') || '')).toLowerCase();
        const matchModel = filterModel ? searchTarget.includes(filterModel.toLowerCase()) : true;
        const matchColor = filterColor ? searchTarget.includes(filterColor.toLowerCase()) : true;

        return matchSearch && matchCategory && matchType && matchModel && matchColor;
    }).sort((a, b) => {
        if (sortBy === 'most_sold') return (b.salesCount || 0) - (a.salesCount || 0);
        if (sortBy === 'least_sold') return (a.salesCount || 0) - (b.salesCount || 0);
        return a.name.localeCompare(b.name);
    });

    if (loading) return (
        <div className="flex w-full h-full items-center justify-center p-8">
            <span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span>
        </div>
    );

    return (
        <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Estoque</h1>
                    <p className="text-slate-500 dark:text-slate-400">Gerenciamento de produtos e inventário.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={generateReport}
                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                    >
                        <span className="material-symbols-outlined">print</span>
                        Relatório
                    </button>
                    <Link
                        to="/cadastro/produtos/novo"
                        className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                    >
                        <span className="material-symbols-outlined">add</span>
                        Novo Produto
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white dark:bg-surface-dark p-4 rounded-xl shadow-sm border border-slate-200 dark:border-border-dark">
                <div className="md:col-span-2 relative">
                    <span className="material-symbols-outlined absolute left-3 top-3 text-slate-400">search</span>
                    <input
                        placeholder="Buscar por nome ou SKU..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-surface-darker focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                </div>
                <select
                    value={filterCategory}
                    onChange={e => setFilterCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-surface-darker focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                    <option value="">Todas Categorias</option>
                    {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select
                    value={filterType}
                    onChange={e => setFilterType(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-surface-darker focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                    <option value="">Todos Tipos</option>
                    <option value="simple">Simples</option>
                    <option value="kit">Kit</option>
                    <option value="variation">Variação</option>
                </select>
            </div>

            {/* Extended Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white dark:bg-surface-dark p-4 rounded-xl shadow-sm border border-slate-200 dark:border-border-dark mt-[-10px]">
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-3 text-slate-400">devices</span>
                    <input
                        placeholder="Modelo (ex: XR, 11)..."
                        value={filterModel}
                        onChange={e => setFilterModel(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-surface-darker focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                </div>
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-3 text-slate-400">palette</span>
                    <input
                        placeholder="Cor (ex: Preto, Branco)..."
                        value={filterColor}
                        onChange={e => setFilterColor(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-surface-darker focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                </div>
                <div className="relative">
                    <select
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value as any)}
                        className="w-full pl-4 pr-10 py-2.5 rounded-lg border border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-surface-darker focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-700 dark:text-slate-200 font-bold"
                    >
                        <option value="name">Ordenar por: A-Z</option>
                        <option value="most_sold">🏆 Campeões de Venda</option>
                        <option value="least_sold">📉 Menos Vendidos</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm overflow-hidden border border-slate-200 dark:border-border-dark">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 dark:bg-surface-darker text-xs uppercase text-slate-500 font-semibold tracking-wider">
                            <tr>
                                <th className="px-6 py-4 w-16">Img</th>
                                <th className="px-6 py-4">SKU / Produto</th>
                                <th className="px-6 py-4">Categoria</th>
                                <th className="px-6 py-4">Estoque</th>
                                <th className="px-6 py-4">Custo</th>
                                <th className="px-6 py-4">Venda</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filtered.map(product => (
                                <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-surface-darker transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="w-10 h-10 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700">
                                            {product.imageUrl ? (
                                                <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="material-symbols-outlined text-slate-400 text-sm">image</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col items-start">
                                            <span className="font-bold text-slate-900 dark:text-white">{product.name}</span>
                                            {product.sku && <span className="text-xs text-slate-500 font-mono">{product.sku}</span>}
                                            {product.type === 'variation' && product.variations && (
                                                <span className="text-xs text-primary mt-1">{product.variations.length} variações</span>
                                            )}
                                            {product.salesCount !== undefined && product.salesCount > 0 && (
                                                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 mt-1 px-1.5 py-0.5 rounded w-max inline-flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[12px]">trophy</span>
                                                    {product.salesCount} vendidos
                                                </span>
                                            )}
                                            {product.salesCount === 0 && sortBy === 'least_sold' && (
                                                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 mt-1 px-1.5 py-0.5 rounded w-max">
                                                    Sem vendas
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-300">
                                            {product.category || 'Geral'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${product.stockQuantity <= (product.minStock || 0) ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                                            {product.stockQuantity} un
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 font-mono text-sm">R$ {product.costPrice.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-slate-900 dark:text-white font-bold font-mono">R$ {product.salePrice.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link to={`/cadastro/produtos/editar/${product.id}`} className="p-2 text-slate-500 hover:text-primary transition-colors hover:bg-primary/10 rounded-lg">
                                                <span className="material-symbols-outlined text-[20px]">edit</span>
                                            </Link>
                                            <button onClick={() => handleDelete(product.id)} className="p-2 text-slate-500 hover:text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                                                <span className="material-symbols-outlined text-[20px]">delete</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                        <span className="material-symbols-outlined text-4xl mb-2 text-slate-300">inventory_2</span>
                                        <p>Nenhum produto encontrado com os filtros atuais.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ProductList;
