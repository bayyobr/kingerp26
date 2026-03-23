import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useExchangeRate } from '../hooks/useExchangeRate';
import { formatCurrency } from '../utils/formatters';

interface SubMenu {
  path: string;
  label: string;
  icon: string;
}

interface MenuItem {
  path: string;
  label: string;
  icon: string;
  children?: SubMenu[];
}

const Sidebar: React.FC = () => {
  const location = useLocation();
  const [isMinimized, setIsMinimized] = useState(true);
  const [menusOpen, setMenusOpen] = useState<{ [key: string]: boolean }>({});
  const { rate, loading: rateLoading } = useExchangeRate();

  const menuItems: MenuItem[] = [
    { path: '/', label: 'Painel', icon: 'grid_view' },
    {
      path: '/vendas',
      label: 'Vendas',
      icon: 'sell',
      children: [
        { path: '/vendas', label: 'PDV', icon: 'point_of_sale' },
        { path: '/vendas/pedidos', label: 'Pedidos de Venda', icon: 'receipt_long' },
        { path: '/vendas/ordens', label: 'Ordens de Serviço', icon: 'assignment' },
      ]
    },

    { path: '/agenda', label: 'Agenda', icon: 'calendar_month' },
    { path: '/estrategico', label: 'Estratégico', icon: 'rocket_launch' },
    { path: '/estoque', label: 'Estoque', icon: 'inventory_2' }, // Added to match image
    {
      path: '/cadastro',
      label: 'Cadastro',
      icon: 'app_registration',
      children: [
        { path: '/cadastro/entradas', label: 'Histórico de Entradas', icon: 'history' },
        { path: '/cadastro/clientes', label: 'Clientes', icon: 'person' },
        { path: '/cadastro/produtos', label: 'Produtos', icon: 'shopping_bag' },
        { path: '/cadastro/servicos', label: 'Serviços', icon: 'build' },
        { path: '/cadastro/vendedores', label: 'Vendedores', icon: 'badge' },
        { path: '/cadastro/embalagens', label: 'Embalagens', icon: 'package_2' },
        { path: '/cadastro/aparelhos', label: 'Aparelhos', icon: 'smartphone' },
      ]
    },
    { path: '/integracoes', label: 'Integrações', icon: 'integration_instructions' },
  ];

  const bottomItems = [
    { path: '/configuracoes', label: 'Configurações', icon: 'settings' },
  ];

  React.useEffect(() => {
    const newOpen: { [key: string]: boolean } = {};
    menuItems.forEach(item => {
      if (item.children && location.pathname.startsWith(item.path)) {
        newOpen[item.path] = true;
      }
    });
    setMenusOpen(newOpen);
  }, [location.pathname]);

  const toggleMenu = (path: string) => {
    if (isMinimized) setIsMinimized(false);
    setMenusOpen(prev => ({ ...prev, [path]: !prev[path] }));
  };

  const isPathActive = (path: string) => {
    if (path === '/' && location.pathname !== '/') return false;
    return location.pathname.startsWith(path);
  };

  return (
    <div
      className={`flex flex-col md:flex-row md:flex-col border-t md:border-t-0 border-[#1e242b] md:border-r bg-[#13191f] h-16 md:h-full transition-all duration-300 z-50 shrink-0 w-full md:w-auto ${
        isMinimized ? 'md:w-20' : 'md:w-64'
      }`}
    >
      <div className="flex flex-row md:flex-col h-full w-full p-2 md:p-4 items-center md:items-stretch overflow-visible">
        {/* Profile / Header (Desktop Only) */}
        <div className={`hidden md:flex gap-3 mb-8 items-center ${isMinimized ? 'flex-col justify-center p-0' : 'p-2'} relative group/header`}>
          <div
            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 shadow-lg shrink-0 cursor-pointer hover:ring-2 ring-primary transition-all"
            style={{ backgroundImage: `url('https://picsum.photos/seed/admin/200')` }}
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? "Expandir Menu" : "Perfil"}
          ></div>

          {!isMinimized && (
            <div className="flex flex-col overflow-hidden">
              <h1 className="text-white text-sm font-bold leading-tight truncate">King Carcaças</h1>
              <p className="text-slate-500 text-xs font-normal truncate">Admin Técnico</p>
            </div>
          )}

          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className={`
              flex items-center justify-center p-1.5 rounded-lg transition-all
              text-slate-400 hover:text-white hover:bg-slate-800
              ${isMinimized ? 'mt-2' : 'ml-auto'}
            `}
            title={isMinimized ? "Expandir" : "Recolher"}
          >
            <span className="material-symbols-outlined text-[20px]">
              {isMinimized ? 'last_page' : 'first_page'}
            </span>
          </button>
        </div>

        {/* Navigation */}
        <div className="flex flex-row md:flex-col gap-1 md:gap-2 flex-1 overflow-x-auto md:overflow-y-auto overflow-y-visible md:overflow-x-hidden w-full items-center justify-start md:items-stretch md:mb-0 scrollbar-hide shrink-0">
          {menuItems.map(item => {
            const hasChildren = item.children && item.children.length > 0;
            const isActive = isPathActive(item.path);
            const isOpen = menusOpen[item.path];

            const activeClass = "bg-[#1e242b] text-blue-500";
            const inactiveClass = "text-slate-400 hover:bg-[#1e242b] hover:text-slate-200";

            return (
              <div key={item.path} className="flex flex-col shrink-0">
                {hasChildren ? (
                  <button
                    onClick={() => toggleMenu(item.path)}
                    className={`flex items-center justify-center md:justify-between p-2 md:px-3 md:py-2.5 rounded-lg transition-all group w-[68px] md:w-full ${isActive ? activeClass : inactiveClass
                      }`}
                    title={isMinimized ? item.label : undefined}
                  >
                    <div className={`flex flex-col md:flex-row items-center gap-1 md:gap-3 ${isMinimized ? 'justify-center w-full' : ''}`}>
                      <span className={`material-symbols-outlined text-[24px] md:text-[20px] ${isActive ? 'fill-1' : ''}`}>
                        {item.icon}
                      </span>
                      <p className={`text-[10px] md:text-sm mt-0.5 md:mt-0 ${isMinimized ? 'block md:hidden' : 'block'} ${isActive ? 'font-bold' : 'font-medium'} truncate w-full text-center md:text-left leading-tight`}>
                        {item.label}
                      </p>
                    </div>
                    {!isMinimized && (
                      <span className="hidden md:block material-symbols-outlined text-sm transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                        expand_more
                      </span>
                    )}
                  </button>
                ) : (
                  <Link
                    to={item.path}
                    className={`flex flex-col md:flex-row items-center gap-1 md:gap-3 p-2 md:px-3 md:py-2.5 rounded-lg transition-all group w-[68px] md:w-full ${isActive ? activeClass : inactiveClass
                      } ${isMinimized ? 'justify-center' : ''}`}
                    title={isMinimized ? item.label : undefined}
                  >
                    <span className={`material-symbols-outlined text-[24px] md:text-[20px] ${isActive ? 'fill-1' : ''}`}>
                      {item.icon}
                    </span>
                    <p className={`text-[10px] md:text-sm mt-0.5 md:mt-0 ${isMinimized ? 'block md:hidden' : 'block'} ${isActive ? 'font-bold' : 'font-medium'} truncate w-full text-center md:text-left leading-tight`}>
                      {item.label}
                    </p>
                  </Link>
                )}

                {/* Submenu */}
                {hasChildren && isOpen && (
                  <>
                    {!isMinimized && (
                      <div className="hidden md:flex flex-col gap-1 ml-4 border-l border-[#1e242b] pl-2 mt-1">
                        {item.children!.map(sub => {
                          const isSubActive = location.pathname === sub.path;
                          return (
                            <Link
                              key={sub.path}
                              to={sub.path}
                              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all group ${isSubActive
                                ? 'text-blue-500 bg-[#1e242b] font-semibold'
                                : 'text-slate-500 hover:text-slate-300'
                                }`}
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                {sub.icon}
                              </span>
                              <p className="text-xs">{sub.label}</p>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                    
                    {/* Mobile popup submenu */}
                    <div className="md:hidden fixed bottom-16 left-0 right-0 bg-[#0e1217] border-t border-[#1e242b] flex flex-row overflow-x-auto p-2 gap-2 shadow-2xl z-40">
                      <div className="flex items-center gap-2 px-2">
                        {item.children!.map(sub => {
                          const isSubActive = location.pathname === sub.path;
                          return (
                            <Link
                              key={sub.path}
                              to={sub.path}
                              className={`flex flex-col items-center justify-center p-2 rounded-lg shrink-0 w-20 transition-all ${
                                isSubActive ? 'bg-[#1e242b] text-blue-500' : 'text-slate-400 hover:bg-[#1e242b] hover:text-slate-200'
                              }`}
                              onClick={() => setMenusOpen({})}
                            >
                              <span className="material-symbols-outlined text-[20px] mb-1">{sub.icon}</span>
                              <span className="text-[10px] text-center leading-tight">{sub.label}</span>
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
          
          <div className="md:hidden h-8 w-px bg-[#1e242b] mx-1 shrink-0"></div>

          {/* Bottom Items on Mobile included in horizontal scroll */}
          {bottomItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className="md:hidden flex flex-col items-center justify-center p-2 rounded-lg text-slate-400 hover:bg-[#1e242b] hover:text-slate-200 transition-colors group shrink-0 w-[68px]"
            >
              <span className="material-symbols-outlined text-[24px]">
                {item.icon}
              </span>
              <p className="text-[10px] mt-0.5 font-medium truncate w-full text-center leading-tight">
                {item.label}
              </p>
            </Link>
          ))}

          <button
            onClick={async () => {
              const { error } = await supabase.auth.signOut();
              if (error) console.error('Error signing out:', error);
            }}
            className="md:hidden flex flex-col items-center justify-center p-2 rounded-lg text-red-500 hover:bg-red-900/10 transition-colors shrink-0 w-[68px]"
          >
            <span className="material-symbols-outlined text-[24px]">logout</span>
            <p className="text-[10px] mt-0.5 font-medium truncate w-full text-center leading-tight">Sair</p>
          </button>
        </div>

        {/* Exchange Rate */}
        {!isMinimized && (
          <div className="hidden md:block mt-auto mb-2 px-3 py-2 bg-slate-800/30 rounded-xl border border-slate-800/50 group/rate animate-in fade-in slide-in-from-bottom-2 duration-700">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Dólar Comercial</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-white font-black text-lg">
                {rateLoading ? '...' : `R$ ${rate?.toFixed(2)}`}
              </span>
              <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-1 rounded">Live</span>
            </div>
          </div>
        )}

        {isMinimized && (
           <div className="hidden md:flex mt-auto mb-2 justify-center py-2" title={`Dólar: R$ ${rate?.toFixed(2)}`}>
              <span className="material-symbols-outlined text-emerald-500 text-[20px] animate-pulse">
                attach_money
              </span>
           </div>
        )}

        {/* Bottom (Desktop Only) */}
        <div className="hidden md:flex border-t border-[#1e242b] pt-4 flex-col gap-1">
          {bottomItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-[#1e242b] hover:text-slate-200 transition-colors group ${isMinimized ? 'justify-center' : ''}`}
              title={isMinimized ? item.label : undefined}
            >
              <span className="material-symbols-outlined text-[20px]">
                {item.icon}
              </span>
              {!isMinimized && <p className="text-sm font-medium">{item.label}</p>}
            </Link>
          ))}

          <button
            onClick={async () => {
              const { error } = await supabase.auth.signOut();
              if (error) console.error('Error signing out:', error);
            }}
            className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-900/10 transition-colors ${isMinimized ? 'justify-center' : ''}`}
            title={isMinimized ? 'Sair' : undefined}
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            {!isMinimized && <p className="text-sm font-medium">Sair</p>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
