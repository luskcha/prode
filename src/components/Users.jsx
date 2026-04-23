import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, addDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [creditAmount, setCreditAmount] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Create User state
  const [showCreate, setShowCreate] = useState(false);
  const [newUser, setNewUser] = useState({
    nombre: '',
    alias: '',
    ultimos_dni: '',
    contrasena: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "usuarios"));
      const usersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersList);
    } catch (error) {
      console.error("Error fetching users. Check Firebase config.", error);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Check if alias already exists
      const q = query(collection(db, "usuarios"), where("alias", "==", newUser.alias));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        alert("El alias ya existe. Elige otro.");
        setLoading(false);
        return;
      }
      
      // Save directly to firestore
      await addDoc(collection(db, "usuarios"), {
        nombre: newUser.nombre,
        alias: newUser.alias,
        ultimos_dni: newUser.ultimos_dni,
        contrasena: newUser.contrasena,
        credito: 0,
        puntaje: 0,
        fecha_registro: serverTimestamp()
      });
      
      setNewUser({ nombre: '', alias: '', ultimos_dni: '', contrasena: '' });
      setShowCreate(false);
      fetchUsers();
      alert("Usuario creado correctamente.");
    } catch(err) {
      console.error("Error al crear usuario", err);
      alert("Falla de conexión con Firebase. Asegúrate de tener la configuración correcta en firebaseConfig.js");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;
    const confirmReset = window.confirm(`¿Estás seguro que deseas blanquear la contraseña de ${selectedUser.alias}? Se cambiará a: 123456`);
    if (!confirmReset) return;

    setLoading(true);
    try {
      await updateDoc(doc(db, "usuarios", selectedUser.id), {
        contrasena: '123456'
      });
      alert('Contraseña blanqueada con éxito. La nueva clave es: 123456');
      fetchUsers();
    } catch (error) {
      console.error("Error reseteando", error);
      alert('Hubo un error al blanquear la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCredits = async (e) => {
    e.preventDefault();
    if (!selectedUser || !creditAmount) return;

    setLoading(true);
    const amount = parseInt(creditAmount);
    const newBalance = (selectedUser.credito || 0) + amount;

    try {
      // 1. Update User
      await updateDoc(doc(db, "usuarios", selectedUser.id), {
        credito: newBalance
      });

      // 2. Register Movement
      await addDoc(collection(db, "movimientos_credito"), {
        usuario_id: selectedUser.id,
        monto: Math.abs(amount),
        tipo: amount > 0 ? 'suma' : 'resta',
        fecha: serverTimestamp()
      });

      setSelectedUser(null);
      setCreditAmount('');
      fetchUsers();
    } catch(err) {
      console.error("Error updating credits", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    (u.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.alias || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex-between mb-4">
        <h2>Gestión de Usuarios</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <input 
            type="text" 
            placeholder="Buscar por nombre o alias..." 
            style={{width: '300px'}}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button onClick={() => { setShowCreate(!showCreate); setSelectedUser(null); }}>
            {showCreate ? 'Ver Lista' : '+ Nuevo Usuario'}
          </button>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3>Lista de Usuarios</h3>
          <table className="mt-4">
            <thead>
              <tr>
                <th>Alias</th>
                <th>Nombre</th>
                <th>DNI (últ. 3)</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr><td colSpan="4">No hay usuarios.</td></tr>
              ) : filteredUsers.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{u.alias}</td>
                  <td>{u.nombre}</td>
                  <td>{u.ultimos_dni || '-'}</td>
                  <td>
                    <button style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => { setSelectedUser(u); setShowCreate(false); }}>Modificar / Crédito</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showCreate && (
          <div className="card" style={{ border: '1px solid var(--primary)' }}>
            <h3 style={{ color: 'var(--primary)' }}>Crear Nuevo Usuario</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Complete los datos para generar el acceso.</p>
            
            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Nombre Completo</label>
                <input 
                  type="text" 
                  value={newUser.nombre}
                  onChange={(e) => setNewUser({...newUser, nombre: e.target.value})}
                  required
                />
              </div>
              
              <div className="grid-2" style={{ gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Alias</label>
                  <input 
                    type="text" 
                    value={newUser.alias}
                    onChange={(e) => setNewUser({...newUser, alias: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Últimos 3 DNI</label>
                  <input 
                    type="text" 
                    maxLength="3"
                    pattern="[0-9]{3}"
                    title="Deben ser exactamente 3 números"
                    value={newUser.ultimos_dni}
                    onChange={(e) => setNewUser({...newUser, ultimos_dni: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Contraseña</label>
                <input 
                  type="text"
                  value={newUser.contrasena}
                  onChange={(e) => setNewUser({...newUser, contrasena: e.target.value})}
                  required
                />
              </div>

              <div className="flex-between mt-4">
                <button type="button" className="danger" onClick={() => setShowCreate(false)}>Cancelar</button>
                <button type="submit" disabled={loading}>
                  {loading ? 'Guardando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        )}

        {selectedUser && (
          <div className="card">
            <h3>Modificar Usuario: {selectedUser.nombre || selectedUser.alias}</h3>
            
            <div style={{ background: 'rgba(255,0,0,0.1)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', marginTop: '1rem', border: '1px solid var(--danger)' }}>
              <h4 style={{ color: 'var(--danger)', margin: '0 0 0.5rem 0' }}>Seguridad</h4>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem' }}>Si el usuario olvidó su contraseña, puedes reiniciarla a "123456".</p>
              <button className="danger" disabled={loading} onClick={handleResetPassword}>Blanquear Contraseña</button>
            </div>

            <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '1.5rem 0' }} />

            <h4 style={{ margin: '0 0 1rem 0' }}>Gestión de Créditos</h4>
            <p>Saldo Actual: <span className="badge success">{selectedUser.credito || 0}</span></p>
            <form onSubmit={handleUpdateCredits} className="mt-4" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label>Monto a sumar o restar (use negativo para restar):</label>
                <input 
                  type="number" 
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  placeholder="Ej: 50 o -20"
                  required
                  className="mt-4"
                />
              </div>
              <div className="flex-between">
                <button type="button" className="danger" onClick={() => setSelectedUser(null)}>Cerrar Panel</button>
                <button type="submit" disabled={loading}>
                  {loading ? 'Guardando...' : 'Aplicar Cambios de Crédito'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
