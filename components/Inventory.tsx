import React, { useState } from 'react';
import ProductList from './products/ProductList';
import DeviceList from './cadastro/DeviceList';
import StockHistory from './StockHistory';

const Inventory: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'products' | 'devices' | 'history'>('products');

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-surface-darker">
            {/* Tab Switcher */}
            <div className="bg-white dark:bg-surface-dark border-b border-slate-200 dark:border-border-dark px-8 pt-6">
                <div className="flex items-center gap-8 text-sm font-bold">
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`pb-4 transition-all relative ${activeTab === 'products'
                            ? 'text-primary'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        Produtos e Peças
                        {activeTab === 'products' && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full shadow-[0_-4px_10px_rgba(74,158,255,0.3)]"></div>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('devices')}
                        className={`pb-4 transition-all relative ${activeTab === 'devices'
                            ? 'text-primary'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        Aparelhos em Estoque
                        {activeTab === 'devices' && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full shadow-[0_-4px_10px_rgba(74,158,255,0.3)]"></div>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`pb-4 transition-all relative ${activeTab === 'history'
                            ? 'text-primary'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        Histórico de Movimentações
                        {activeTab === 'history' && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full shadow-[0_-4px_10px_rgba(74,158,255,0.3)]"></div>
                        )}
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto">
                {activeTab === 'products' ? (
                    <ProductList />
                ) : activeTab === 'devices' ? (
                    <DeviceList />
                ) : (
                    <StockHistory />
                )}
            </div>
        </div>
    );
};

export default Inventory;
