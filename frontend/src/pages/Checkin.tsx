import { useState, useEffect, useRef } from 'react';
import { Search, CheckCircle2, XCircle, Clock, Loader2, ShieldCheck, User, AlertCircle } from 'lucide-react';

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

const maskCPF = (v: string) => {
  v = v.replace(/\D/g, "");
  return v
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2")
    .slice(0, 14);
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
  const [query, setQuery] = useState('');
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
        setQuery('');
        setFoundStudent(null);
        inputRef.current?.focus();
      }, 4000);
      return () => clearTimeout(id);
    }
  }, [feedback]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setSearching(true);
    setSearchError('');
    setFoundStudent(null);
    try {
      const res = await fetch(`http://localhost:8000/api/checkins/search-student?query=${encodeURIComponent(query.trim())}`);
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

  const inputCls = 'w-full bg-black/40 border border-white/10 rounded-xl px-5 py-3.5 text-white text-lg outline-none focus:border-boxing-primary transition-colors font-display tracking-[0.2em] placeholder:tracking-normal placeholder:text-gray-600';

  return (
    <div className="flex flex-col w-full gap-8">
      {/* Header com relógio ao vivo */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl md:text-4xl text-white">Catraca Virtual</h1>
          <p className="text-gray-400 mt-1">Validação de acesso e frequência</p>
        </div>
        <div className="flex items-center gap-3 glass-panel px-5 py-3 border-emerald-500/20">
          <Clock size={18} className="text-emerald-400 shrink-0" />
          <span className="font-display font-semibold text-white text-lg tabular-nums">
            {currentTime.toLocaleTimeString('pt-BR')}
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Painel de Check-in */}
        <div className="lg:col-span-3 flex flex-col gap-4">

          {/* Área de Feedback */}
          {feedback.type !== 'idle' && (
            <div className={`glass-panel p-8 flex items-center gap-6 border-2 transition-all ${
              feedback.type === 'success' ? 'border-emerald-500/50 bg-emerald-500/10' :
              feedback.type === 'error'   ? 'border-red-500/50 bg-red-500/10' :
              'border-white/10'
            }`}>
              {feedback.type === 'loading' && (
                <><Loader2 className="animate-spin text-white shrink-0" size={32} />
                  <p className="font-display font-semibold text-white text-lg uppercase tracking-wider">Validando...</p></>
              )}
              {feedback.type === 'success' && (
                <><CheckCircle2 className="text-emerald-400 shrink-0" size={48} />
                  <div>
                    <p className="font-display font-bold text-emerald-400 text-2xl uppercase italic tracking-tighter">Acesso Liberado!</p>
                    <p className="text-white font-medium mt-1 text-lg">{feedback.name}</p>
                    <p className="text-gray-400 text-sm">Registrado às {feedback.time}</p>
                  </div></>
              )}
              {feedback.type === 'error' && (
                <><XCircle className="text-red-400 shrink-0" size={48} />
                  <div>
                    <p className="font-display font-bold text-red-400 text-2xl uppercase italic tracking-tighter">Acesso Negado</p>
                    <p className="text-gray-300 font-medium mt-1">{feedback.message}</p>
                  </div></>
              )}
            </div>
          )}

          {/* Input CPF com Máscara */}
          <div className="glass-panel p-8 flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-boxing-primary/10 rounded-lg"><ShieldCheck className="text-boxing-primary" size={24} /></div>
              <h2 className="font-display font-bold text-white text-xl uppercase italic tracking-tight">Identificação</h2>
            </div>

            <form onSubmit={handleSearch} className="flex flex-col gap-4">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => {
                    const val = e.target.value;
                    // Se digitar apenas números, tenta aplicar máscara de CPF, senão deixa livre
                    if (/^[\d.-]+$/.test(val) && val.replace(/\D/g, '').length <= 11) {
                      setQuery(maskCPF(val));
                    } else {
                      setQuery(val);
                    }
                    setSearchError('');
                    setFoundStudent(null);
                  }}
                  placeholder="Nome ou CPF (000.000.000-00)"
                  className={inputCls}
                  disabled={feedback.type === 'loading'}
                />
                {!query && <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-600" size={20} />}
              </div>
              
              <button
                type="submit"
                disabled={searching || !query.trim() || feedback.type !== 'idle'}
                className="btn-primary w-full py-4 text-lg font-bold uppercase italic tracking-widest shadow-lg shadow-boxing-primary/20"
              >
                {searching ? <Loader2 className="animate-spin" size={24} /> : "Procurar Aluno"}
              </button>
            </form>

            {searchError && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-sm font-semibold">
                <AlertCircle size={18} /> {searchError}
              </div>
            )}

            {/* Card do aluno encontrado */}
            {foundStudent && feedback.type === 'idle' && (
              <div className="mt-2 p-6 rounded-2xl border border-white/10 bg-white/[0.02] flex flex-col gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-boxing-primary/20 flex items-center justify-center text-boxing-primary border border-boxing-primary/30">
                      <User size={28} />
                    </div>
                    <div>
                      <p className="font-display font-bold text-white text-2xl leading-tight">{foundStudent.full_name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">{maskCPF(foundStudent.cpf)}</span>
                        {foundStudent.technical_level && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/5 border border-white/10 text-gray-400 font-bold uppercase">
                            {LEVEL_LABELS[foundStudent.technical_level] ?? foundStudent.technical_level}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <button
                  className="btn-primary w-full py-4 text-lg font-bold uppercase italic tracking-widest bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20"
                  onClick={handleCheckin}
                >
                  Confirmar Entrada
                </button>
              </div>
            )}
          </div>

          <p className="text-[10px] text-gray-600 text-center uppercase font-bold tracking-[0.2em]">
            Digitaliza e Valida · GestãoBoxe Pro
          </p>
        </div>

        {/* Histórico Lateral */}
        <div className="lg:col-span-2 glass-panel flex flex-col overflow-hidden max-h-[600px]">
          <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-black/20">
            <h3 className="font-display font-bold text-white uppercase text-sm tracking-widest italic">Últimos Acessos</h3>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="overflow-y-auto flex-1 divide-y divide-white/5 no-scrollbar">
            {recentCheckins.length === 0 ? (
              <p className="text-center text-gray-500 py-12 text-xs uppercase font-bold tracking-widest opacity-30 italic">Sem registros recentes</p>
            ) : (
              recentCheckins.map((c, i) => (
                <div key={c.id} className={`px-6 py-4 flex items-center justify-between gap-4 transition-colors ${i === 0 ? 'bg-emerald-500/5' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-500">
                      <User size={16} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-tight truncate max-w-[140px]">
                        ID: {c.student_id.slice(0, 8)}...
                      </p>
                      <p className="text-[10px] text-gray-600 font-medium">Auto-validado</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-500 font-bold font-mono tracking-tighter">{formatDateTime(c.checkin_date)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
