import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export default function Dashboard() {
  const [stats, setStats] = useState({ users: 0, activeTournaments: 0, predictions: 0 });
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const usersSnap = await getDocs(collection(db, "usuarios"));
        const trnSnap = await getDocs(query(collection(db, "torneos"), where("activo", "==", true)));
        const predSnap = await getDocs(collection(db, "pronosticos"));
        
        setStats({
          users: usersSnap.size,
          activeTournaments: trnSnap.size,
          predictions: predSnap.size
        });

        // Get users and sort by global points
        const usersList = usersSnap.docs.map(d => ({id: d.id, ...d.data()}));
        const sorted = usersList.sort((a,b) => (b.puntaje || 0) - (a.puntaje || 0));
        setRanking(sorted.slice(0, 20)); // Top 20 for admin view
      } catch (e) {
        console.error("Error cargando dashboard:", e);
      }
      setLoading(false);
    };
    fetchDashboardData();
  }, []);

  return (
    <div>
      <div className="flex-between mb-4">
        <h1 className="mb-0" style={{ fontSize: '2rem', fontWeight: '800' }}>Panel General</h1>
        <span className="badge success" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
          Sistema Activo
        </span>
      </div>
      
      <div className="grid-2">
        <div className="card" style={{ background: 'linear-gradient(145deg, rgba(30,41,59,0.9), rgba(15,23,42,0.9))' }}>
          <h2 style={{ color: 'var(--primary)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Estadísticas del Sistema</h2>
          <div className="mt-4" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '0.5rem' }}>
              <div>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Jugadores Registrados</p>
                <h3 style={{ margin: 0, fontSize: '2.5rem', color: '#f8fafc' }}>{stats.users}</h3>
              </div>
              <div style={{ fontSize: '3rem' }}>👥</div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '0.5rem' }}>
              <div>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Torneos Activos</p>
                <h3 style={{ margin: 0, fontSize: '2.5rem', color: 'var(--primary)' }}>{stats.activeTournaments}</h3>
              </div>
              <div style={{ fontSize: '3rem' }}>🏆</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '0.5rem' }}>
              <div>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Total de Pronósticos</p>
                <h3 style={{ margin: 0, fontSize: '2.5rem', color: 'var(--success)' }}>{stats.predictions}</h3>
              </div>
              <div style={{ fontSize: '3rem' }}>📝</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
            <h2 style={{ color: 'var(--primary)', margin: 0 }}>Ranking Actualizado (Top 20)</h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>* Se actualiza en tiempo real</span>
          </div>
          
          {loading ? (
            <p style={{ textAlign: 'center', padding: '2rem' }}>Cargando datos...</p>
          ) : (
            <div style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              <table style={{ width: '100%' }}>
                <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 1 }}>
                  <tr>
                    <th style={{ textAlign: 'center' }}>Posición</th>
                    <th>Alias / Usuario</th>
                    <th style={{ textAlign: 'center' }}>Puntos Globales</th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.length === 0 ? (
                    <tr><td colSpan="3" style={{ textAlign: 'center', padding: '2rem' }}>No hay datos en el ranking.</td></tr>
                  ) : ranking.map((u, i) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s', cursor: 'default' }} onMouseOver={(e) => e.currentTarget.style.background='rgba(99,102,241,0.1)'} onMouseOut={(e) => e.currentTarget.style.background='transparent'}>
                      <td style={{ textAlign: 'center', fontWeight: 'bold', fontSize: i < 3 ? '1.2rem' : '1rem', color: i===0?'#ffd700':i===1?'#c0c0c0':i===2?'#cd7f32':'var(--text-main)' }}>
                        #{i + 1}
                      </td>
                      <td style={{ fontWeight: '600' }}>{u.alias || u.nombre || "Usuario " + u.id.slice(0,4)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="badge" style={{ background: 'rgba(16,185,129,0.2)', color: 'var(--success)', padding: '0.4rem 1rem', fontSize: '1rem', fontWeight: 'bold' }}>
                          {u.puntaje || 0} pts
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
