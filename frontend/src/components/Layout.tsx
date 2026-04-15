import { Outlet, NavLink } from 'react-router-dom';
import { Home, Users, CreditCard, Activity, BookOpen, FileBarChart } from 'lucide-react';

const Sidebar = () => {
  return (
    <aside className="w-full md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-boxing-border bg-boxing-surface p-4 md:p-6 flex flex-row md:flex-col gap-4 md:gap-8 justify-between items-center md:items-stretch z-10 sticky top-0 md:top-auto overflow-hidden shadow-md md:shadow-none">

      <div className="flex items-center gap-3 text-white">
        <h2 className="font-display font-bold text-lg md:text-xl whitespace-nowrap block">Gestão<span className="text-boxing-primary uppercase">Boxe</span></h2>
      </div>

      <nav className="flex-1 flex justify-end md:justify-start w-auto md:w-full overflow-x-auto no-scrollbar">

        <ul className="flex flex-row md:flex-col gap-2 w-auto md:w-full">
          <li>
            <NavLink to="/" className={({ isActive }) => `flex items-center gap-3 px-3 md:px-4 py-2 md:py-3 rounded md:rounded-lg font-display font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all border-b-2 md:border-b-0 md:border-l-4 ${isActive ? 'border-boxing-primary text-boxing-primary bg-boxing-primary/10' : 'border-transparent'}`}>
              <Home className="w-5 h-5 shrink-0" />
              <span className="hidden md:inline">Dashboard</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/checkin" className={({ isActive }) => `flex items-center gap-3 px-3 md:px-4 py-2 md:py-3 rounded md:rounded-lg font-display font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all border-b-2 md:border-b-0 md:border-l-4 ${isActive ? 'border-boxing-primary text-boxing-primary bg-boxing-primary/10' : 'border-transparent'}`}>
              <Activity className="w-5 h-5 shrink-0" />
              <span className="hidden md:inline">Check-in</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/alunos" className={({ isActive }) => `flex items-center gap-3 px-3 md:px-4 py-2 md:py-3 rounded md:rounded-lg font-display font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all border-b-2 md:border-b-0 md:border-l-4 ${isActive ? 'border-boxing-primary text-boxing-primary bg-boxing-primary/10' : 'border-transparent'}`}>
              <Users className="w-5 h-5 shrink-0" />
              <span className="hidden md:inline">Alunos</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/financeiro" className={({ isActive }) => `flex items-center gap-3 px-3 md:px-4 py-2 md:py-3 rounded md:rounded-lg font-display font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all border-b-2 md:border-b-0 md:border-l-4 ${isActive ? 'border-boxing-primary text-boxing-primary bg-boxing-primary/10' : 'border-transparent'}`}>
              <CreditCard className="w-5 h-5 shrink-0" />
              <span className="hidden md:inline">Financeiro</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/planos" className={({ isActive }) => `flex items-center gap-3 px-3 md:px-4 py-2 md:py-3 rounded md:rounded-lg font-display font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all border-b-2 md:border-b-0 md:border-l-4 ${isActive ? 'border-boxing-primary text-boxing-primary bg-boxing-primary/10' : 'border-transparent'}`}>
              <BookOpen className="w-5 h-5 shrink-0" />
              <span className="hidden md:inline">Planos</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/relatorios" className={({ isActive }) => `flex items-center gap-3 px-3 md:px-4 py-2 md:py-3 rounded md:rounded-lg font-display font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all border-b-2 md:border-b-0 md:border-l-4 ${isActive ? 'border-boxing-primary text-boxing-primary bg-boxing-primary/10' : 'border-transparent'}`}>
              <FileBarChart className="w-5 h-5 shrink-0" />
              <span className="hidden md:inline">Relatórios</span>
            </NavLink>
          </li>
        </ul>
      </nav>

    </aside>
  );
};

export const Layout = () => {
  return (
    <div className="flex flex-col md:flex-row min-h-screen w-full max-w-[100vw] overflow-x-hidden relative">
      <Sidebar />
      <main className="flex-1 w-full max-w-full overflow-y-auto p-4 md:p-8 lg:p-10">
        <div className="w-full max-w-7xl mx-auto flex flex-col gap-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
