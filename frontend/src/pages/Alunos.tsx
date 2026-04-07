import { useState, useEffect } from 'react';
import { UserPlus, Search, X, Loader2, Pencil, Trash2, AlertTriangle } from 'lucide-react';

type Student = {
  id: string;
  phone: string | null;
  birth_date: string | null;
  gender: string | null;
  technical_level: string;
  medical_cert_status: string;
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

const GENDER_LABELS: Record<string, string> = {
  M: 'Masculino',
  F: 'Feminino',
  OUTRO: 'Outro',
};

const CERT_LABELS: Record<string, { label: string; color: string }> = {
  VALID: { label: 'Válido', color: 'text-emerald-400' },
  PENDING: { label: 'Pendente', color: 'text-amber-400' },
  EXPIRED: { label: 'Expirado', color: 'text-red-400' },
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

type ModalMode = 'create' | 'edit' | null;

export const Alunos = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Create / Edit modal
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);

  // Delete confirmation modal
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = students.filter((s) => {
    const matchSearch =
      s.user.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.user.cpf.includes(search);
    const matchLevel = filterLevel === '' || s.technical_level === filterLevel;
    const matchGender = filterGender === '' || s.gender === filterGender;
    const matchStatus =
      filterStatus === '' ||
      (filterStatus === 'active' && s.user.is_active) ||
      (filterStatus === 'inactive' && !s.user.is_active);
    return matchSearch && matchLevel && matchGender && matchStatus;
  });

  const hasFilters = search || filterLevel || filterGender || filterStatus;
  const clearFilters = () => { setSearch(''); setFilterLevel(''); setFilterGender(''); setFilterStatus(''); };

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

  // --- Criar ---
  const openCreateModal = () => {
    setFormData(EMPTY_FORM);
    setEditingStudent(null);
    setModalMode('create');
  };

  // --- Editar ---
  const openEditModal = (student: Student) => {
    setFormData({
      full_name: student.user.full_name,
      cpf: student.user.cpf,
      email: student.user.email,
      phone: student.phone ?? '',
      birth_date: student.birth_date ?? '',
      gender: student.gender ?? '',
      technical_level: student.technical_level,
    });
    setEditingStudent(student);
    setModalMode('edit');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let res: Response;

      if (modalMode === 'create') {
        const payload = {
          ...formData,
          birth_date: formData.birth_date || null,
          gender: formData.gender || null,
        };
        res = await fetch('http://localhost:8000/api/students/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        // edit: enviar apenas os campos alteráveis (não CPF)
        const payload = {
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone || null,
          birth_date: formData.birth_date || null,
          gender: formData.gender || null,
          technical_level: formData.technical_level,
        };
        res = await fetch(`http://localhost:8000/api/students/${editingStudent!.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const err = await res.json();
        alert(`Erro: ${err.detail}`);
        return;
      }

      setModalMode(null);
      fetchStudents();
    } catch {
      alert('Falha de conexão com a API.');
    } finally {
      setSubmitting(false);
    }
  };

  // --- Deletar ---
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch(`http://localhost:8000/api/students/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      fetchStudents();
    } catch {
      alert('Erro ao desativar aluno.');
    } finally {
      setDeleting(false);
    }
  };

  const input = 'w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white outline-none focus:border-boxing-primary transition-colors text-sm';

  return (
    <div className="flex flex-col w-full gap-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl md:text-4xl text-white">Alunos</h1>
          <p className="text-gray-400 mt-1">Gestão de matrículas e perfis dos atletas</p>
        </div>
        <button className="btn-primary w-full md:w-auto" onClick={openCreateModal}>
          <UserPlus size={18} />
          Novo Aluno
        </button>
      </header>

      {/* Table Card */}
      <div className="glass-panel overflow-hidden">
        {/* Filtros */}
        <div className="p-4 border-b border-white/5 flex flex-col gap-3">
          <div className="flex flex-wrap gap-3">
            {/* Busca */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome ou CPF..."
                className={`${input} pl-9`}
              />
            </div>

            {/* Nível Técnico */}
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-300 outline-none focus:border-boxing-primary transition-colors appearance-none cursor-pointer"
            >
              <option value="">Todos os Níveis</option>
              <option value="BEGINNER">Iniciante</option>
              <option value="AMATEUR">Amador</option>
              <option value="ATHLETE">Atleta</option>
            </select>

            {/* Sexo */}
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className="bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-300 outline-none focus:border-boxing-primary transition-colors appearance-none cursor-pointer"
            >
              <option value="">Todos os Sexos</option>
              <option value="M">Masculino</option>
              <option value="F">Feminino</option>
              <option value="OUTRO">Outro</option>
            </select>

            {/* Status */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-300 outline-none focus:border-boxing-primary transition-colors appearance-none cursor-pointer"
            >
              <option value="">Todos os Status</option>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </select>

            {/* Botão limpar filtros */}
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 border border-white/10 transition-colors flex items-center gap-1.5 whitespace-nowrap"
              >
                <X size={14} />
                Limpar filtros
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="text-xs uppercase bg-black/20 text-gray-500">
              <tr>
                <th className="px-6 py-4 font-medium tracking-wider">Aluno</th>
                <th className="px-6 py-4 font-medium tracking-wider">Contato</th>
                <th className="px-6 py-4 font-medium tracking-wider">Nível</th>
                <th className="px-6 py-4 font-medium tracking-wider">Nascimento</th>
                <th className="px-6 py-4 font-medium tracking-wider">Laudo Médico</th>
                <th className="px-6 py-4 font-medium tracking-wider">Status</th>
                <th className="px-6 py-4 font-medium tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500">
                    <Loader2 className="animate-spin inline-block mr-2" size={18} />
                    Carregando alunos...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500">
                    {search ? 'Nenhum aluno encontrado para esta busca.' : 'Nenhum aluno cadastrado ainda.'}
                  </td>
                </tr>
              ) : (
                filtered.map((student) => {
                  const cert = CERT_LABELS[student.medical_cert_status] ?? { label: '-', color: 'text-gray-400' };
                  const isActive = student.user.is_active;
                  const birthDate = student.birth_date
                    ? new Date(student.birth_date).toLocaleDateString('pt-BR')
                    : '—';
                  return (
                    <tr
                      key={student.id}
                      className={`border-b border-white/5 hover:bg-white/5 transition-colors ${!isActive ? 'opacity-50' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-white">{student.user.full_name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{student.user.cpf}</div>
                        {student.gender && (
                          <div className="text-xs text-gray-600 mt-0.5">{GENDER_LABELS[student.gender] ?? student.gender}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div>{student.user.email}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{student.phone ?? 'Sem telefone'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-white/10 text-gray-300">
                          {LEVEL_LABELS[student.technical_level] ?? student.technical_level}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-xs">{birthDate}</td>
                      <td className={`px-6 py-4 font-medium ${cert.color}`}>{cert.label}</td>
                      <td className="px-6 py-4">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-500/15 text-gray-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" />
                            Inativo
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            title="Editar aluno"
                            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                            onClick={() => openEditModal(student)}
                          >
                            <Pencil size={16} />
                          </button>
                          {isActive && (
                            <button
                              title="Desativar aluno"
                              className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              onClick={() => setDeleteTarget(student)}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer count */}
        {!loading && (
          <div className="px-6 py-3 border-t border-white/5 text-xs text-gray-500">
            {filtered.length} aluno{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* ======= MODAL CRIAR / EDITAR ======= */}
      {modalMode !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setModalMode(null)}
          />
          <div
            className="relative bg-zinc-900 border border-white/10 shadow-2xl rounded-2xl w-full max-w-lg p-6 sm:p-8 overflow-y-auto max-h-[90vh]"
            style={{ animation: 'modalIn 0.2s ease-out' }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display text-2xl font-bold text-white">
                {modalMode === 'create' ? 'Cadastrar Aluno' : 'Editar Aluno'}
              </h2>
              <button onClick={() => setModalMode(null)} className="text-gray-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Nome Completo *</label>
                <input required type="text" value={formData.full_name}
                  onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                  className={input} placeholder="Ex: Muhammad Ali" />
              </div>

              {/* CPF + Telefone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">CPF *</label>
                  <input required type="text" value={formData.cpf}
                    onChange={e => setFormData({ ...formData, cpf: e.target.value })}
                    className={`${input} ${modalMode === 'edit' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    placeholder="000.000.000-00"
                    disabled={modalMode === 'edit'}
                    title={modalMode === 'edit' ? 'O CPF não pode ser alterado' : ''} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Telefone</label>
                  <input type="text" value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className={input} placeholder="(00) 00000-0000" />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">E-mail *</label>
                <input required type="email" value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className={input} placeholder="email@exemplo.com" />
              </div>

              {/* Nascimento + Sexo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Data de Nascimento</label>
                  <input type="date" value={formData.birth_date}
                    onChange={e => setFormData({ ...formData, birth_date: e.target.value })}
                    className={`${input} [color-scheme:dark]`} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Sexo</label>
                  <select value={formData.gender}
                    onChange={e => setFormData({ ...formData, gender: e.target.value })}
                    className={`${input} appearance-none`}>
                    <option className="bg-zinc-800" value="">Prefiro não informar</option>
                    <option className="bg-zinc-800" value="M">Masculino</option>
                    <option className="bg-zinc-800" value="F">Feminino</option>
                    <option className="bg-zinc-800" value="OUTRO">Outro</option>
                  </select>
                </div>
              </div>

              {/* Nível Técnico */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Nível Técnico</label>
                <select value={formData.technical_level}
                  onChange={e => setFormData({ ...formData, technical_level: e.target.value })}
                  className={`${input} appearance-none`}>
                  <option className="bg-zinc-800" value="BEGINNER">Iniciante</option>
                  <option className="bg-zinc-800" value="AMATEUR">Amador (Competição)</option>
                  <option className="bg-zinc-800" value="ATHLETE">Atleta Profissional</option>
                </select>
              </div>

              <div className="mt-4 pt-4 border-t border-white/10 flex justify-end gap-3">
                <button type="button" onClick={() => setModalMode(null)}
                  className="px-5 py-2.5 rounded-lg font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting
                    ? <Loader2 className="animate-spin" size={18} />
                    : modalMode === 'create' ? 'Finalizar Cadastro' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======= MODAL CONFIRMAR EXCLUSÃO ======= */}
      {deleteTarget !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !deleting && setDeleteTarget(null)}
          />
          <div
            className="relative bg-zinc-900 border border-red-500/20 shadow-2xl rounded-2xl w-full max-w-md p-6 sm:p-8"
            style={{ animation: 'modalIn 0.2s ease-out' }}
          >
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="text-red-400" size={28} />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-white">Desativar Aluno</h2>
                <p className="text-gray-400 mt-2 text-sm">
                  Tem certeza que deseja desativar o aluno{' '}
                  <span className="text-white font-semibold">{deleteTarget.user.full_name}</span>?
                  <br />
                  O cadastro será mantido, mas o acesso ficará bloqueado.
                </p>
              </div>
              <div className="flex gap-3 w-full mt-2">
                <button
                  className="flex-1 px-5 py-2.5 rounded-lg font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors border border-white/10"
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                >
                  Cancelar
                </button>
                <button
                  className="flex-1 px-5 py-2.5 rounded-lg font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                >
                  {deleting ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={16} />}
                  Desativar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes modalIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
};
