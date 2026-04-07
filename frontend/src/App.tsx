import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          {/* Placeholder paths for future features */}
          <Route path="checkin" element={<div className="page-header"><h2>Em Construção: Check-in</h2></div>} />
          <Route path="alunos" element={<div className="page-header"><h2>Em Construção: Alunos</h2></div>} />
          <Route path="financeiro" element={<div className="page-header"><h2>Em Construção: Financeiro</h2></div>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
