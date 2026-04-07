import { Outlet, NavLink } from 'react-router-dom';
import { Home, Users, CreditCard, Activity, ShieldCheck } from 'lucide-react';

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <ShieldCheck size={32} color="var(--primary)" />
        <h2>Gestão<span className="highlight">Boxe</span></h2>
      </div>

      <nav>
        <div className="nav-section-title">Menu Principal</div>
        <ul className="nav-links">
          <li>
            <NavLink to="/" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
              <Home size={20} />
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink to="/checkin" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
              <Activity size={20} />
              Check-in Alunos
            </NavLink>
          </li>
          <li>
            <NavLink to="/alunos" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
              <Users size={20} />
              Gestão de Alunos
            </NavLink>
          </li>
          <li>
            <NavLink to="/financeiro" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
              <CreditCard size={20} />
              Financeiro
            </NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export const Layout = () => {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};
