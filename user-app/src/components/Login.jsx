import { useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [alias, setAlias] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!alias.trim() || !password.trim()) return;
    
    setLoading(true);
    try {
      const q = query(collection(db, 'usuarios'), where('alias', '==', alias));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        alert("El usuario no existe. Pide al administrador que te registre.");
        setLoading(false);
        return;
      }
      
      const userData = { id: snap.docs[0].id, ...snap.docs[0].data() };
      
      // Verify password (plain text as requested)
      if (userData.contrasena !== password) {
        alert("Contraseña incorrecta.");
        setLoading(false);
        return;
      }
      
      localStorage.setItem('prode_user', JSON.stringify(userData));
      navigate('/predict');
    } catch (error) {
      console.error(error);
      alert("Error al conectar con el servidor.");
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '0.5rem' }}>Bienvenido a PRODEROSO</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Ingresa tus credenciales para jugar</p>
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input 
            type="text" 
            placeholder="Tu Alias" 
            value={alias} 
            onChange={(e) => setAlias(e.target.value)} 
            style={{ textAlign: 'center', fontSize: '1.2rem' }}
            required
            autoCapitalize="none"
          />
          <input 
            type="password" 
            placeholder="Contraseña" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            style={{ textAlign: 'center', fontSize: '1.2rem', marginBottom: '1rem' }}
            required
          />
          <button type="submit" disabled={loading} style={{ width: '100%', fontSize: '1.1rem' }}>
            {loading ? 'Verificando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
