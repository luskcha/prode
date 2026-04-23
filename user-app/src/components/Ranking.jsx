import { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export default function Ranking() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const q = query(collection(db, 'usuarios'), orderBy('puntaje', 'desc'), limit(50));
        const snap = await getDocs(q);
        setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchRanking();
  }, []);

  if (loading) return <div style={{ textAlign: 'center', marginTop: '3rem' }}>Cargando ranking...</div>;

  return (
    <div className="card">
      <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>🏆 Ranking Global</h2>
      
      <table className="ranking-table">
        <thead>
          <tr>
            <th>Posición</th>
            <th>Jugador</th>
            <th style={{ textAlign: 'right' }}>Puntos</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u, i) => (
            <tr key={u.id} className="rank-row">
              <td className={`rank-${i + 1}`}>
                {i === 0 ? '🥇 1º' : i === 1 ? '🥈 2º' : i === 2 ? '🥉 3º' : `${i + 1}º`}
              </td>
              <td style={{ fontWeight: i < 3 ? 'bold' : 'normal' }}>{u.alias}</td>
              <td style={{ textAlign: 'right' }}>
                <span className="badge-points">{u.puntaje || 0} pts</span>
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr><td colSpan="3" style={{ textAlign: 'center', padding: '2rem' }}>Aún no hay puntos registrados.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
