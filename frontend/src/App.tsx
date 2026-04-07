import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Alunos } from './pages/Alunos';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          {/* Placeholder paths for future features */}
          <Route path="checkin" element={<div className="font-display font-bold text-3xl text-white"><h2>Em Construção: Check-in</h2></div>} />
          <Route path="alunos" element={<Alunos />} />
          <Route path="financeiro" element={<div className="font-display font-bold text-3xl text-white"><h2>Em Construção: Financeiro</h2></div>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
