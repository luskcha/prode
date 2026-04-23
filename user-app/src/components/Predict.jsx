import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export default function Predict() {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [predictions, setPredictions] = useState({}); // matchId -> 'L', 'E', 'V'
  const [saving, setSaving] = useState(false);
  const [dbUser, setDbUser] = useState(null);
  const [hasPredicted, setHasPredicted] = useState(false);
  
  const user = JSON.parse(localStorage.getItem('prode_user') || '{}');

  useEffect(() => {
    const init = async () => {
      try {
        // Fetch real-time user data
        if (user.id) {
          const { getDoc } = await import('firebase/firestore');
          const userDoc = await getDoc(doc(db, 'usuarios', user.id));
          if (userDoc.exists()) setDbUser(userDoc.data());
        }

        const snap = await getDocs(query(collection(db, 'torneos'), where('activo', '==', true)));
        const trns = snap.docs.map(d => ({id: d.id, ...d.data()}));
        setTournaments(trns);
        if (trns.length > 0) handleSelectTournament(trns[0]);
      } catch (err) {
        console.error(err);
      }
    };
    init();
  }, []);

  const handleSelectTournament = async (t) => {
    setSelectedTournament(t);
    // Fetch matches
    const mSnap = await getDocs(query(collection(db, 'partidos'), where('torneo_id', '==', t.id)));
    const allMatches = mSnap.docs.map(d => ({id: d.id, ...d.data()})).sort((a,b) => a.orden - b.orden);
    setMatches(allMatches);

    // Fetch user's existing predictions
    const pSnap = await getDocs(query(collection(db, 'pronosticos'), where('usuario_id', '==', user.id)));
    const existing = {};
    pSnap.docs.forEach(d => {
      const data = d.data();
      existing[data.partido_id] = data.prediccion;
    });
    setPredictions(existing);
    
    // Si ya tiene pronósticos, bloquear edición
    const hasExistingPredictions = Object.keys(existing).length > 0;
    setHasPredicted(hasExistingPredictions);
  };

  const handlePredict = (matchId, value) => {
    setPredictions(prev => ({ ...prev, [matchId]: value }));
  };

  const savePredictions = async () => {
    if (Object.keys(predictions).length !== matches.length) {
      alert("Debes completar todos los partidos antes de guardar tu pronóstico.");
      return;
    }

    const confirmSave = window.confirm("¡ATENCIÓN! Revisa bien tus selecciones. Una vez guardado el pronóstico, NO podrás modificarlo. ¿Deseas continuar?");
    if (!confirmSave) return;

    setSaving(true);
    try {
      const batch = writeBatch(db);
      for (const [matchId, predValue] of Object.entries(predictions)) {
        if (!matches.some(m => m.id === matchId)) continue;
        const docId = `${user.id}_${matchId}`;
        const ref = doc(db, 'pronosticos', docId);
        batch.set(ref, {
          usuario_id: user.id,
          partido_id: matchId,
          prediccion: predValue,
          fecha: new Date()
        });
      }
      // Opcional: Descontar 1 crédito si decides cobrarles
      // const { updateDoc } = await import('firebase/firestore');
      // await updateDoc(doc(db, 'usuarios', user.id), { credito: dbUser.credito - 1 });

      await batch.commit();
      setHasPredicted(true);
      alert('¡Pronósticos guardados correctamente! Mucha suerte.');
    } catch (e) {
      console.error(e);
      alert('Hubo un error al guardar.');
    }
    setSaving(false);
  };

  return (
    <div className="card">
      <h2>Mis Pronósticos</h2>
      {tournaments.length === 0 ? (
        <p className="mt-4" style={{ color: 'var(--text-muted)' }}>No hay torneos activos en este momento.</p>
      ) : dbUser && (dbUser.credito === undefined || dbUser.credito <= 0) ? (
        <div className="mt-4" style={{ padding: '2rem', background: 'rgba(255,0,0,0.1)', border: '1px solid var(--danger)', borderRadius: '0.5rem', textAlign: 'center' }}>
          <h3 style={{ color: 'var(--danger)', marginBottom: '1rem' }}>No tienes créditos suficientes</h3>
          <p>Para poder participar y guardar tus pronósticos, necesitas que el administrador te asigne créditos.</p>
        </div>
      ) : (
        <>
          <div style={{ margin: '1.5rem 0', display: 'flex', gap: '1rem', overflowX: 'auto' }}>
            {tournaments.map(t => (
              <button 
                key={t.id} 
                onClick={() => handleSelectTournament(t)}
                style={{ 
                  background: selectedTournament?.id === t.id ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                  color: selectedTournament?.id === t.id ? 'var(--bg-color)' : 'white'
                }}
              >
                {t.nombre}
              </button>
            ))}
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
             Selecciona Local (L), Empate (E) o Visitante (V). Los partidos con resultado real ya definido bloquean pronósticos.
            </p>
            {matches.map(m => {
              const hasResult = m.resultado_real; // Si el administrador ya puso un resultado, no dejar cambiar
              return (
                <div key={m.id} className="match-row">
                  <div className="match-team">{m.local}</div>
                  
                  <div className="prediction-opts">
                    <button 
                      className={`pred-btn ${predictions[m.id] === 'L' ? 'selected' : ''}`}
                      onClick={() => !hasResult && !hasPredicted && handlePredict(m.id, 'L')}
                      disabled={hasResult || hasPredicted}
                      style={{ opacity: (hasResult && m.resultado_real !== 'L') || (hasPredicted && predictions[m.id] !== 'L') ? 0.3 : 1 }}
                    >L</button>
                    <button 
                      className={`pred-btn ${predictions[m.id] === 'E' ? 'selected' : ''}`}
                      onClick={() => !hasResult && !hasPredicted && handlePredict(m.id, 'E')}
                      disabled={hasResult || hasPredicted}
                      style={{ opacity: (hasResult && m.resultado_real !== 'E') || (hasPredicted && predictions[m.id] !== 'E') ? 0.3 : 1 }}
                    >E</button>
                    <button 
                      className={`pred-btn ${predictions[m.id] === 'V' ? 'selected' : ''}`}
                      onClick={() => !hasResult && !hasPredicted && handlePredict(m.id, 'V')}
                      disabled={hasResult || hasPredicted}
                      style={{ opacity: (hasResult && m.resultado_real !== 'V') || (hasPredicted && predictions[m.id] !== 'V') ? 0.3 : 1 }}
                    >V</button>
                  </div>

                  <div className="match-team">{m.visitante}</div>
                </div>
              );
            })}
          </div>

          <button onClick={savePredictions} disabled={saving || hasPredicted} style={{ width: '100%', fontSize: '1.2rem', opacity: hasPredicted ? 0.5 : 1 }}>
            {hasPredicted ? 'Pronóstico ya guardado (No se puede modificar)' : (saving ? 'Guardando...' : 'Guardar Pronósticos')}
          </button>
        </>
      )}
    </div>
  );
}
