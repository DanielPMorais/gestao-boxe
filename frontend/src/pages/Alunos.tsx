import { useState, useEffect } from 'react';
import { UserPlus, Search, X, Loader2 } from 'lucide-react';

export const Alunos = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    cpf: '',
    email: '',
    phone: '',
    technical_level: 'BEGINNER'
  });

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/students/');
      if (!response.ok) throw new Error("Erro na rede");
      const data = await response.json();
      setStudents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch('http://localhost:8000/api/students/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        alert(`Erro: ${error.detail}`);
      } else {
        setIsModalOpen(false);
        setFormData({ full_name: '', cpf: '', email: '', phone: '', technical_level: 'BEGINNER' });
        fetchStudents(); // recarrega a tabela base
      }
    } catch (err) {
      console.error(err);
      alert("Falha de conexão com a API.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col w-full h-full gap-8 relative">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 w-full">
        <div>
          <h1 className="font-display font-bold text-3xl md:text-4xl text-white">Alunos</h1>
          <p className="text-gray-400 mt-1">Gestão de matrículas e perfis dos atletas</p>
        </div>
        <button 
          className="btn-primary w-full md:w-auto"
          onClick={() => setIsModalOpen(true)}
        >
          <UserPlus size={18} />
          Novo Aluno
        </button>
      </header>

      <div className="glass-panel overflow-hidden flex flex-col w-full">
        <div className="p-4 border-b border-white/5 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar aluno por nome ou CPF..." 
              className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white outline-none focus:border-boxing-primary transition-colors"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="text-xs uppercase bg-black/20 text-gray-400">
              <tr>
                <th className="px-6 py-4 font-medium tracking-wider">Aluno</th>
                <th className="px-6 py-4 font-medium tracking-wider">Contato</th>
                <th className="px-6 py-4 font-medium tracking-wider">Nível</th>
                <th className="px-6 py-4 font-medium tracking-wider">Exame Médico</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="text-center py-8">Carregando...</td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8">Nenhum aluno matriculado ainda.</td></tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{student.user?.full_name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{student.user?.cpf}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div>{student.user?.email}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{student.phone || 'Sem telefone'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-white/10 text-gray-300 whitespace-nowrap">
                        {student.technical_level}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {student.medical_cert_status === 'VALID' && <span className="text-emerald-500 font-medium">Válido</span>}
                      {student.medical_cert_status === 'PENDING' && <span className="text-amber-500 font-medium">Pendente</span>}
                      {student.medical_cert_status === 'EXPIRED' && <span className="text-red-500 font-medium">Expirado</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Glassmorphism de Cadastro */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-zinc-900 border border-white/10 shadow-2xl rounded-2xl w-full max-w-lg p-6 sm:p-8 animate-[fadeIn_0.2s_ease-out]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display text-2xl font-bold text-white">Cadastrar Aluno</h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Nome Completo</label>
                <input required type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white outline-none focus:border-boxing-primary transition-colors" placeholder="Ex: Popó Freitas" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">CPF</label>
                  <input required type="text" value={formData.cpf} onChange={e => setFormData({...formData, cpf: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white outline-none focus:border-boxing-primary transition-colors" placeholder="000.000.000-00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Telefone</label>
                  <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white outline-none focus:border-boxing-primary transition-colors" placeholder="(00) 00000-0000" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">E-mail</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white outline-none focus:border-boxing-primary transition-colors" placeholder="email@exemplo.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Nível Técnico de Boxe</label>
                <select value={formData.technical_level} onChange={e => setFormData({...formData, technical_level: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white outline-none focus:border-boxing-primary transition-colors appearance-none">
                  <option className="bg-zinc-800" value="BEGINNER">Iniciante</option>
                  <option className="bg-zinc-800" value="AMATEUR">Amador (Competição)</option>
                  <option className="bg-zinc-800" value="ATHLETE">Atleta Profissional</option>
                </select>
              </div>
              
              <div className="mt-4 pt-4 border-t border-white/10 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-lg font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? <Loader2 className="animate-spin" size={18} /> : "Finalizar Cadastro"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
};
