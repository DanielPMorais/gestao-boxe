import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Loader2, X, BookOpen, ClipboardList, Calendar, Zap, ShieldCheck, AlertCircle, CheckCircle2, TrendingUp, HandCoins } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';

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
  is_enrolled: boolean;
};

type Enrollment = {
  id: string;
  student_id: string;
  plan_id: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  contract_signed: boolean;
  signature_date: string | null;
  signature_base64: string | null;
  student?: { user?: { full_name: string } };
  plan?: { name: string; price: number };
};

type UpgradeInfo = {
  type: 'upgrade' | 'downgrade';
  current_plan_name: string;
  new_plan_name: string;
  unused_credit: number;
  total_to_pay: number;
  remaining_days: number;
  next_start_date: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const BRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const input =
  'w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white outline-none focus:border-boxing-primary transition-colors text-sm placeholder:text-gray-600';

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
  const sigCanvasEnroll = useRef<SignatureCanvas>(null);

  // Upgrade state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
  const [upgradePlanId, setUpgradePlanId] = useState('');
  const [upgradeInfo, setUpgradeInfo] = useState<UpgradeInfo | null>(null);
  const [calculatingUpgrade, setCalculatingUpgrade] = useState(false);

  // View Sign state
  const [showViewSignModal, setShowViewSignModal] = useState(false);
  const [signToView, setSignToView] = useState<string | null>(null);
  const [signOwnerName, setSignOwnerName] = useState('');

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
    if (sigCanvasEnroll.current?.isEmpty()) {
      alert("Por favor, colha a assinatura do contrato antes de finalizar.");
      return;
    }
    setEnrollSubmitting(true);
    try {
      const signatureBase64 = sigCanvasEnroll.current?.getCanvas().toDataURL("image/png");

      const r = await fetch('http://localhost:8000/api/enrollments/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: enrollForm.student_id,
          plan_id: enrollForm.plan_id,
          start_date: enrollForm.start_date,
          end_date: enrollForm.start_date, // back-end recalculates
          is_active: true,
          signature_base64: signatureBase64,
        }),
      });
      if (!r.ok) { const e = await r.json(); alert(`Erro: ${e.detail}`); return; }
      setShowEnrollModal(false);
      fetchEnrollments();
    } catch (err: any) {
      console.error('Erro ao matricular:', err);
      alert('Falha na conexão com o servidor.');
    } finally { setEnrollSubmitting(false); }
  };

  // ── Upgrade Upgrade ──
  const handleUpgradePreview = async (planId: string) => {
    if (!selectedEnrollment) return;
    setUpgradePlanId(planId);
    if (!planId) { setUpgradeInfo(null); return; }
    
    setCalculatingUpgrade(true);
    try {
      const r = await fetch(`http://localhost:8000/api/enrollments/${selectedEnrollment.id}/upgrade-preview?new_plan_id=${planId}`);
      if (r.ok) setUpgradeInfo(await r.json());
    } finally { setCalculatingUpgrade(false); }
  }

  const handleExecuteUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnrollment || !upgradePlanId) return;
    if (sigCanvasEnroll.current?.isEmpty()) {
      alert("Por favor, colha a nova assinatura para o novo contrato.");
      return;
    }

    setEnrollSubmitting(true);
    try {
      const signatureBase64 = sigCanvasEnroll.current?.getCanvas().toDataURL("image/png");
      const r = await fetch(`http://localhost:8000/api/enrollments/${selectedEnrollment.id}/upgrade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          new_plan_id: upgradePlanId,
          signature_base64: signatureBase64
        }),
      });
      if (!r.ok) { const e = await r.json(); alert(`Erro: ${e.detail}`); return; }
      setShowUpgradeModal(false);
      fetchEnrollments();
    } finally { setEnrollSubmitting(false); }
  }

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
                    <th className="px-6 py-4 font-medium tracking-wider">Contrato</th>
                    <th className="px-6 py-4 font-medium tracking-wider">Período</th>
                    <th className="px-6 py-4 font-medium tracking-wider text-right">Ações</th>
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
                        <tr key={en.id} className="border-b border-white/5 hover:bg-white/5 transition-colors text-xs">
                          <td className="px-6 py-4 font-medium text-white">
                            {en.student?.user?.full_name ?? <span className="text-gray-500 font-mono text-xs">{en.student_id.slice(0,8)}…</span>}
                          </td>
                          <td className="px-6 py-4">
                            <div>{en.plan?.name ?? <span className="text-gray-500 font-mono text-xs">{en.plan_id.slice(0,8)}…</span>}</div>
                            {en.plan && <div className="text-boxing-primary mt-0.5">{BRL(en.plan.price)}</div>}
                          </td>
                          <td className="px-6 py-4">
                            {en.contract_signed ? (
                              <button 
                                onClick={() => { setSignToView(en.signature_base64); setSignOwnerName(en.student?.user?.full_name || ''); setShowViewSignModal(true); }}
                                className="flex items-center gap-1.5 text-emerald-400 font-bold uppercase text-[10px] hover:underline"
                              >
                                <ShieldCheck size={14} /> Assinado
                              </button>
                            ) : (
                              <div className="flex items-center gap-1.5 text-amber-400 font-bold uppercase text-[10px]">
                                <AlertCircle size={14} /> Pendente
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-gray-400">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex flex-col gap-0.5">
                                <span>De: {new Date(en.start_date).toLocaleDateString('pt-BR')}</span>
                                <span>Até: {new Date(en.end_date).toLocaleDateString('pt-BR')}</span>
                              </div>
                              {new Date(en.start_date) > new Date() ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Agendada</span>
                              ) : active ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Ativa</span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-gray-500/10 text-gray-400 border border-gray-500/20">{isExp ? 'Expirada' : 'Inativa'}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {active && (
                              <button 
                                onClick={() => { setSelectedEnrollment(en); setShowUpgradeModal(true); setUpgradePlanId(''); setUpgradeInfo(null); }}
                                className="p-2 text-gray-500 hover:text-white transition-colors" title="Upgrade de Plano"
                              >
                                <TrendingUp size={16} />
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
          </div>
        </>
      )}

      {/* ── Modal Novo Plano ── */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowPlanModal(false)} />
          <div className="relative bg-[#121214] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8"
            style={{ animation: 'fadeIn 0.15s ease-out' }}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display text-2xl font-bold text-white">Novo Plano</h2>
              <button onClick={() => setShowPlanModal(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
            </div>
            <form onSubmit={handleCreatePlan} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Nome do Plano *</label>
                <input required type="text" value={planForm.name}
                  onChange={e => setPlanForm({ ...planForm, name: e.target.value })}
                  className={input} placeholder="Ex: Mensal Básico" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Preço Mensal (R$) *</label>
                <input required type="number" min="0" step="0.01" value={planForm.price}
                  onChange={e => setPlanForm({ ...planForm, price: e.target.value })}
                  className={input} placeholder="Ex: 150.00" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Duração (dias) *</label>
                  <input required type="number" min="1" value={planForm.duration_days}
                    onChange={e => setPlanForm({ ...planForm, duration_days: e.target.value })}
                    className={input} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Aulas/semana *</label>
                  <input required type="number" min="1" max="7" value={planForm.access_limit_per_week}
                    onChange={e => setPlanForm({ ...planForm, access_limit_per_week: e.target.value })}
                    className={input} />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/5 flex justify-end gap-3">
                <button type="button" onClick={() => setShowPlanModal(false)}
                  className="px-5 py-2.5 rounded-lg text-xs font-bold text-gray-500 hover:text-white transition-colors uppercase">Cancelar</button>
                <button type="submit" disabled={planSubmitting} className="btn-primary min-w-[120px]">
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
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowEnrollModal(false)} />
          <div className="relative bg-[#121214] border border-white/10 rounded-2xl shadow-2xl w-full max-w-xl p-6 sm:p-8 overflow-y-auto max-h-[95vh]"
            style={{ animation: 'fadeIn 0.15s ease-out' }}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display text-2xl font-bold text-white">Nova Matrícula</h2>
              <button onClick={() => setShowEnrollModal(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
            </div>
            <form onSubmit={handleCreateEnrollment} className="flex flex-col gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Aluno *</label>
                  <select required value={enrollForm.student_id}
                    onChange={e => setEnrollForm({ ...enrollForm, student_id: e.target.value })}
                    className={`${input} appearance-none bg-[#1a1a1e]`}>
                    <option value="">Selecione um aluno...</option>
                    {students.filter(s => !s.is_enrolled).map(s => (
                      <option key={s.id} value={s.id}>
                        {s.user.full_name} — CPF: {s.user.cpf}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Plano de Treino *</label>
                  <select required value={enrollForm.plan_id}
                    onChange={e => setEnrollForm({ ...enrollForm, plan_id: e.target.value })}
                    className={`${input} appearance-none bg-[#1a1a1e]`}>
                    <option value="">Selecione um plano...</option>
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {BRL(p.price)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Data de Início *</label>
                  <input required type="date" value={enrollForm.start_date}
                    onChange={e => setEnrollForm({ ...enrollForm, start_date: e.target.value })}
                    className={`${input} [color-scheme:dark] bg-[#1a1a1e]`} />
                </div>
              </div>

              {/* Termos do Contrato */}
              <div className="flex flex-col gap-3 pt-4 border-t border-white/5">
                <label className="block text-xs font-bold text-gray-500 uppercase py-1 px-3 bg-white/5 w-fit rounded">Contrato de Prestação de Serviços</label>
                <div className="bg-black/40 border border-white/5 rounded-lg p-4 text-[10px] leading-relaxed text-gray-400 h-28 overflow-y-auto font-mono no-scrollbar">
                  O CONTRATANTE adere ao plano selecionado acima, comprometendo-se ao pagamento dos valores estipulados via fatura. O acesso à academia respeitará o limite de aulas semanais e a duração total do plano. A falta de pagamento acarretará no bloqueio automático do acesso. O cancelamento deve ser solicitado com antecedência de 30 dias. Esta assinatura digital possui validade plena como concordância mútua entre as partes.
                </div>
                
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] text-gray-600 font-bold uppercase">Assinatura do Aluno</span>
                    <button type="button" onClick={() => sigCanvasEnroll.current?.clear()} className="text-[10px] text-boxing-primary hover:underline uppercase font-bold">Limpar</button>
                  </div>
                  <div className="border-2 border-dashed border-white/10 rounded-xl bg-white/[0.02] overflow-hidden">
                    <SignatureCanvas 
                      ref={sigCanvasEnroll}
                      penColor="#fff"
                      canvasProps={{ className: 'w-full h-24 cursor-crosshair' }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/5 flex justify-end gap-3">
                <button type="button" onClick={() => setShowEnrollModal(false)}
                  className="px-5 py-2.5 rounded-lg text-xs font-bold text-gray-500 hover:text-white transition-colors uppercase">Cancelar</button>
                <button type="submit" disabled={enrollSubmitting} className="btn-primary min-w-[200px]">
                  {enrollSubmitting ? <Loader2 className="animate-spin" size={18} /> : (
                    <span className="flex items-center gap-2 tracking-widest uppercase text-xs"><CheckCircle2 size={16} /> Finalizar Matrícula</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Upgrade Plano ── */}
      {showUpgradeModal && selectedEnrollment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowUpgradeModal(false)} />
          <div className="relative bg-[#121214] border border-white/10 rounded-2xl shadow-2xl w-full max-w-xl p-6 sm:p-8 overflow-y-auto max-h-[95vh]"
            style={{ animation: 'fadeIn 0.15s ease-out' }}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-white">Upgrade de Plano</h2>
                <p className="text-gray-500 text-sm mt-1">Simule e execute a troca de plano proporcional.</p>
              </div>
              <button onClick={() => setShowUpgradeModal(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
            </div>

            <form onSubmit={handleExecuteUpgrade} className="flex flex-col gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Novo Plano *</label>
                  <select required value={upgradePlanId}
                    onChange={e => handleUpgradePreview(e.target.value)}
                    className={`${input} appearance-none bg-[#1a1a1e]`}>
                    <option value="">Selecione o plano de destino...</option>
                    {plans.filter(p => p.id !== selectedEnrollment.plan_id).map(p => (
                      <option key={p.id} value={p.id}>{p.name} — {BRL(p.price)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {calculatingUpgrade ? (
                <div className="flex items-center justify-center py-8 text-gray-500"><Loader2 className="animate-spin mr-2" /> Calculando...</div>
              ) : upgradeInfo && (
                <div className="flex flex-col gap-4">
                  {upgradeInfo.type === 'downgrade' && (
                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 flex gap-3">
                      <Calendar className="text-indigo-400 shrink-0" size={18} />
                      <p className="text-[11px] text-indigo-300 leading-relaxed">
                        Este é um <strong>Downgrade</strong>. O aluno manterá o plano atual até <strong>{new Date(selectedEnrollment?.end_date || '').toLocaleDateString('pt-BR')}</strong>. 
                        A transição para o plano {upgradeInfo.new_plan_name} ocorrerá automaticamente no dia seguinte.
                      </p>
                    </div>
                  )}

                  <div className="bg-boxing-primary/5 border border-boxing-primary/10 rounded-xl p-5 flex flex-col gap-4">
                    <h4 className="flex items-center gap-2 text-boxing-primary font-bold text-xs uppercase tracking-widest"><TrendingUp size={14} /> Resumo Financeiro</h4>
                    <div className="grid grid-cols-2 gap-y-3 text-sm">
                      <span className="text-gray-500 uppercase text-[10px] font-bold">Plano Atual</span>
                      <span className="text-white text-right">{upgradeInfo.current_plan_name}</span>
                      <span className="text-gray-500 uppercase text-[10px] font-bold">Novo Plano</span>
                      <span className="text-white text-right">{upgradeInfo.new_plan_name}</span>
                      
                      {upgradeInfo.type === 'upgrade' ? (
                        <>
                          <span className="text-gray-500 uppercase text-[10px] font-bold">Crédito Pró-rata ({upgradeInfo.remaining_days} dias)</span>
                          <span className="text-emerald-400 text-right">- {BRL(upgradeInfo.unused_credit)}</span>
                        </>
                      ) : (
                        <>
                          <span className="text-gray-500 uppercase text-[10px] font-bold">Início do Novo Ciclo</span>
                          <span className="text-indigo-400 text-right">{new Date(upgradeInfo.next_start_date).toLocaleDateString('pt-BR')}</span>
                        </>
                      )}

                      <div className="col-span-2 border-t border-white/5 my-1" />
                      <span className="text-white font-bold uppercase text-xs">Total a Pagar Hoje</span>
                      <span className="text-boxing-primary font-bold text-lg text-right">{BRL(upgradeInfo.total_to_pay)}</span>
                    </div>
                  </div>
                </div>
              )}

              {upgradeInfo && (
                <div className="flex flex-col gap-3">
                  <label className="block text-xs font-bold text-gray-500 uppercase py-1 px-3 bg-white/5 w-fit rounded">Confirmar Novo Contrato</label>
                  <p className="text-[10px] text-gray-500 -mt-1 italic">Ao confirmar, o aluno concorda com os termos do novo plano selecionado.</p>
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] text-gray-600 font-bold uppercase">Confirmar Assinatura Upgrade</span>
                      <button type="button" onClick={() => sigCanvasEnroll.current?.clear()} className="text-[10px] text-boxing-primary hover:underline uppercase font-bold">Limpar</button>
                    </div>
                    <div className="border-2 border-dashed border-white/10 rounded-xl bg-white/[0.02] overflow-hidden">
                      <SignatureCanvas ref={sigCanvasEnroll} penColor="#fff" canvasProps={{ className: 'w-full h-24 cursor-crosshair' }} />
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-white/5 flex justify-end gap-3">
                <button type="button" onClick={() => setShowUpgradeModal(false)}
                  className="px-5 py-2.5 rounded-lg text-xs font-bold text-gray-500 hover:text-white transition-colors uppercase">Cancelar</button>
                <button type="submit" disabled={enrollSubmitting || !upgradeInfo} className="btn-primary min-w-[200px]">
                  {enrollSubmitting ? <Loader2 className="animate-spin" size={18} /> : (
                    <span className="flex items-center gap-2 tracking-widest uppercase text-xs"><HandCoins size={16} /> Confirmar Upgrade</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal View Signature ── */}
      {showViewSignModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowViewSignModal(false)} />
          <div className="relative bg-[#121214] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg p-8 text-center">
            <h3 className="text-white font-bold mb-4 uppercase text-xs tracking-widest">Contrato: {signOwnerName}</h3>
            {signToView ? (
              <div className="bg-white rounded-xl p-6 mb-6 flex items-center justify-center">
                <img src={signToView} alt="Assinatura" className="max-w-full h-auto grayscale brightness-0 opacity-80" />
              </div>
            ) : (
              <div className="py-12 text-gray-500">Nenhuma assinatura digital encontrada para esta matrícula.</div>
            )}
            <button onClick={() => setShowViewSignModal(false)} className="btn-primary w-full py-3">Fechar Documento</button>
          </div>
        </div>
      )}

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }`}</style>
    </div>
  );
};
