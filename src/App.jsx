import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Users from './components/Users';
import Tournaments from './components/Tournaments';
import Rules from './components/Rules';

function Sidebar() {
  const location = useLocation();
  return (
    <div className="sidebar">
      <div style={{ textAlign: 'center', margin: '1rem 0' }}>
        <img src="/logo.jpg" alt="Logo PRODEROSO" style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover' }} />
      </div>
      <h2 className="sidebar-title">PRODEROSO Admin</h2>
      <div className="nav-links">
        <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Dashboard</Link>
        <Link to="/users" className={location.pathname === '/users' ? 'active' : ''}>Gestión de Usuarios</Link>
        <Link to="/tournaments" className={location.pathname === '/tournaments' ? 'active' : ''}>Torneos & Resultados</Link>
        <Link to="/rules" className={location.pathname === '/rules' ? 'active' : ''}>Reglamento</Link>
      </div>
    </div>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === 'admi' && password === 'Pastor910') {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Usuario o contraseña incorrectos');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="login-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f4f6f8', width: '100vw' }}>
        <div className="login-box" style={{ background: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <img src="/logo.jpg" alt="Logo PRODEROSO" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }} />
          </div>
          <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#333' }}>PRODEROSO Admin</h2>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#666' }}>Usuario</label>
              <input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                required 
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#666' }}>Contraseña</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                required 
              />
            </div>
            {error && <div style={{ color: 'red', fontSize: '0.875rem' }}>{error}</div>}
            <button type="submit" style={{ padding: '0.75rem', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginTop: '0.5rem' }}>
              Ingresar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Sidebar />
      <div className="content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/users" element={<Users />} />
          <Route path="/tournaments" element={<Tournaments />} />
          <Route path="/rules" element={<Rules />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
