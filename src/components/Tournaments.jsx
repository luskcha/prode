import { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, updateDoc, query, where, writeBatch } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export default function Tournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [matches, setMatches] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  
  // Create New
  const [showCreate, setShowCreate] = useState(false);
  const [newTName, setNewTName] = useState('');
  const [newMatches, setNewMatches] = useState(Array(15).fill({ local: '', visitante: '' }));

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const snap = await getDocs(collection(db, "torneos"));
      setTournaments(snap.docs.map(d => ({id: d.id, ...d.data()})));
    } catch(e) { console.error(e) }
  };

  const fetchMatches = async (tId) => {
    try {
      const snap = await getDocs(query(collection(db, "partidos"), where("torneo_id", "==", tId)));
      setMatches(snap.docs.map(d => ({id: d.id, ...d.data()})));
    } catch(e) { console.error(e) }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const tId = Date.now().toString(); // simple ID
      await setDoc(doc(db, "torneos", tId), {
        nombre: newTName,
        activo: true,
        fecha_creacion: new Date()
      });

      const batch = writeBatch(db);
      newMatches.forEach((m, i) => {
        const matchRef = doc(collection(db, "partidos"));
        batch.set(matchRef, {
          torneo_id: tId,
          local: m.local,
          visitante: m.visitante,
          resultado_real: null, // L, E, V
          orden: i + 1
        });
      });
      await batch.commit();
      
      setShowCreate(false);
      fetchTournaments();
    } catch (error) {
      console.error("Error creating tournament", error);
    }
  };

  const updateMatchProperty = (index, field, value) => {
    const updated = [...newMatches];
    updated[index] = { ...updated[index], [field]: value };
    setNewMatches(updated);
  };

  const handleResultChange = async (matchId, result) => {
    try {
      const finalResult = result === "" ? null : result;
      await updateDoc(doc(db, "partidos", matchId), {
        resultado_real: finalResult
      });
      await fetchMatches(selectedTournament.id);
      recalculateRanking(); // Automatically update users' points
    } catch (error) {
      console.error(error);
    }
  };

  const recalculateRanking = async () => {
    try {
      // 1. Fetch all predictions, matches and users
      const [predSnap, matchSnap, usersSnap] = await Promise.all([
        getDocs(collection(db, "pronosticos")),
        getDocs(collection(db, "partidos")),
        getDocs(collection(db, "usuarios"))
      ]);

      const predictions = predSnap.docs.map(d => d.data());
      const allMatches = matchSnap.docs.map(d => ({id: d.id, ...d.data()}));
      
      const userPoints = {};
      usersSnap.docs.forEach(u => { userPoints[u.id] = 0; });

      // 2. Count points
      predictions.forEach(p => {
        const match = allMatches.find(m => m.id === p.partido_id);
        if (match && match.resultado_real && match.resultado_real === p.prediccion) {
          if (userPoints[p.usuario_id] !== undefined) {
             userPoints[p.usuario_id] += 1;
          }
        }
      });

      // 3. Update users in batch
      const batch = writeBatch(db);
      for (const [uid, pts] of Object.entries(userPoints)) {
        batch.update(doc(db, "usuarios", uid), { puntaje: pts });
      }
      await batch.commit();
      console.log("Ranking recalculado exitosamente");
    } catch (e) {
      console.error("Error recalculando ranking", e);
    }
  };

  return (
    <div>
      <div className="flex-between mb-4">
        <h2>Torneos y Resultados</h2>
        <button onClick={() => setShowCreate(!showCreate)}>+ Nuevo PRODE</button>
      </div>

      {showCreate ? (
        <div className="card mb-4">
          <h3>Crear Nuevo PRODE (15 Partidos)</h3>
          <form onSubmit={handleCreate}>
            <input 
              type="text" 
              placeholder="Nombre del torneo (Ej: Fecha 12 - LPF)"
              value={newTName}
              onChange={(e) => setNewTName(e.target.value)}
              required
              className="mb-4"
            />
            {newMatches.map((m, i) => (
              <div key={i} className="grid-2 mb-4" style={{gap: '1rem', alignItems: 'center'}}>
                <span>Partido {i+1}</span>
                <div style={{display: 'flex', gap: '0.5rem'}}>
                  <input placeholder="Local" value={m.local} onChange={(e) => updateMatchProperty(i, 'local', e.target.value)} required />
                  <span style={{alignSelf: 'center'}}>VS</span>
                  <input placeholder="Visitante" value={m.visitante} onChange={(e) => updateMatchProperty(i, 'visitante', e.target.value)} required />
                </div>
              </div>
            ))}
            <div className="flex-between mt-4">
              <button type="button" className="danger" onClick={() => setShowCreate(false)}>Cancelar</button>
              <button type="submit">Guardar Torneo</button>
            </div>
          </form>
        </div>
      ) : (
        <div className="grid-2">
          <div className="card">
            <h3>Torneos Activos</h3>
            <table className="mt-4">
              <thead><tr><th>Nombre</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody>
                {tournaments.map(t => (
                  <tr key={t.id}>
                    <td>{t.nombre}</td>
                    <td>{t.activo ? 'Activo' : 'Finalizado'}</td>
                    <td>
                      <button onClick={() => {
                        setSelectedTournament(t);
                        fetchMatches(t.id);
                      }}>Ver Partidos</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedTournament && (
            <div className="card">
              <h3>Partidos - {selectedTournament.nombre}</h3>
              <p className="mb-4" style={{color: 'var(--text-muted)'}}>Cargue el resultado real. El ranking se actualizará automáticamente.</p>
              {matches.sort((a,b) => a.orden - b.orden).map(m => (
                <div key={m.id} className="mb-4" style={{background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '0.5rem'}}>
                  <div className="flex-between">
                    <strong>{m.local} vs {m.visitante}</strong>
                    <select 
                      value={m.resultado_real || ''} 
                      onChange={(e) => handleResultChange(m.id, e.target.value)}
                      style={{width: 'auto'}}
                    >
                      <option value="">Pendiente</option>
                      <option value="L">Local ({m.local})</option>
                      <option value="E">Empate</option>
                      <option value="V">Visitante ({m.visitante})</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
