import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Alunos } from './pages/Alunos';
import { Checkin } from './pages/Checkin';
import { Planos } from './pages/Planos';
import { Financeiro } from './pages/Financeiro';
import { Relatorios } from './pages/Relatorios';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="checkin" element={<Checkin />} />
          <Route path="alunos" element={<Alunos />} />
          <Route path="planos" element={<Planos />} />
          <Route path="financeiro" element={<Financeiro />} />
          <Route path="relatorios" element={<Relatorios />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
