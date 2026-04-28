import { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, updateDoc, query, where, writeBatch } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export default function Tournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [matches, setMatches] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [winnersModal, setWinnersModal] = useState(null);
  
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

  const calculateWinners = async (tId) => {
    try {
      const [matchSnap, predSnap, usersSnap] = await Promise.all([
        getDocs(query(collection(db, "partidos"), where("torneo_id", "==", tId))),
        getDocs(collection(db, "pronosticos")),
        getDocs(collection(db, "usuarios"))
      ]);

      const tMatches = matchSnap.docs.map(d => ({id: d.id, ...d.data()}));
      const allPreds = predSnap.docs.map(d => d.data());
      const usersList = usersSnap.docs.map(d => ({id: d.id, ...d.data()}));

      const matchIds = tMatches.map(m => m.id);
      const tPreds = allPreds.filter(p => matchIds.includes(p.partido_id));

      const pointsPerUser = {};
      tPreds.forEach(p => {
        const match = tMatches.find(m => m.id === p.partido_id);
        if (match && match.resultado_real && match.resultado_real === p.prediccion) {
           pointsPerUser[p.usuario_id] = (pointsPerUser[p.usuario_id] || 0) + 1;
        }
      });

      const winners13 = [];
      const winners8 = [];
      
      for (const [uid, pts] of Object.entries(pointsPerUser)) {
        const u = usersList.find(x => x.id === uid);
        if (u) {
          if (pts >= 13) winners13.push({ ...u, pts });
          else if (pts >= 8 && pts <= 12) winners8.push({ ...u, pts });
        }
      }

      setWinnersModal({ winners13: winners13.sort((a,b) => b.pts - a.pts), winners8: winners8.sort((a,b) => b.pts - a.pts), tId });
    } catch(e) {
      console.error("Error calculando ganadores", e);
    }
  };

  const applyPrizes = async () => {
    if(!winnersModal) return;
    try {
      const batch = writeBatch(db);
      winnersModal.winners8.forEach(w => {
        batch.update(doc(db, "usuarios", w.id), {
           creditos: (w.creditos || 0) + 1
        });
      });
      batch.update(doc(db, "torneos", winnersModal.tId), { activo: false, finalizado: true });
      
      await batch.commit();
      setWinnersModal(null);
      setSelectedTournament(null);
      fetchTournaments();
      alert("Torneo finalizado. Se han devuelto los créditos a los ganadores de reintegro.");
    } catch(e) {
      console.error(e);
      alert("Error al repartir premios.");
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
                        setWinnersModal(null);
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
              
              <div className="mt-4" style={{borderTop: '1px solid #ddd', paddingTop: '1rem'}}>
                <button onClick={() => calculateWinners(selectedTournament.id)}>Calcular Ganadores / Finalizar</button>
              </div>

              {winnersModal && (
                <div className="card mt-4" style={{background: 'var(--bg-secondary, #2a2a35)', border: '1px solid var(--primary)'}}>
                  <h3>Resultados del Torneo</h3>
                  
                  <div className="mt-4">
                    <h4 style={{color: '#ffc107', marginBottom: '0.5rem'}}>🏆 Ganadores del Pozo (13 a 15 aciertos):</h4>
                    {winnersModal.winners13.length === 0 ? <p style={{color: '#aaa'}}>Nadie alcanzó 13 aciertos.</p> : (
                      <ul style={{listStyle: 'none', padding: 0}}>
                        {winnersModal.winners13.map(w => <li key={w.id} style={{padding: '0.5rem', background: 'rgba(255,255,255,0.05)', marginBottom: '0.5rem', borderRadius: '4px'}}>{w.alias || w.nombre} - <strong>{w.pts} aciertos</strong></li>)}
                      </ul>
                    )}
                  </div>

                  <div className="mt-4">
                    <h4 style={{color: '#0dcaf0', marginBottom: '0.5rem'}}>🔁 Reintegros (8 a 12 aciertos - Recuperan 1 crédito):</h4>
                    {winnersModal.winners8.length === 0 ? <p style={{color: '#aaa'}}>Ningún reintegro.</p> : (
                      <ul style={{listStyle: 'none', padding: 0}}>
                        {winnersModal.winners8.map(w => <li key={w.id} style={{padding: '0.5rem', background: 'rgba(255,255,255,0.05)', marginBottom: '0.5rem', borderRadius: '4px'}}>{w.alias || w.nombre} - <strong>{w.pts} aciertos</strong></li>)}
                      </ul>
                    )}
                  </div>
                  
                  {selectedTournament.activo && (
                    <div className="mt-4" style={{padding: '1rem', background: 'rgba(220,53,69,0.1)', borderRadius: '4px', border: '1px solid rgba(220,53,69,0.5)'}}>
                      <p style={{marginBottom: '1rem'}}><strong>Atención:</strong> Al finalizar, el torneo se cerrará y se asignarán los créditos de reintegro automáticamente a los usuarios correspondientes.</p>
                      <button onClick={applyPrizes} style={{background: '#dc3545', color: 'white'}}>Cerrar Torneo y Repartir Reintegros</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
