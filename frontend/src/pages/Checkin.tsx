import { useState, useEffect, useRef } from 'react';
import { Search, CheckCircle2, XCircle, Clock, Loader2, ShieldCheck } from 'lucide-react';

type FoundStudent = {
  student_id: string;
  full_name: string;
  cpf: string;
  technical_level: string | null;
};

type CheckinRecord = {
  id: string;
  student_id: string;
  checkin_date: string;
};

type FeedbackState =
  | { type: 'idle' }
  | { type: 'loading' }
  | { type: 'success'; name: string; time: string }
  | { type: 'error'; message: string };

const LEVEL_LABELS: Record<string, string> = {
  BEGINNER: 'Iniciante',
  AMATEUR: 'Amador',
  ATHLETE: 'Atleta Profissional',
};

function formatTime(isoString: string) {
  return new Date(isoString).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatDateTime(isoString: string) {
  const d = new Date(isoString);
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const Checkin = () => {
  const [cpf, setCpf] = useState('');
  const [searching, setSearching] = useState(false);
  const [foundStudent, setFoundStudent] = useState<FoundStudent | null>(null);
  const [searchError, setSearchError] = useState('');
  const [feedback, setFeedback] = useState<FeedbackState>({ type: 'idle' });
  const [recentCheckins, setRecentCheckins] = useState<CheckinRecord[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const inputRef = useRef<HTMLInputElement>(null);

  // Relógio ao vivo
  useEffect(() => {
    const id = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Buscar histórico recente
  const fetchRecent = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/checkins/recent?limit=20');
      if (res.ok) setRecentCheckins(await res.json());
    } catch {/* silencioso */}
  };
  useEffect(() => { fetchRecent(); }, []);

  // Auto-focus no input
  useEffect(() => { inputRef.current?.focus(); }, []);

  // Reset feedback após 4s
  useEffect(() => {
    if (feedback.type === 'success' || feedback.type === 'error') {
      const id = setTimeout(() => {
        setFeedback({ type: 'idle' });
        setCpf('');
        setFoundStudent(null);
        inputRef.current?.focus();
      }, 4000);
      return () => clearTimeout(id);
    }
  }, [feedback]);

  const handleCpfSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cpf.trim()) return;
    setSearching(true);
    setSearchError('');
    setFoundStudent(null);
    try {
      const res = await fetch(`http://localhost:8000/api/checkins/search-student?cpf=${encodeURIComponent(cpf.trim())}`);
      if (!res.ok) {
        const err = await res.json();
        setSearchError(err.detail ?? 'Aluno não encontrado.');
      } else {
        setFoundStudent(await res.json());
      }
    } catch {
      setSearchError('Falha de conexão com a API.');
    } finally {
      setSearching(false);
    }
  };

  const handleCheckin = async () => {
    if (!foundStudent) return;
    setFeedback({ type: 'loading' });
    try {
      const res = await fetch('http://localhost:8000/api/checkins/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: foundStudent.student_id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'error', message: data.detail ?? 'Erro desconhecido.' });
      } else {
        setFeedback({
          type: 'success',
          name: foundStudent.full_name,
          time: formatTime(data.checkin_date),
        });
        fetchRecent();
      }
    } catch {
      setFeedback({ type: 'error', message: 'Falha de conexão com a API.' });
    }
  };

  const inputCls = 'w-full bg-black/40 border border-white/10 rounded-xl px-5 py-3.5 text-white text-lg outline-none focus:border-boxing-primary transition-colors font-display tracking-widest';

  return (
    <div className="flex flex-col w-full gap-8">
      {/* Header com relógio ao vivo */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl md:text-4xl text-white">Catraca Virtual</h1>
          <p className="text-gray-400 mt-1">Registre a entrada dos atletas pelo CPF</p>
        </div>
        <div className="flex items-center gap-3 glass-panel px-5 py-3">
          <Clock size={18} className="text-boxing-primary shrink-0" />
          <span className="font-display font-semibold text-white text-lg tabular-nums">
            {currentTime.toLocaleTimeString('pt-BR')}
          </span>
          <span className="text-gray-500 text-sm">
            {currentTime.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Painel de Check-in */}
        <div className="lg:col-span-3 flex flex-col gap-4">

          {/* Área de Feedback */}
          {feedback.type !== 'idle' && (
            <div className={`glass-panel p-6 flex items-center gap-4 border-2 transition-all ${
              feedback.type === 'success' ? 'border-emerald-500/50 bg-emerald-500/10' :
              feedback.type === 'error'   ? 'border-red-500/50 bg-red-500/10' :
              'border-white/10'
            }`}>
              {feedback.type === 'loading' && (
                <><Loader2 className="animate-spin text-white shrink-0" size={32} />
                  <p className="font-display font-semibold text-white text-lg">Processando...</p></>
              )}
              {feedback.type === 'success' && (
                <><CheckCircle2 className="text-emerald-400 shrink-0" size={40} />
                  <div>
                    <p className="font-display font-bold text-emerald-400 text-xl">Acesso Liberado!</p>
                    <p className="text-white font-medium mt-0.5">{feedback.name}</p>
                    <p className="text-gray-400 text-sm">Registrado às {feedback.time}</p>
                  </div></>
              )}
              {feedback.type === 'error' && (
                <><XCircle className="text-red-400 shrink-0" size={40} />
                  <div>
                    <p className="font-display font-bold text-red-400 text-xl">Acesso Negado</p>
                    <p className="text-gray-300 text-sm mt-0.5">{feedback.message}</p>
                  </div></>
              )}
            </div>
          )}

          {/* Input CPF */}
          <div className="glass-panel p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className="text-boxing-primary" size={24} />
              <h2 className="font-display font-semibold text-white text-lg">Identificação do Atleta</h2>
            </div>

            <form onSubmit={handleCpfSearch} className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                value={cpf}
                onChange={e => { setCpf(e.target.value); setSearchError(''); setFoundStudent(null); }}
                placeholder="Digite o CPF..."
                className={inputCls}
                disabled={feedback.type === 'loading'}
              />
              <button
                type="submit"
                disabled={searching || !cpf.trim()}
                className="btn-primary shrink-0 px-5"
                title="Buscar aluno"
              >
                {searching ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
              </button>
            </form>

            {searchError && (
              <p className="text-red-400 text-sm flex items-center gap-2">
                <XCircle size={16} /> {searchError}
              </p>
            )}

            {/* Card do aluno encontrado */}
            {foundStudent && feedback.type === 'idle' && (
              <div className="mt-2 p-4 rounded-xl border border-white/10 bg-black/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="font-display font-bold text-white text-lg">{foundStudent.full_name}</p>
                  <p className="text-gray-400 text-sm mt-0.5">CPF: {foundStudent.cpf}</p>
                  {foundStudent.technical_level && (
                    <span className="mt-1.5 inline-block px-2.5 py-0.5 rounded-full text-xs bg-white/10 text-gray-300">
                      {LEVEL_LABELS[foundStudent.technical_level] ?? foundStudent.technical_level}
                    </span>
                  )}
                </div>
                <button
                  className="btn-primary w-full sm:w-auto shrink-0 text-base py-3 px-8"
                  onClick={handleCheckin}
                >
                  <CheckCircle2 size={20} />
                  Confirmar Check-in
                </button>
              </div>
            )}
          </div>

          {/* Dica de atalho */}
          <p className="text-xs text-gray-600 text-center">
            Digite o CPF e pressione <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-gray-400 font-mono">Enter</kbd> para buscar. Após localizar, confirme o acesso.
          </p>
        </div>

        {/* Histórico de Check-ins */}
        <div className="lg:col-span-2 glass-panel flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="font-display font-semibold text-white">Histórico Recente</h3>
            <button
              onClick={fetchRecent}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Atualizar
            </button>
          </div>
          <div className="overflow-y-auto flex-1 divide-y divide-white/5">
            {recentCheckins.length === 0 ? (
              <p className="text-center text-gray-500 py-10 text-sm">Nenhum check-in registrado ainda.</p>
            ) : (
              recentCheckins.map((c, i) => (
                <div key={c.id} className={`px-5 py-3 flex items-center justify-between gap-2 ${i === 0 ? 'bg-emerald-500/5' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${i === 0 ? 'bg-emerald-400' : 'bg-gray-600'}`} />
                    <div>
                      <p className="text-sm text-gray-300 font-medium font-mono truncate max-w-[120px]" title={c.student_id}>
                        {c.student_id.slice(0, 8)}…
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 shrink-0">{formatDateTime(c.checkin_date)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
