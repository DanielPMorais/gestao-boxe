import { useState, useEffect, useRef } from 'react';
import { UserPlus, Search, X, Loader2, Pencil, Trash2, ShieldCheck, RefreshCw, CheckCircle2, AlertCircle, Save } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';

type Student = {
  id: string;
  phone: string | null;
  birth_date: string | null;
  gender: string | null;
  technical_level: string;
  contract_signed: boolean;
  signature_date: string | null;
  signature_base64: string | null;
  is_enrolled: boolean;
  user: {
    id: string;
    full_name: string;
    cpf: string;
    email: string;
    is_active: boolean;
    created_at: string;
    last_update: string;
  };
};

const LEVEL_LABELS: Record<string, string> = {
  BEGINNER: 'Iniciante',
  AMATEUR: 'Amador',
  ATHLETE: 'Atleta',
};

const EMPTY_FORM = {
  full_name: '',
  cpf: '',
  email: '',
  phone: '',
  birth_date: '',
  gender: '',
  technical_level: 'BEGINNER',
};

// --- MASK HELPERS ---
const maskCPF = (v: string) => {
  v = v.replace(/\D/g, "");
  return v
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2")
    .slice(0, 14);
};

const maskPhone = (v: string) => {
  v = v.replace(/\D/g, "");
  return v
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .slice(0, 15);
};

export const Alunos = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const sigCanvas = useRef<SignatureCanvas>(null);

  const filtered = students.filter(
    (s) =>
      s.user.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.user.cpf.includes(search)
  );

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/students/');
      if (!res.ok) throw new Error();
      setStudents(await res.json());
    } catch {
      console.error('Falha ao carregar alunos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStudents(); }, []);

  const openModal = () => {
    setFormData(EMPTY_FORM);
    setIsModalOpen(true);
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      full_name: student.user.full_name,
      cpf: student.user.cpf,
      email: student.user.email,
      phone: student.phone || '',
      birth_date: student.birth_date || '',
      gender: student.gender || '',
      technical_level: student.technical_level,
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (student: Student) => {
    setStudentToDelete(student);
    setIsDeleteModalOpen(true);
  };

  const clearSignature = () => sigCanvas.current?.clear();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sigCanvas.current?.isEmpty()) {
      alert("Por favor, peça ao aluno para assinar o termo de responsabilidade.");
      return;
    }
    setSubmitting(true);
    try {
      // Usamos o canvas original diretamente para evitar crash da lib no Vite/React19
      const signatureBase64 = sigCanvas.current?.getCanvas().toDataURL("image/png");

      const payload = {
        ...formData,
        cpf: formData.cpf.replace(/\D/g, ""),
        phone: formData.phone.replace(/\D/g, ""),
        birth_date: formData.birth_date || null,
        gender: formData.gender || null,
        signature_base64: signatureBase64,
      };
      
      const res = await fetch('http://localhost:8000/api/students/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(`Erro da API: ${err.detail}`);
        return;
      }
      setIsModalOpen(false);
      fetchStudents();
    } catch (error: any) {
      console.error('Erro ao processar cadastro:', error);
      alert(`Erro inesperado: ${error.message || 'Consulte o log do console.'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setSubmitting(true);
    try {
      const payload = {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone.replace(/\D/g, ""),
        birth_date: formData.birth_date || null,
        gender: formData.gender || null,
        technical_level: formData.technical_level,
      };

      const res = await fetch(`http://localhost:8000/api/students/${editingStudent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(`Erro ao atualizar: ${err.detail}`);
        return;
      }
      setIsEditModalOpen(false);
      fetchStudents();
    } catch (error) {
      console.error('Erro ao atualizar aluno:', error);
      alert('Falha na conexão ao tentar atualizar.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!studentToDelete) return;
    setSubmitting(true);
    try {
      await fetch(`http://localhost:8000/api/students/${studentToDelete.id}/toggle-status`, { method: 'PATCH' });
      setIsDeleteModalOpen(false);
      fetchStudents();
    } catch {
      alert(`Erro ao alterar status do aluno.`);
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = 'w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white outline-none focus:border-boxing-primary transition-colors text-sm placeholder:text-gray-600';

  return (
    <div className="flex flex-col w-full gap-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl md:text-4xl text-white">Alunos</h1>
          <p className="text-gray-400 mt-1">Gestão de matrículas e assinaturas</p>
        </div>
        <button className="btn-primary w-full md:w-auto" onClick={openModal}>
          <UserPlus size={18} />
          Novo Aluno
        </button>
      </header>

      {/* Table Card */}
      <div className="glass-panel overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              name="student-search"
              autoComplete="off"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou CPF..."
              className={`${inputCls} pl-9`}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="text-xs uppercase bg-black/20 text-gray-500">
              <tr>
                <th className="px-6 py-4 font-medium tracking-wider">Aluno</th>
                <th className="px-6 py-4 font-medium tracking-wider">Contato</th>
                <th className="px-6 py-4 font-medium tracking-wider">Nível</th>
                <th className="px-6 py-4 font-medium tracking-wider">Waiver</th>
                <th className="px-6 py-4 font-medium tracking-wider">Situação</th>
                <th className="px-6 py-4 font-medium tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    <Loader2 className="animate-spin inline-block mr-2" size={18} />
                    Carregando atletas...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    {search ? 'Nenhum aluno encontrado.' : 'Nenhum aluno cadastrado.'}
                  </td>
                </tr>
              ) : (
                filtered.map((student) => {
                  const isActive = student.user.is_active;
                  const isEnrolled = student.is_enrolled;
                  
                  return (
                    <tr
                      key={student.id}
                      className={`border-b border-white/5 hover:bg-white/5 transition-colors ${!isActive ? 'opacity-40' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-white">{student.user.full_name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{maskCPF(student.user.cpf)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs">{student.user.email}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{student.phone ? maskPhone(student.phone) : '—'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/5 border border-white/10 uppercase">
                          {LEVEL_LABELS[student.technical_level] ?? student.technical_level}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {student.contract_signed ? (
                          <button 
                            onClick={() => { setEditingStudent(student); setIsViewModalOpen(true); }}
                            className="flex items-center gap-1.5 text-emerald-400 font-bold hover:underline uppercase text-[10px]"
                          >
                            <ShieldCheck size={14} /> Assinado
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5 text-amber-400 text-[10px] font-bold uppercase">
                            <AlertCircle size={14} /> Pendente
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {!isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-500/10 text-gray-400 uppercase border border-gray-500/20">
                            Inativo
                          </span>
                        ) : isEnrolled ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 uppercase border border-emerald-500/20">
                            Matriculado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 uppercase border border-amber-500/20">
                            Sem Plano
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEditModal(student)} className="p-2 text-gray-500 hover:text-white transition-colors">
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => openDeleteModal(student)}
                            title={isActive ? 'Desativar aluno' : 'Reativar aluno'}
                            className={`p-2 transition-colors ${isActive ? 'text-gray-500 hover:text-red-400' : 'text-emerald-500 hover:text-emerald-400'}`}
                          >
                            {isActive ? <Trash2 size={16} /> : <RefreshCw size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Cadastro com Assinatura */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-[#121214] border border-white/10 shadow-2xl rounded-2xl w-full max-w-2xl p-6 sm:p-8 overflow-y-auto max-h-[95vh]">
            
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="font-display text-2xl font-bold text-white">Matrícula de Atleta</h2>
                <p className="text-gray-500 text-sm mt-1">Cadastro inicial e termo de responsabilidade de saúde.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Nome Completo</label>
                  <input required type="text" name="full_name" autoComplete="off" value={formData.full_name}
                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                    className={inputCls} placeholder="Nome do aluno" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">CPF (Apenas números)</label>
                  <input required type="text" name="cpf" autoComplete="off" value={formData.cpf}
                    onChange={e => setFormData({ ...formData, cpf: maskCPF(e.target.value) })}
                    className={inputCls} placeholder="000.000.000-00" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Telefone</label>
                  <input type="text" name="phone" autoComplete="off" value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: maskPhone(e.target.value) })}
                    className={inputCls} placeholder="(00) 00000-0000" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">E-mail</label>
                  <input required type="email" name="email" autoComplete="email" value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className={inputCls} placeholder="email@exemplo.com" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Data de Nascimento</label>
                  <input type="date" name="birth_date" value={formData.birth_date}
                    onChange={e => setFormData({ ...formData, birth_date: e.target.value })}
                    className={`${inputCls} [color-scheme:dark]`} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Nível Técnico</label>
                  <select name="technical_level" value={formData.technical_level}
                    onChange={e => setFormData({ ...formData, technical_level: e.target.value })}
                    className={`${inputCls} appearance-none`}>
                    <option className="bg-zinc-900" value="BEGINNER">Iniciante</option>
                    <option className="bg-zinc-900" value="AMATEUR">Amador (Competição)</option>
                    <option className="bg-zinc-900" value="ATHLETE">Atleta Profissional</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-4 border-t border-white/5">
                <label className="block text-xs font-bold text-gray-500 uppercase py-1 px-3 bg-white/5 w-fit rounded">Termo de Responsabilidade</label>
                <div className="bg-black/40 border border-white/5 rounded-lg p-4 text-[11px] leading-relaxed text-gray-400 h-32 overflow-y-auto font-mono no-scrollbar">
                  Eu, acima identificado, declaro estar em perfeitas condições de saúde física e mental para a prática de Boxe e exercícios de alta intensidade. Isento a academia de qualquer responsabilidade sobre lesões decorrentes da prática esportiva regular. Comprometo-me a seguir as normas de segurança e conduta do estabelecimento. Esta assinatura digital possui validade de aceitação plena dos termos de serviço da academia.
                </div>
                
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] text-gray-600 font-bold uppercase">Assinatura Digital</span>
                    <button type="button" onClick={clearSignature} className="text-[10px] text-boxing-primary hover:underline uppercase font-bold">Limpar</button>
                  </div>
                  <div className="border-2 border-dashed border-white/10 rounded-xl bg-white/[0.02] overflow-hidden">
                    <SignatureCanvas 
                      ref={sigCanvas}
                      penColor="#fff"
                      canvasProps={{ className: 'w-full h-32 cursor-crosshair' }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 rounded-lg font-bold text-gray-500 hover:text-white transition-colors uppercase text-xs tracking-wider">
                  Cancelar
                </button>
                <button type="submit" disabled={submitting} className="btn-primary min-w-[200px] py-3">
                  {submitting ? <Loader2 className="animate-spin" size={18} /> : (
                    <span className="flex items-center gap-2 tracking-widest"><CheckCircle2 size={18} /> SALVAR ATLETA</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edição */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsEditModalOpen(false)} />
          <div className="relative bg-[#121214] border border-white/10 shadow-2xl rounded-2xl w-full max-w-xl p-6 sm:p-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="font-display text-2xl font-bold text-white">Editar Aluno</h2>
                <p className="text-gray-500 text-sm mt-1">Atualize as informações cadastrais.</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="flex flex-col gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Nome Completo</label>
                  <input required type="text" value={formData.full_name}
                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                    className={inputCls} />
                </div>
                <div className="sm:col-span-2 text-[10px] text-gray-600 uppercase font-bold px-1 -mb-2">
                  O CPF não pode ser alterado após o cadastro.
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">E-mail</label>
                  <input required type="email" value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Telefone</label>
                  <input type="text" value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: maskPhone(e.target.value) })}
                    className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Nível Técnico</label>
                  <select value={formData.technical_level}
                    onChange={e => setFormData({ ...formData, technical_level: e.target.value })}
                    className={`${inputCls} appearance-none`}>
                    <option className="bg-zinc-900" value="BEGINNER">Iniciante</option>
                    <option className="bg-zinc-900" value="AMATEUR">Amador</option>
                    <option className="bg-zinc-900" value="ATHLETE">Atleta</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsEditModalOpen(false)}
                  className="px-6 py-2.5 rounded-lg font-bold text-gray-500 hover:text-white transition-colors uppercase text-xs">
                  Cancelar
                </button>
                <button type="submit" disabled={submitting} className="btn-primary min-w-[140px]">
                  {submitting ? <Loader2 className="animate-spin" size={18} /> : (
                    <span className="flex items-center gap-2 uppercase tracking-wider"><Save size={18} /> Salvar</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmação Status/Delete */}
      {isDeleteModalOpen && studentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsDeleteModalOpen(false)} />
          <div className="relative bg-[#121214] border border-white/10 shadow-2xl rounded-2xl w-full max-w-sm p-6 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 mb-4">
              <AlertCircle size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Alterar Status?</h3>
            <p className="text-gray-400 text-sm mb-8 leading-relaxed">
              Você deseja {studentToDelete.user.is_active ? 'desativar' : 'reativar'} o aluno 
              <span className="text-white font-bold block mt-1">"{studentToDelete.user.full_name}"</span>
            </p>
            <div className="flex flex-col gap-2">
              <button 
                onClick={handleToggleStatus}
                disabled={submitting}
                className={`w-full py-3 rounded-lg font-bold uppercase text-xs tracking-widest transition-all ${
                  studentToDelete.user.is_active 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                }`}
              >
                {submitting ? <Loader2 className="animate-spin mx-auto" size={18} /> : (
                  studentToDelete.user.is_active ? 'Confirmar Desativação' : 'Confirmar Reativação'
                )}
              </button>
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="w-full py-3 rounded-lg font-bold uppercase text-xs tracking-widest text-gray-500 hover:text-white transition-colors"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal Visualização Assinatura */}
      {isViewModalOpen && editingStudent && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setIsViewModalOpen(false)} />
          <div className="relative bg-[#121214] border border-white/10 rounded-2xl p-8 max-w-lg w-full text-center">
            <h3 className="text-white font-bold mb-4 uppercase text-sm tracking-widest">Assinatura: {editingStudent.user.full_name}</h3>
            <div className="bg-white rounded-xl p-4 mb-6">
              <img src={editingStudent.signature_base64 || ''} alt="Assinatura" className="w-full h-auto invert brightness-0" />
            </div>
            <button onClick={() => setIsViewModalOpen(false)} className="btn-primary w-full py-3">Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
};
