import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import Login from './components/Login';
import Predict from './components/Predict';
import Ranking from './components/Ranking';
import Rules from './components/Rules';

function Layout() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('prode_user');
    if (saved) {
      setUser(JSON.parse(saved));
    } else {
      navigate('/');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('prode_user');
    setUser(null);
    navigate('/');
  };

  return (
    <>
      <header>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/oso.png" alt="Logo PRODEROSO" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
          <h1 style={{ margin: 0 }}>🏆 PRODEROSO</h1>
        </div>
        {user && (
          <nav>
            <Link to="/predict">Pronósticos</Link>
            <Link to="/ranking">Ranking</Link>
            <Link to="/rules">Reglamento</Link>
            <button style={{ marginLeft: '1rem', padding: '0.4rem 1rem' }} onClick={handleLogout}>Salir</button>
          </nav>
        )}
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/predict" element={<Predict />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/rules" element={<Rules />} />
        </Routes>
      </main>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}

export default App;
