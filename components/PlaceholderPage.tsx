import React from 'react';

interface PlaceholderPageProps {
    title: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title }) => {
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">{title}</h1>
            <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-slate-200 dark:border-border-dark p-12 flex flex-col items-center justify-center text-center">
                <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">
                    construction
                </span>
                <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300">Em Desenvolvimento</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2">
                    A página de <strong>{title}</strong> estará disponível em breve.
                </p>
            </div>
        </div>
    );
};

export default PlaceholderPage;
