import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Users from './components/Users';
import Tournaments from './components/Tournaments';

function Sidebar() {
  const location = useLocation();
  return (
    <div className="sidebar">
      <h2 className="sidebar-title">PRODEROSO Admin</h2>
      <div className="nav-links">
        <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Dashboard</Link>
        <Link to="/users" className={location.pathname === '/users' ? 'active' : ''}>Gestión de Usuarios</Link>
        <Link to="/tournaments" className={location.pathname === '/tournaments' ? 'active' : ''}>Torneos & Resultados</Link>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Sidebar />
      <div className="content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/users" element={<Users />} />
          <Route path="/tournaments" element={<Tournaments />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
