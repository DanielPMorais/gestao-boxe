import { useState, useEffect } from 'react';
import { FileDown, Users, CreditCard, FileText, Download, TrendingUp } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Types ───────────────────────────────────────────────────────────────────
type Student = {
  id: string;
  user: { full_name: string; cpf: string; email: string };
  technical_level: string;
  is_enrolled: boolean;
};

type Invoice = {
  id: string;
  amount: number;
  due_date: string;
  status: string;
  enrollment?: { student?: { user?: { full_name: string } } };
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const BRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const EXPORT_CARD_CLS = "glass-panel p-6 flex flex-col gap-4 hover:-translate-y-1 transition-all border border-white/5 hover:border-boxing-primary/30 group";

// ─── Component ───────────────────────────────────────────────────────────────
export const Relatorios = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rs, ri] = await Promise.all([
          fetch('http://localhost:8000/api/students/'),
          fetch('http://localhost:8000/api/invoices/')
        ]);
        if (rs.ok) setStudents(await rs.json());
        if (ri.ok) setInvoices(await ri.json());
      } catch (e) { console.error("Erro ao carregar dados:", e); }
    };
    fetchData();
  }, []);

  // ── CSV Export ──
  const exportStudentsCSV = () => {
    const headers = ["Nome", "CPF", "Email", "Nivel Tecnico", "Matriculado"];
    const rows = students.map(s => [
      s.user.full_name,
      s.user.cpf,
      s.user.email,
      s.technical_level,
      s.is_enrolled ? "Sim" : "Nao"
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_alunos_${new Date().toISOString().slice(0, 10)}.csv`);
    link.click();
  };

  // ── PDF Export ──
  const exportFinancialPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(239, 68, 68); // boxing-primary
    doc.text("GESTÃO BOXE", 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Relatório Financeiro Gerencial - Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);
    
    // Metrics
    const paid = invoices.filter(i => i.status === 'PAID');
    const totalPaid = paid.reduce((acc, i) => acc + Number(i.amount), 0);
    
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Resumo Total Recebido: ${BRL(totalPaid)}`, 14, 45);
    doc.text(`Total de Faturas Pagas: ${paid.length}`, 14, 52);

    // Table
    autoTable(doc, {
      startY: 60,
      head: [['Aluno', 'Vencimento', 'Valor', 'Status']],
      body: invoices.map(i => [
        i.enrollment?.student?.user?.full_name || "N/A",
        new Date(i.due_date).toLocaleDateString('pt-BR'),
        BRL(Number(i.amount)),
        i.status
      ]),
      headStyles: { fillColor: [239, 68, 68] },
      theme: 'striped',
    });

    doc.save(`financeiro_boxe_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="flex flex-col w-full gap-8">
      <header>
        <h1 className="font-display font-bold text-3xl md:text-4xl text-white">Relatórios Gerenciais</h1>
        <p className="text-gray-400 mt-1">Exporte dados estratégicos para CSV ou PDF profissional.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card Alunos */}
        <div className={EXPORT_CARD_CLS}>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <Users size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors">Listagem de Atletas</h3>
            <p className="text-gray-500 text-sm">Dados cadastrais, níveis técnicos e status de matrícula ativa.</p>
          </div>
          <button 
            onClick={exportStudentsCSV}
            className="mt-2 flex items-center justify-center gap-2 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white px-4 py-2.5 rounded-lg transition-all text-xs font-bold uppercase tracking-widest"
          >
            <Download size={16} /> Exportar CSV
          </button>
        </div>

        {/* Card Financeiro */}
        <div className={EXPORT_CARD_CLS}>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <CreditCard size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">Relatório Financeiro</h3>
            <p className="text-gray-500 text-sm">Resumo de faturamento, pagamentos pendentes e histórico de mensalidades.</p>
          </div>
          <button 
            onClick={exportFinancialPDF}
            className="mt-2 flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white px-4 py-2.5 rounded-lg transition-all text-xs font-bold uppercase tracking-widest"
          >
            <FileText size={16} /> Gerar PDF Profissional
          </button>
        </div>

        {/* Card Desempenho (Mental Model) */}
        <div className={EXPORT_CARD_CLS}>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
            <TrendingUp size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-amber-400 transition-colors">Status de Ocupação</h3>
            <p className="text-gray-500 text-sm">Visão geral da ocupação dos horários e alunos por plano.</p>
          </div>
          <button 
            disabled 
            className="mt-2 flex items-center justify-center gap-2 bg-white/5 text-gray-600 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest cursor-not-allowed"
          >
             Em breve
          </button>
        </div>
      </div>

      <div className="glass-panel p-8 flex flex-col items-center justify-center text-center gap-4 bg-boxing-primary/5 border-boxing-primary/20">
        <div className="w-16 h-16 rounded-full bg-boxing-primary/10 flex items-center justify-center text-boxing-primary">
          <FileDown size={32} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white mb-2">Exportação Automática</h2>
          <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
            Todos os relatórios são gerados localmente no seu navegador para maior privacidade e rapidez. Utilize o CSV para planilhas e o PDF para apresentações formais.
          </p>
        </div>
      </div>
    </div>
  );
};
