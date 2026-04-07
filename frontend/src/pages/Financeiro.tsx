import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, Clock, AlertTriangle, TrendingUp, Loader2, RefreshCw, CheckCheck } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
type InvoiceStatus = 'PENDING' | 'PAID' | 'LATE';

type Invoice = {
  id: string;
  enrollment_id: string;
  amount: number;
  due_date: string;
  payment_date: string | null;
  status: InvoiceStatus;
  enrollment?: {
    student?: { user?: { full_name: string } };
    plan?: { name: string };
  };
};

type Summary = {
  total_paid_month: number;
  total_pending_month: number;
  total_late_all: number;
  count_late: number;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const BRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('pt-BR');

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; badge: string; icon: React.ReactNode }> = {
  PAID:    { label: 'Paga',      badge: 'bg-emerald-500/15 text-emerald-400', icon: <CheckCircle2 size={13} /> },
  PENDING: { label: 'Pendente',  badge: 'bg-amber-500/15 text-amber-400',     icon: <Clock size={13} /> },
  LATE:    { label: 'Atrasada',  badge: 'bg-red-500/15 text-red-400',         icon: <AlertTriangle size={13} /> },
};

const FILTER_TABS: { key: 'ALL' | InvoiceStatus; label: string }[] = [
  { key: 'ALL',     label: 'Todas' },
  { key: 'PENDING', label: 'Pendentes' },
  { key: 'LATE',    label: 'Atrasadas' },
  { key: 'PAID',    label: 'Pagas' },
];

// ─── Component ───────────────────────────────────────────────────────────────
export const Financeiro = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [paying, setPaying] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | InvoiceStatus>('ALL');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [invRes, sumRes] = await Promise.all([
        fetch('http://localhost:8000/api/invoices/'),
        fetch('http://localhost:8000/api/invoices/summary'),
      ]);
      if (invRes.ok) setInvoices(await invRes.json());
      if (sumRes.ok) setSummary(await sumRes.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSyncLate = async () => {
    setSyncing(true);
    await fetch('http://localhost:8000/api/invoices/sync-late', { method: 'POST' });
    await fetchData();
    setSyncing(false);
  };

  const handlePay = async (id: string) => {
    if (!confirm('Confirmar o pagamento desta fatura?')) return;
    setPaying(id);
    try {
      const res = await fetch(`http://localhost:8000/api/invoices/${id}/pay`, { method: 'PATCH' });
      if (!res.ok) { const e = await res.json(); alert(e.detail); return; }
      await fetchData();
    } finally {
      setPaying(null);
    }
  };

  const filtered = filter === 'ALL' ? invoices : invoices.filter(i => i.status === filter);

  const summaryCards = summary ? [
    {
      label: 'Recebido este mês',
      value: BRL(summary.total_paid_month),
      icon: <TrendingUp size={20} />,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Previsto (pendentes)',
      value: BRL(summary.total_pending_month),
      icon: <Clock size={20} />,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
    {
      label: 'Em atraso (total)',
      value: BRL(summary.total_late_all),
      icon: <AlertTriangle size={20} />,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
    },
    {
      label: 'Faturas atrasadas',
      value: summary.count_late.toString(),
      icon: <AlertTriangle size={20} />,
      color: summary.count_late > 0 ? 'text-red-400' : 'text-emerald-400',
      bg: summary.count_late > 0 ? 'bg-red-500/10' : 'bg-emerald-500/10',
    },
  ] : [];

  return (
    <div className="flex flex-col w-full gap-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl md:text-4xl text-white">Financeiro</h1>
          <p className="text-gray-400 mt-1">Controle de mensalidades e faturas da academia</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={handleSyncLate}
            disabled={syncing || loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 transition-all text-sm font-medium disabled:opacity-50"
          >
            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
            Sincronizar Atrasos
          </button>
          <button
            onClick={fetchData}
            disabled={loading}
            className="btn-primary"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Atualizar
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-panel p-5 h-28 animate-pulse bg-white/5" />
            ))
          : summaryCards.map((card, i) => (
              <div key={i} className="glass-panel p-5 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400 font-medium">{card.label}</span>
                  <div className={`p-2 rounded-lg ${card.bg} ${card.color}`}>{card.icon}</div>
                </div>
                <p className={`font-display font-bold text-2xl ${card.color}`}>{card.value}</p>
              </div>
            ))}
      </div>

      {/* Filter tabs + Table */}
      <div className="glass-panel overflow-hidden flex flex-col">
        {/* Filter tabs */}
        <div className="flex gap-1 p-3 border-b border-white/5 overflow-x-auto">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                filter === tab.key
                  ? 'bg-boxing-primary text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
              {tab.key !== 'ALL' && (
                <span className="ml-2 text-xs opacity-70">
                  {invoices.filter(i => i.status === tab.key).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="text-xs uppercase bg-black/20 text-gray-500">
              <tr>
                <th className="px-6 py-4 font-medium tracking-wider">Aluno</th>
                <th className="px-6 py-4 font-medium tracking-wider">Plano</th>
                <th className="px-6 py-4 font-medium tracking-wider">Valor</th>
                <th className="px-6 py-4 font-medium tracking-wider">Vencimento</th>
                <th className="px-6 py-4 font-medium tracking-wider">Pagamento</th>
                <th className="px-6 py-4 font-medium tracking-wider">Status</th>
                <th className="px-6 py-4 font-medium tracking-wider text-right">Ação</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500">
                    <Loader2 className="animate-spin inline-block mr-2" size={18} />
                    Carregando faturas...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500">
                    Nenhuma fatura encontrada neste filtro.
                  </td>
                </tr>
              ) : (
                filtered.map(inv => {
                  const cfg = STATUS_CONFIG[inv.status];
                  const isOverdue = inv.status === 'LATE';
                  const studentName = inv.enrollment?.student?.user?.full_name;
                  const planName = inv.enrollment?.plan?.name;

                  return (
                    <tr
                      key={inv.id}
                      className={`border-b border-white/5 hover:bg-white/5 transition-colors ${isOverdue ? 'bg-red-500/3' : ''}`}
                    >
                      <td className="px-6 py-4 font-medium text-white">
                        {studentName ?? (
                          <span className="text-gray-500 font-mono text-xs">
                            {inv.enrollment_id.slice(0, 8)}…
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-xs">
                        {planName ?? '—'}
                      </td>
                      <td className="px-6 py-4 font-display font-semibold text-white">
                        {BRL(inv.amount)}
                      </td>
                      <td className={`px-6 py-4 text-xs ${isOverdue ? 'text-red-400 font-semibold' : 'text-gray-400'}`}>
                        {fmtDate(inv.due_date)}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400">
                        {inv.payment_date ? fmtDate(inv.payment_date) : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.badge}`}>
                          {cfg.icon}
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {inv.status !== 'PAID' && (
                          <button
                            onClick={() => handlePay(inv.id)}
                            disabled={paying === inv.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors disabled:opacity-50"
                          >
                            {paying === inv.id
                              ? <Loader2 size={13} className="animate-spin" />
                              : <CheckCheck size={13} />}
                            Registrar Pagto.
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {!loading && (
          <div className="px-6 py-3 border-t border-white/5 text-xs text-gray-500 flex justify-between">
            <span>{filtered.length} fatura{filtered.length !== 1 ? 's' : ''}</span>
            {filter !== 'ALL' && (
              <button onClick={() => setFilter('ALL')} className="hover:text-white transition-colors">
                Ver todas
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
