import React from 'react';

const Rules = () => {
  return (
    <div className="rules-container" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', lineHeight: '1.6', fontFamily: 'sans-serif' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>REGLAMENTO OFICIAL – PRODE “GANA CON 13”</h2>

      <section style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#007bff' }}>🧩 1. OBJETIVO DEL JUEGO</h3>
        <p>El PRODE “GANA CON 13” consiste en pronosticar el resultado de 15 partidos de fútbol (Local / Empate / Visitante).</p>
        <p>Los jugadores competirán por premios según la cantidad de aciertos obtenidos.</p>
      </section>

      <section style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#007bff' }}>💰 2. SISTEMA DE PARTICIPACIÓN</h3>
        <ul>
          <li>Cada usuario debe contar con 1 crédito para participar.</li>
          <li>El crédito es asignado por el administrador.</li>
          <li>Al confirmar la jugada:
            <ul>
              <li>Se descuenta automáticamente 1 crédito.</li>
              <li>La jugada queda registrada y no puede modificarse.</li>
            </ul>
          </li>
        </ul>
      </section>

      <section style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#007bff' }}>🏆 4. DISTRIBUCIÓN DE PREMIOS</h3>
        <p>Del 75% destinado a premios:</p>
        <div style={{ marginLeft: '20px' }}>
          <h4>🥇 Premio Mayor (80%)</h4>
          <ul>
            <li>Se asigna a los jugadores que obtengan entre 13 y 15 aciertos.</li>
            <li>Si hay más de un ganador, el premio se reparte en partes iguales.</li>
            <li>👉 <strong>Este nivel da nombre al juego: “Gana con 13”</strong></li>
          </ul>

          <h4>🔁 Reintegro (20%)</h4>
          <ul>
            <li>Se destina a jugadores que obtengan entre 8 y 12 aciertos.</li>
            <li>Estos jugadores reciben 1 crédito para volver a jugar.</li>
          </ul>
        </div>
      </section>

      <section style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#007bff' }}>⚠️ 5. CONSIDERACIONES IMPORTANTES</h3>
        <ul>
          <li>Para validar la jugada: Se deben completar los 15 partidos obligatoriamente.</li>
          <li>No se permiten modificaciones una vez confirmada la jugada.</li>
          <li>Los resultados oficiales serán cargados por el administrador.</li>
          <li>El sistema calcula automáticamente los aciertos y ranking.</li>
        </ul>
      </section>

      <section style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#007bff' }}>📈 6. RANKING</h3>
        <ul>
          <li>Se mostrará un ranking en tiempo real.</li>
          <li>Se actualizará a medida que se cargan los resultados.</li>
          <li>Se ordenará por cantidad de aciertos.</li>
        </ul>
      </section>

      <section style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#007bff' }}>📄 7. REGISTRO Y TRANSPARENCIA</h3>
        <ul>
          <li>Todas las jugadas quedan registradas.</li>
          <li>El administrador podrá generar reportes (log).</li>
          <li>Los resultados son visibles para todos los participantes.</li>
        </ul>
      </section>

      <section style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#007bff' }}>🎯 8. ACLARACIÓN SOBRE PREMIOS</h3>
        <ul>
          <li>El premio mayor se activa únicamente con 13 o más aciertos.</li>
          <li>El reintegro no es dinero en efectivo: Se otorga en forma de crédito para seguir jugando.</li>
          <li>En caso de no haber ganadores en el premio mayor: El pozo podrá acumularse para la siguiente FECHA (opcional).</li>
          <li>Al finalizar el último partido, se mostrarán los datos de quiénes son los usuarios que recuperaron el crédito y los usuarios que ganan el pozo.</li>
        </ul>
      </section>
    </div>
  );
};

export default Rules;
