import React, { useState, useEffect } from 'react';
import { PurchaseOrder } from '../../types';
import { stockService } from '../../services/stockService';
import { generatePurchaseOrderPDF } from '../../services/pdfService';
import { useNavigate } from 'react-router-dom';

const PurchaseOrderList: React.FC = () => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await stockService.getPurchaseOrders();
      setOrders(data);
    } catch (error) {
      console.error('Failed to load orders', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <span className="material-symbols-outlined animate-spin text-4xl text-slate-400">sync</span>
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Histórico de Importações</h1>
          <p className="text-slate-400 text-sm">Gerencie suas entradas avançadas e imprima recibos</p>
        </div>
        <button
          onClick={() => navigate('/cadastro/entradas/nova')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Nova Entrada
        </button>
      </div>

      <div className="bg-[#13191f] border border-[#1e242b] rounded-xl flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0e1217] text-slate-400 text-xs uppercase border-b border-[#1e242b]">
                <th className="p-4 font-semibold">Data</th>
                <th className="p-4 font-semibold">Cancel.&nbsp;/&nbsp;ID</th>
                <th className="p-4 font-semibold">Fornecedor</th>
                <th className="p-4 font-semibold text-right">Qtd Produtos</th>
                <th className="p-4 font-semibold text-right">Total (USD)</th>
                <th className="p-4 font-semibold text-right">Cotação (R$)</th>
                <th className="p-4 font-semibold">Status / Rastreio</th>
                <th className="p-4 font-semibold text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center p-8 text-slate-500">
                    Nenhuma entrada avançada registrada ainda.
                  </td>
                </tr>
              ) : (
                orders.map(order => (
                  <tr key={order.id} className="border-b border-[#1e242b] hover:bg-[#1a2129] transition-colors text-slate-300">
                    <td className="p-4">
                      {new Date(order.date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-4 text-xs font-mono text-slate-500">
                      {order.id.split('_')[1] || order.id}
                    </td>
                    <td className="p-4 font-medium text-white">
                      {order.supplier}
                    </td>
                    <td className="p-4 text-right">
                      <span className="bg-[#1e242b] px-2 py-1 rounded text-xs font-medium">
                        {order.products.length} itens
                      </span>
                    </td>
                    <td className="p-4 text-right font-semibold text-blue-400">
                      $ {order.totalOrderUsd.toFixed(2)}
                    </td>
                    <td className="p-4 text-right text-emerald-400">
                      R$ {order.usdQuote.toFixed(2)}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            order.packages.every(p => p.status === 'Recebido') ? 'bg-emerald-500' : 'bg-red-500'
                          }`} />
                          <span className="text-xs font-bold text-slate-300">
                            {order.packages.filter(p => p.status === 'Recebido').length}/{order.packages.length} Chegou
                          </span>
                        </div>
                        {order.packages.some(p => p.trackingNumber) && (
                          <div className="text-[10px] text-slate-500 font-mono truncate max-w-[120px]" title={order.packages.map(p => p.trackingNumber).filter(Boolean).join(', ')}>
                            {order.packages.map(p => p.trackingNumber).filter(Boolean).join(', ')}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => navigate(`/cadastro/entradas/editar/${order.id}`)}
                          className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                          title="Editar Entrada"
                        >
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button
                          onClick={() => generatePurchaseOrderPDF(order)}
                          className="p-2 text-slate-400 hover:text-white hover:bg-[#2b333c] rounded-lg transition-colors"
                          title="Baixar PDF"
                        >
                          <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderList;
