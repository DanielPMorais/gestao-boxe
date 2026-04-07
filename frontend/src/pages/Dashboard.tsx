import { UserPlus, Activity, CreditCard, TrendingUp } from 'lucide-react';

export const Dashboard = () => {
  return (
    <>
      <header className="page-header">
        <div>
          <h1>Visão Geral</h1>
          <p>Métricas de performance da academia</p>
        </div>
        <button className="btn-primary">
          <UserPlus size={18} />
          Novo Matrícula
        </button>
      </header>

      <div className="dashboard-grid">
        {/* Metric 1 */}
        <div className="card glass-panel">
          <div className="metric-header">
            <span>Alunos Ativos</span>
            <div className="metric-header-icon"><Activity size={20} /></div>
          </div>
          <div className="metric-value">142</div>
          <div className="metric-footer">
            <span className="metric-trend positive">+12%</span>
            <span>neste mês</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="card glass-panel">
          <div className="metric-header">
            <span>Check-ins Hoje</span>
            <div className="metric-header-icon"><UserPlus size={20} /></div>
          </div>
          <div className="metric-value">38</div>
          <div className="metric-footer">
            <span className="metric-trend positive">+5%</span>
            <span>vs ontem</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="card glass-panel">
          <div className="metric-header">
            <span>Receita Prevista</span>
            <div className="metric-header-icon"><TrendingUp size={20} /></div>
          </div>
          <div className="metric-value">R$ 14.500</div>
          <div className="metric-footer">
            <span className="metric-trend positive">+8%</span>
            <span>neste mês</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="card glass-panel">
          <div className="metric-header">
            <span>Faturas Atrasadas</span>
            <div className="metric-header-icon"><CreditCard size={20} /></div>
          </div>
          <div className="metric-value" style={{ color: "var(--primary)" }}>8</div>
          <div className="metric-footer">
            <span className="metric-trend negative">Atenção</span>
            <span>Alunos bloqueados</span>
          </div>
        </div>
      </div>
      
      {/* Aqui virão componentes adicionais como graficos ou ultimos matriculados */}
    </>
  );
};
