import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Alunos } from './pages/Alunos';
import { Checkin } from './pages/Checkin';
import { Planos } from './pages/Planos';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="checkin" element={<Checkin />} />
          <Route path="alunos" element={<Alunos />} />
          <Route path="planos" element={<Planos />} />
          <Route path="financeiro" element={<div className="font-display font-bold text-3xl text-white"><h2>Em Construção: Financeiro</h2></div>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
