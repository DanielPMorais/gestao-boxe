import { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, X, BookOpen, ClipboardList, Calendar, Zap } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
type Plan = {
  id: string;
  name: string;
  price: number;
  duration_days: number;
  access_limit_per_week: number;
};

type Student = {
  id: string;
  user: { full_name: string; cpf: string };
};

type Enrollment = {
  id: string;
  student_id: string;
  plan_id: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  student?: { user?: { full_name: string } };
  plan?: { name: string; price: number };
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const BRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const input =
  'w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white outline-none focus:border-boxing-primary transition-colors text-sm';

// ─── Plan Card ────────────────────────────────────────────────────────────────
const PlanCard = ({ plan, onDelete }: { plan: Plan; onDelete: () => void }) => (
  <div className="glass-panel p-5 flex flex-col gap-3 hover:-translate-y-1 transition-transform">
    <div className="flex justify-between items-start gap-2">
      <h3 className="font-display font-bold text-white text-lg leading-tight">{plan.name}</h3>
      <button
        onClick={onDelete}
        className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
        title="Remover plano"
      >
        <Trash2 size={15} />
      </button>
    </div>
    <p className="font-display font-bold text-3xl text-boxing-primary">{BRL(plan.price)}<span className="text-sm font-normal text-gray-400">/mês</span></p>
    <div className="flex gap-4 text-xs text-gray-400 border-t border-white/5 pt-3">
      <span className="flex items-center gap-1.5"><Calendar size={13} /> {plan.duration_days} dias</span>
      <span className="flex items-center gap-1.5"><Zap size={13} /> {plan.access_limit_per_week}x/semana</span>
    </div>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
export const Planos = () => {
  const [tab, setTab] = useState<'planos' | 'matriculas'>('planos');

  // Plans state
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planForm, setPlanForm] = useState({ name: '', price: '', duration_days: '30', access_limit_per_week: '3' });
  const [planSubmitting, setPlanSubmitting] = useState(false);

  // Enrollments state
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [enrollLoading, setEnrollLoading] = useState(true);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [enrollForm, setEnrollForm] = useState({ student_id: '', plan_id: '', start_date: '' });
  const [enrollSubmitting, setEnrollSubmitting] = useState(false);

  // ── Fetches ──
  const fetchPlans = async () => {
    setPlansLoading(true);
    try {
      const r = await fetch('http://localhost:8000/api/plans/');
      if (r.ok) setPlans(await r.json());
    } finally { setPlansLoading(false); }
  };

  const fetchEnrollments = async () => {
    setEnrollLoading(true);
    try {
      const r = await fetch('http://localhost:8000/api/enrollments/');
      if (r.ok) setEnrollments(await r.json());
    } finally { setEnrollLoading(false); }
  };

  const fetchStudents = async () => {
    const r = await fetch('http://localhost:8000/api/students/');
    if (r.ok) setStudents(await r.json());
  };

  useEffect(() => { fetchPlans(); fetchEnrollments(); }, []);

  // ── Plan actions ──
  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setPlanSubmitting(true);
    try {
      const r = await fetch('http://localhost:8000/api/plans/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: planForm.name,
          price: parseFloat(planForm.price),
          duration_days: parseInt(planForm.duration_days),
          access_limit_per_week: parseInt(planForm.access_limit_per_week),
        }),
      });
      if (!r.ok) { const e = await r.json(); alert(`Erro: ${e.detail}`); return; }
      setShowPlanModal(false);
      setPlanForm({ name: '', price: '', duration_days: '30', access_limit_per_week: '3' });
      fetchPlans();
    } finally { setPlanSubmitting(false); }
  };

  const handleDeletePlan = async (id: string) => {
    if (!confirm('Remover este plano? Alunos matriculados não são afetados.')) return;
    await fetch(`http://localhost:8000/api/plans/${id}`, { method: 'DELETE' });
    fetchPlans();
  };

  // ── Enrollment actions ──
  const openEnrollModal = async () => {
    await fetchStudents();
    setEnrollForm({ student_id: '', plan_id: '', start_date: new Date().toISOString().slice(0, 10) });
    setShowEnrollModal(true);
  };

  const handleCreateEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnrollSubmitting(true);
    try {
      const r = await fetch('http://localhost:8000/api/enrollments/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: enrollForm.student_id,
          plan_id: enrollForm.plan_id,
          start_date: enrollForm.start_date,
          end_date: enrollForm.start_date, // back-end recalculates
          is_active: true,
        }),
      });
      if (!r.ok) { const e = await r.json(); alert(`Erro: ${e.detail}`); return; }
      setShowEnrollModal(false);
      fetchEnrollments();
    } finally { setEnrollSubmitting(false); }
  };

  // ── Tabs UI ──
  const tabCls = (t: 'planos' | 'matriculas') =>
    `font-display font-semibold px-5 py-2.5 rounded-lg transition-all text-sm ${
      tab === t
        ? 'bg-boxing-primary text-white shadow-[0_4px_16px_rgba(239,68,68,0.3)]'
        : 'text-gray-400 hover:text-white hover:bg-white/5'
    }`;

  return (
    <div className="flex flex-col w-full gap-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl md:text-4xl text-white">Planos & Matrículas</h1>
          <p className="text-gray-400 mt-1">Gerencie os planos da academia e as matrículas dos alunos</p>
        </div>
        <div className="flex gap-2">
          <button className={tabCls('planos')} onClick={() => setTab('planos')}>
            <BookOpen size={16} className="inline mr-2" />Planos
          </button>
          <button className={tabCls('matriculas')} onClick={() => setTab('matriculas')}>
            <ClipboardList size={16} className="inline mr-2" />Matrículas
          </button>
        </div>
      </header>

      {/* ── PLANOS TAB ── */}
      {tab === 'planos' && (
        <>
          <div className="flex justify-end">
            <button className="btn-primary" onClick={() => setShowPlanModal(true)}>
              <Plus size={18} /> Novo Plano
            </button>
          </div>

          {plansLoading ? (
            <div className="text-center text-gray-500 py-16"><Loader2 className="animate-spin inline-block" size={24} /></div>
          ) : plans.length === 0 ? (
            <div className="glass-panel p-12 text-center text-gray-500">
              <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
              <p>Nenhum plano cadastrado. Crie o primeiro!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map(p => (
                <PlanCard key={p.id} plan={p} onDelete={() => handleDeletePlan(p.id)} />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── MATRÍCULAS TAB ── */}
      {tab === 'matriculas' && (
        <>
          <div className="flex justify-end">
            <button className="btn-primary" onClick={openEnrollModal}>
              <Plus size={18} /> Nova Matrícula
            </button>
          </div>

          <div className="glass-panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="text-xs uppercase bg-black/20 text-gray-500">
                  <tr>
                    <th className="px-6 py-4 font-medium tracking-wider">Aluno</th>
                    <th className="px-6 py-4 font-medium tracking-wider">Plano</th>
                    <th className="px-6 py-4 font-medium tracking-wider">Início</th>
                    <th className="px-6 py-4 font-medium tracking-wider">Vencimento</th>
                    <th className="px-6 py-4 font-medium tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollLoading ? (
                    <tr><td colSpan={5} className="text-center py-10 text-gray-500">
                      <Loader2 className="animate-spin inline-block mr-2" size={18} />Carregando...
                    </td></tr>
                  ) : enrollments.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-10 text-gray-500">Nenhuma matrícula encontrada.</td></tr>
                  ) : (
                    enrollments.map(en => {
                      const isExp = new Date(en.end_date) < new Date();
                      const active = en.is_active && !isExp;
                      return (
                        <tr key={en.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 font-medium text-white">
                            {en.student?.user?.full_name ?? <span className="text-gray-500 font-mono text-xs">{en.student_id.slice(0,8)}…</span>}
                          </td>
                          <td className="px-6 py-4">
                            <div>{en.plan?.name ?? <span className="text-gray-500 font-mono text-xs">{en.plan_id.slice(0,8)}…</span>}</div>
                            {en.plan && <div className="text-xs text-boxing-primary mt-0.5">{BRL(en.plan.price)}</div>}
                          </td>
                          <td className="px-6 py-4 text-gray-400 text-xs">{new Date(en.start_date).toLocaleDateString('pt-BR')}</td>
                          <td className="px-6 py-4 text-gray-400 text-xs">{new Date(en.end_date).toLocaleDateString('pt-BR')}</td>
                          <td className="px-6 py-4">
                            {active ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Ativa
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-500/15 text-gray-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />{isExp ? 'Expirada' : 'Inativa'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {!enrollLoading && (
              <div className="px-6 py-3 border-t border-white/5 text-xs text-gray-500">
                {enrollments.length} matrícula{enrollments.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Modal Novo Plano ── */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPlanModal(false)} />
          <div className="relative bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8"
            style={{ animation: 'fadeIn 0.15s ease-out' }}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display text-2xl font-bold text-white">Novo Plano</h2>
              <button onClick={() => setShowPlanModal(false)} className="text-gray-400 hover:text-white"><X size={22} /></button>
            </div>
            <form onSubmit={handleCreatePlan} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Nome do Plano *</label>
                <input required type="text" value={planForm.name}
                  onChange={e => setPlanForm({ ...planForm, name: e.target.value })}
                  className={input} placeholder="Ex: Plano Mensal Básico" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Preço Mensal (R$) *</label>
                <input required type="number" min="0" step="0.01" value={planForm.price}
                  onChange={e => setPlanForm({ ...planForm, price: e.target.value })}
                  className={input} placeholder="Ex: 150.00" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Duração (dias) *</label>
                  <input required type="number" min="1" value={planForm.duration_days}
                    onChange={e => setPlanForm({ ...planForm, duration_days: e.target.value })}
                    className={input} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Aulas/semana *</label>
                  <input required type="number" min="1" max="7" value={planForm.access_limit_per_week}
                    onChange={e => setPlanForm({ ...planForm, access_limit_per_week: e.target.value })}
                    className={input} />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10 flex justify-end gap-3">
                <button type="button" onClick={() => setShowPlanModal(false)}
                  className="px-5 py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition-colors">Cancelar</button>
                <button type="submit" disabled={planSubmitting} className="btn-primary">
                  {planSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Criar Plano'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Nova Matrícula ── */}
      {showEnrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowEnrollModal(false)} />
          <div className="relative bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8"
            style={{ animation: 'fadeIn 0.15s ease-out' }}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display text-2xl font-bold text-white">Nova Matrícula</h2>
              <button onClick={() => setShowEnrollModal(false)} className="text-gray-400 hover:text-white"><X size={22} /></button>
            </div>
            <form onSubmit={handleCreateEnrollment} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Aluno *</label>
                <select required value={enrollForm.student_id}
                  onChange={e => setEnrollForm({ ...enrollForm, student_id: e.target.value })}
                  className={`${input} appearance-none`}>
                  <option className="bg-zinc-800" value="">Selecione um aluno...</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id} className="bg-zinc-800">
                      {s.user.full_name} — CPF: {s.user.cpf}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Plano *</label>
                <select required value={enrollForm.plan_id}
                  onChange={e => setEnrollForm({ ...enrollForm, plan_id: e.target.value })}
                  className={`${input} appearance-none`}>
                  <option className="bg-zinc-800" value="">Selecione um plano...</option>
                  {plans.map(p => (
                    <option key={p.id} value={p.id} className="bg-zinc-800">
                      {p.name} — {BRL(p.price)} / {p.duration_days} dias
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Data de Início *</label>
                <input required type="date" value={enrollForm.start_date}
                  onChange={e => setEnrollForm({ ...enrollForm, start_date: e.target.value })}
                  className={`${input} [color-scheme:dark]`} />
              </div>
              <p className="text-xs text-gray-500 -mt-1">O vencimento é calculado automaticamente com base na duração do plano. Uma fatura é gerada assim que a matrícula é criada.</p>
              <div className="mt-4 pt-4 border-t border-white/10 flex justify-end gap-3">
                <button type="button" onClick={() => setShowEnrollModal(false)}
                  className="px-5 py-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition-colors">Cancelar</button>
                <button type="submit" disabled={enrollSubmitting} className="btn-primary">
                  {enrollSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Matricular Aluno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }`}</style>
    </div>
  );
};
