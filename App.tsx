import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Sidebar from './components/Sidebar';
import Dashboard from './components/dashboard/Dashboard';
import OSList from './components/OSList';
import OSForm from './components/OSForm';
import ProductList from './components/products/ProductList';
import ProductForm from './components/products/ProductForm';
import ServiceList from './components/cadastro/ServiceList';
import DeviceList from './components/cadastro/DeviceList';
import StockEntryForm from './components/cadastro/StockEntryForm';
import PurchaseOrderList from './components/cadastro/PurchaseOrderList';
import { VendedorList } from './components/cadastro/VendedorList';
import { EmbalagemList } from './components/cadastro/EmbalagemList';
import ClientCRM from './components/crm/ClientCRM';
import PDV from './components/sales/PDV';
import SaleList from './components/sales/SaleList';
import Inventory from './components/Inventory';
import Agenda from './components/Agenda';
import StrategicPage from './components/notes/StrategicPage';
import PlaceholderPage from './components/PlaceholderPage';
import IntegrationsList from './components/integrations/IntegrationsList';


import { supabase } from './services/supabase';
import { Session } from '@supabase/supabase-js';
import { ServiceOrder } from './types';
import { orderService } from './services/orderService';

const AppContent: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAppInitialized, setIsAppInitialized] = useState(false); // Added
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        loadOrders();
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (session) {
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          loadOrders();
        } else {
          // Mark as initialized even on refreshes if we already have session
          setIsAppInitialized(true);
        }
      } else {
        setLoading(false);
        setIsAppInitialized(true);
        setOrders([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadOrders = async (startDate?: string, endDate?: string) => {
    const isInitial = !isAppInitialized;
    try {
      if (isInitial) setLoading(true);
      const data = await orderService.getAll(startDate, endDate);
      setOrders(data);
    } catch (error) {
      console.error('Failed to load orders', error);
      if (isInitial) alert('Erro ao carregar ordens de serviço. Verifique a conexão.');
    } finally {
      setIsAppInitialized(true);
      setLoading(false);
    }
  };

  const handleSaveOrder = async (order: ServiceOrder) => {
    try {
      const exists = orders.find(o => o.id === order.id);

      if (exists) {
        const updated = await orderService.update(order);
        setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
      } else {
        const created = await orderService.create(order);
        setOrders(prev => [created, ...prev]);
      }
    } catch (error: any) {
      console.error('Failed to save order', error);
      alert(`Erro ao salvar ordem de serviço: ${error.message || 'Erro desconhecido'}`);
      throw error;
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta ordem?')) return;

    try {
      await orderService.delete(id);
      setOrders(prev => prev.filter(o => o.id !== id));
    } catch (error) {
      console.error('Failed to delete order', error);
      alert('Erro ao excluir ordem de serviço.');
    }
  };

  if (loading && !isAppInitialized) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background-light dark:bg-background-dark text-slate-500">
        <div className="flex flex-col items-center gap-2">
          <span className="material-symbols-outlined animate-spin text-4xl">sync</span>
          <p>Carregando sistema...</p>
        </div>
      </div>
    );
  }

  const isAuthPage = ['/login', '/register'].includes(location.pathname);

  // If not logged in and not on auth page, redirect to login
  if (!session && !isAuthPage) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  // If not logged in but on auth page, show the auth page (no sidebar)
  if (!session && isAuthPage) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  // If logged in, always show sidebar (unless we want to hide it on some specific pages)
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar />
      <main className="flex-1 h-full overflow-y-auto bg-background-light dark:bg-background-dark">
        <Routes>
          {/* Redirect to dashboard if logged in and trying to access auth pages */}
          <Route path="/login" element={<Dashboard />} />
          <Route path="/register" element={<Dashboard />} />

          <Route path="/" element={<Dashboard />} />
          {/* Vendas and Orders */}
          <Route path="/vendas/ordens" element={<OSList orders={orders} onDelete={handleDeleteOrder} onRefresh={loadOrders} />} />
          <Route path="/vendas/ordens/nova" element={<OSForm onSave={handleSaveOrder} />} />
          <Route path="/vendas/ordens/editar/:id" element={<OSForm orders={orders} onSave={handleSaveOrder} />} />
          <Route path="/vendas/pedidos" element={<SaleList />} />
          <Route path="/vendas" element={<PDV />} />

          {/* Cadastro Routes */}
          <Route path="/cadastro/clientes" element={<ClientCRM />} />

          {/* Products */}
          <Route path="/cadastro/produtos" element={<ProductList />} />
          <Route path="/cadastro/aparelhos" element={<DeviceList />} />
          <Route path="/cadastro/produtos/novo" element={<ProductForm />} />
          <Route path="/cadastro/produtos/editar/:id" element={<ProductForm />} />
          <Route path="/cadastro/entradas" element={<PurchaseOrderList />} />
          <Route path="/cadastro/entrada-estoque" element={<PurchaseOrderList />} />
          <Route path="/cadastro/entradas/nova" element={<StockEntryForm />} />
          <Route path="/cadastro/entradas/editar/:id" element={<StockEntryForm />} />

          <Route path="/estoque" element={<Inventory />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/estrategico" element={<StrategicPage />} />

          <Route path="/cadastro" element={<PlaceholderPage title="Cadastro" />} />
          <Route path="/cadastro/servicos" element={<ServiceList />} />

          <Route path="/cadastro/vendedores" element={<VendedorList />} />
          <Route path="/cadastro/embalagens" element={<EmbalagemList />} />

          {/* Integrations */}
          <Route path="/integracoes" element={<IntegrationsList />} />

          <Route path="*" element={<Dashboard />} />
        </Routes>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
};

export default App;
