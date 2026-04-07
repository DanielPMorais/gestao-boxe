import { useState, useEffect } from 'react';
import { UserPlus, Activity, CreditCard, TrendingUp, RefreshCw } from 'lucide-react';

export const Dashboard = () => {
  const [metrics, setMetrics] = useState({
    active_students: 0,
    today_checkins: 0,
    expected_revenue: 0,
    late_invoices: 0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch('http://localhost:8000/api/dashboard/metrics');
      if (!response.ok) throw new Error('Falha ao buscar dados');
      const data = await response.json();
      setMetrics(data);
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return (
    <div className="flex flex-col w-full h-full gap-8">
      
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 w-full">
        <div>
          <h1 className="font-display font-bold text-3xl md:text-4xl text-white">Visão Geral</h1>
          <p className="text-gray-400 mt-1">Métricas de performance da academia em tempo real</p>
        </div>
        <button 
          className="btn-primary w-full md:w-auto" 
          onClick={fetchMetrics} 
          disabled={loading}
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          Atualizar Dados
        </button>
      </header>

      {error ? (
        <div className="glass-panel p-8 text-center text-boxing-primary border-boxing-primary/20 bg-boxing-primary/5">
          <h3 className="font-display font-semibold text-xl mb-2">Erro ao tentar conectar à API.</h3>
          <p className="text-gray-300">O container do backend está rodando? Verifique pelo docker-compose se a API está online na porta 8000.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 w-full">
          {/* Metric 1 */}
          <div className={`glass-panel p-6 flex flex-col gap-4 transition-all hover:-translate-y-1 hover:border-white/15 ${loading ? 'opacity-60' : 'opacity-100'}`}>
            <div className="flex justify-between items-center text-gray-400 font-medium text-sm">
              <span>Alunos Ativos</span>
              <div className="p-2 rounded-lg bg-white/5 text-white"><Activity size={20} /></div>
            </div>
            <div className="font-display font-bold text-4xl text-white">{loading ? "-" : metrics.active_students}</div>
            <div className="text-xs text-gray-400 flex items-center gap-1.5">
              <span className="text-emerald-500 font-semibold">Atual</span>
              <span>Em Planos Ativos</span>
            </div>
          </div>

          {/* Metric 2 */}
          <div className={`glass-panel p-6 flex flex-col gap-4 transition-all hover:-translate-y-1 hover:border-white/15 ${loading ? 'opacity-60' : 'opacity-100'}`}>
            <div className="flex justify-between items-center text-gray-400 font-medium text-sm">
              <span>Check-ins Hoje</span>
              <div className="p-2 rounded-lg bg-white/5 text-white"><UserPlus size={20} /></div>
            </div>
            <div className="font-display font-bold text-4xl text-white">{loading ? "-" : metrics.today_checkins}</div>
            <div className="text-xs text-gray-400 flex items-center gap-1.5">
              <span className="text-emerald-500 font-semibold">Corrente</span>
              <span>Nesta exata data</span>
            </div>
          </div>

          {/* Metric 3 */}
          <div className={`glass-panel p-6 flex flex-col gap-4 transition-all hover:-translate-y-1 hover:border-white/15 ${loading ? 'opacity-60' : 'opacity-100'}`}>
            <div className="flex justify-between items-center text-gray-400 font-medium text-sm">
              <span>Receita Prevista</span>
              <div className="p-2 rounded-lg bg-white/5 text-white"><TrendingUp size={20} /></div>
            </div>
            <div className="font-display font-bold text-3xl md:text-4xl text-white truncate" title={loading ? "-" : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.expected_revenue)}>
              {loading ? "-" : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(metrics.expected_revenue)}
            </div>
            <div className="text-xs text-gray-400 flex items-center gap-1.5">
              <span className="text-emerald-500 font-semibold">Mensal</span>
              <span>Neste mês corrente</span>
            </div>
          </div>

          {/* Metric 4 */}
          <div className={`glass-panel p-6 flex flex-col gap-4 transition-all hover:-translate-y-1 hover:border-white/15 ${loading ? 'opacity-60' : 'opacity-100'}`}>
            <div className="flex justify-between items-center text-gray-400 font-medium text-sm">
              <span>Faturas Atrasadas</span>
              <div className="p-2 rounded-lg bg-white/5 text-white"><CreditCard size={20} /></div>
            </div>
            <div className="font-display font-bold text-4xl text-boxing-primary">{loading ? "-" : metrics.late_invoices}</div>
            <div className="text-xs text-gray-400 flex items-center gap-1.5">
              <span className={`font-semibold ${metrics.late_invoices > 0 ? "text-red-500" : "text-emerald-500"}`}>
                {metrics.late_invoices > 0 ? "Atenção" : "Excelente"}
              </span>
              <span>Alunos bloqueados</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
