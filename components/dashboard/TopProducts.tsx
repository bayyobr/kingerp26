import React from 'react';
import { TopProduct } from '../../services/dashboardService';

interface TopProductsProps {
    data: TopProduct[];
}

const COLORS = ['bg-blue-500', 'bg-yellow-500', 'bg-emerald-500', 'bg-purple-500', 'bg-red-400'];

export const TopProducts: React.FC<TopProductsProps> = ({ data }) => {
    // Determine max value for width calculation
    const maxValue = Math.max(...data.map(d => d.value), 1);

    return (
        <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-slate-200 dark:border-border-dark shadow-sm h-full">
            <div className="flex items-center gap-3 mb-8">
                <span className="material-symbols-outlined text-primary">trophy</span>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Produtos e Serviços Mais Vendidos</h3>
            </div>

            <div className="flex flex-col gap-6">
                {data.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                        Nenhum produto vendido ainda.
                    </div>
                ) : (
                    data.map((item, index) => {
                        const width = `${Math.round((item.value / maxValue) * 100)}%`;
                        const color = COLORS[index % COLORS.length];

                        return (
                            <div key={index} className="w-full">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-2 overflow-hidden flex-1 mr-4">
                                        <div className={`w-2 h-2 rounded-full ${color} shrink-0`}></div>
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate" title={item.name}>
                                            {item.name}
                                        </span>
                                    </div>
                                    <span className="text-sm font-bold text-slate-900 dark:text-white shrink-0">
                                        {item.value} un
                                    </span>
                                </div>
                                <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-700/50 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${color} transition-all duration-1000 ease-out`}
                                        style={{ width }}
                                    ></div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
