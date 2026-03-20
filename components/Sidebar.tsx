import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabase';

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
  const [isMinimized, setIsMinimized] = useState(false);
  const [menusOpen, setMenusOpen] = useState<{ [key: string]: boolean }>({});

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
      className={`flex flex-col border-r border-[#1e242b] bg-[#13191f] h-full transition-all duration-300 z-50 shrink-0 ${isMinimized ? 'w-20' : 'w-64'
        }`}
    >
      <div className="flex flex-col h-full p-4">
        {/* Profile / Header */}
        <div className={`flex gap-3 mb-8 items-center ${isMinimized ? 'flex-col justify-center p-0' : 'p-2'} relative group/header`}>
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
        <div className="flex flex-col gap-2 flex-1 overflow-y-auto overflow-x-hidden">
          {menuItems.map(item => {
            const hasChildren = item.children && item.children.length > 0;
            const isActive = isPathActive(item.path);
            const isOpen = menusOpen[item.path];

            // Styles matching the image:
            // Active: Dark blue background, Blue Text/Icon.
            // Inactive: Text slate-400, Icon slate-400.

            const activeClass = "bg-[#1e242b] text-blue-500";
            const inactiveClass = "text-slate-400 hover:bg-[#1e242b] hover:text-slate-200";

            return (
              <div key={item.path} className="flex flex-col">
                {hasChildren ? (
                  <button
                    onClick={() => toggleMenu(item.path)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-all group w-full ${isActive ? activeClass : inactiveClass
                      }`}
                    title={isMinimized ? item.label : undefined}
                  >
                    <div className={`flex items-center gap-3 ${isMinimized ? 'justify-center w-full' : ''}`}>
                      <span className={`material-symbols-outlined text-[20px] ${isActive ? 'fill-1' : ''}`}>
                        {item.icon}
                      </span>
                      {!isMinimized && (
                        <p className={`text-sm ${isActive ? 'font-bold' : 'font-medium'}`}>{item.label}</p>
                      )}
                    </div>
                    {!isMinimized && (
                      <span className="material-symbols-outlined text-sm transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                        expand_more
                      </span>
                    )}
                  </button>
                ) : (
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${isActive ? activeClass : inactiveClass
                      } ${isMinimized ? 'justify-center' : ''}`}
                    title={isMinimized ? item.label : undefined}
                  >
                    <span className={`material-symbols-outlined text-[20px] ${isActive ? 'fill-1' : ''}`}>
                      {item.icon}
                    </span>
                    {!isMinimized && (
                      <p className={`text-sm ${isActive ? 'font-bold' : 'font-medium'}`}>{item.label}</p>
                    )}
                  </Link>
                )}

                {/* Submenu */}
                {hasChildren && isOpen && !isMinimized && (
                  <div className="flex flex-col gap-1 ml-4 border-l border-[#1e242b] pl-2 mt-1">
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
              </div>
            );
          })}
        </div>

        {/* Bottom */}
        <div className="mt-auto border-t border-[#1e242b] pt-4 flex flex-col gap-1">
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
