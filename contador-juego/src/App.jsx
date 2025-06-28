import  { useReducer, useRef, useCallback, useEffect, useState } from 'react';
import './App.css';

// Reducer para manejar el estado del juego, es decir todas las acciones que se pueden realizar en el contador
const gameReducer = (state, action) => {
  switch (action.type) {
    case 'INCREMENT':
      return {
        ...state, // ... s el operador de propagación 
        // (spread operator, Trae todo lo que ya existe en el estado actual y mantenlo igual
        // a para no perder el resto del estado cuando solo quieres actualizar una parte
        count: state.count + 1,
        history: [...state.history, { value: state.count + 1, timestamp: Date.now() }]
      };
    case 'DECREMENT':
      return {
        ...state,
        count: Math.max(0, state.count - 1),
        history: [...state.history, { value: Math.max(0, state.count - 1), timestamp: Date.now() }]
      };
    case 'RESET':
      return {
        ...state,
        count: 0,
        history: [{ value: 0, timestamp: Date.now() }]
      };
    case 'ADD_FACT':
      return {
        ...state,
        facts: [...state.facts, action.payload]
      };
    case 'LOAD_STATE':
      return action.payload;
    default:
      return state;
  }
};

const initialState = {//mi estado inicial,  count: 0,
  history: [{ value: 0, timestamp: Date.now() }],
  facts: []
};

export default function ContadorJuego() {// Componente principal del juego
  const [state, dispatch] = useReducer(gameReducer, initialState);// representa el estado actual del juego
  const [apiData, setApiData] = useState([]);// representa los datos obtenidos de la API
  const [loading, setLoading] = useState(false);// indica si los datos están siendo cargados, mostrar un icono dee cargado
  const intervalRef = useRef(null);//crea una referencia mutable que puede almacenar un 
  // valor entre renders, sin provocar una re-renderización del componente cuando cambia


  // Simular localStorage 
  const [savedData, setSavedData] = useState(null);

  const saveToStorage = useCallback((data) => {
    setSavedData(data);
    console.log('Datos guardados:', data);
  }, []);

  const loadFromStorage = useCallback(() => {
    if (savedData) {
      dispatch({ type: 'LOAD_STATE', payload: savedData });
      console.log('Datos cargados:', savedData);
    }
  }, [savedData]);

  // Fetch de datos desde Numbers API simulado
  const fetchNumberFact = useCallback(async (number) => {
    setLoading(true);
    try {
      const response = await fetch(`http://numbersapi.com/${number}/trivia`);
      const fact = await response.text();
      dispatch({ type: 'ADD_FACT', payload: { number, fact, timestamp: Date.now() } });
    } catch (error) {
      console.error('Error fetching number fact:', error);
      dispatch({ 
        type: 'ADD_FACT', 
        payload: { 
          number, 
          fact: `El número ${number} es interesante por sí mismo!`, 
          timestamp: Date.now() 
        } 
      });
    } finally {
      setLoading(false);
    }
  }, []);//dispatch es una función que envía una acción al reducer

  //datos aleatorios con callbasck para momorizar la función y evitar que se vuelva a crear en cada render
  const fetchRandomData = useCallback(async () => {
    setLoading(true);
    try {//arreglo con 7 promesas, i  el índice actual del elemento (de 0 a 6)
      const promises = Array.from({ length: 7 }, (_, i) => 
        fetch(`http://numbersapi.com/random/math`).then(r => r.text())// r es respuesta de la API
      );
      const results = await Promise.all(promises);
      const processedData = results.map((fact, index) => ({
        day: ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'][index],
        value: Math.floor(Math.random() * 100) + 10,
        fact: fact.substring(0, 50) + '...'//substring(inicio, fin) extrae una parte de una cadena de texto (string), sin modificar la original
      }));//desde el carácter 0 hasta el carácter 49 (el 50 no se incluye),  (...) al final para indicar que fue recortado
      setApiData(processedData);
    } catch (error) {
      console.error('Error fetching random data:', error);
      // Datos de fallback
      setApiData([
        { day: 'Lun', value: 45, fact: 'Datos matemáticos interesantes...' },
        { day: 'Mar', value: 67, fact: 'Propiedades numéricas fascinantes...' },
        { day: 'Mie', value: 23, fact: 'Curiosidades matemáticas...' },
        { day: 'Jue', value: 89, fact: 'Hechos numéricos asombrosos...' },
        { day: 'Vie', value: 34, fact: 'Datos estadísticos únicos...' },
        { day: 'Sab', value: 76, fact: 'Información matemática especial...' },
        { day: 'Dom', value: 52, fact: 'Propiedades numéricas extraordinarias...' }
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Efectos
  useEffect(() => {
    fetchRandomData();
  }, [fetchRandomData]);

  useEffect(() => {
    saveToStorage(state);
  }, [state, saveToStorage]);

  // Handlers
  const handleIncrement = useCallback(() => {
    dispatch({ type: 'INCREMENT' });
    if (state.count > 0 && state.count % 5 === 0) {// Si el contador es múltiplo de 5, buscar un hecho
      fetchNumberFact(state.count);
    }
  }, [state.count, fetchNumberFact]);

  const handleDecrement = useCallback(() => {
    dispatch({ type: 'DECREMENT' });
  }, []);

  const handleReset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const startAutoIncrement = useCallback(() => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      dispatch({ type: 'INCREMENT' });
    }, 1000);
  }, []);

  const stopAutoIncrement = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Calcular máximo para la gráfica
  const maxValue = Math.max(...apiData.map(d => d.value), 100);// 100 es un valor por defecto para evitar división por cero

  return (
    <div className="contador-container">
      <div className="contador-wrapper">
        <h1 className="contador-title">
          🎮 Contador Juego Interactivo
        </h1>

        <div className="contador-grid">

          <div className="contador-panel">
            <div className="contador-display">
              <div className="contador-number">
                {state.count}
              </div>
              <div className="contador-history">
                Historial: {state.history.length} cambios
              </div>
            </div>

            <div className="contador-buttons">
              <button
                onClick={handleIncrement}
                className="btn btn-increment"
              >
                ➕ Incrementar
              </button>
              <button
                onClick={handleDecrement}
                className="btn btn-decrement"
              >
                ➖ Decrementar
              </button>
              <button
                onClick={handleReset}
                className="btn btn-reset"
              >
                🔄 Reset
              </button>
            </div>

            <div className="contador-controls">
              <button
                onClick={startAutoIncrement}
                className="btn-small btn-auto"
              >
                ▶️ Auto
              </button>
              <button
                onClick={stopAutoIncrement}
                className="btn-small btn-stop"
              >
                ⏹️ Stop
              </button>
              <button
                onClick={loadFromStorage}
                className="btn-small btn-load"
              >
               Cargar
              </button>
            </div>

            <div className="contador-facts">
              <h3 className="facts-title">Datos Curiosos:</h3>
              {state.facts.length === 0 ? (
                <p className="facts-empty">Llega a múltiplos de 5 para descubrir datos curiosos!</p>
              ) : (
                <div className="facts-list">
                  {state.facts.slice(-3).map((fact, index) => (
                    <div key={index} className="fact-item">
                      <strong>#{fact.number}:</strong> {fact.fact}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Gráfica con datos de API */}
          <div className="contador-chart">
            <h3 className="chart-title">
              Datos de Numbers API {loading && '⏳'}
            </h3>
            
            <div className="chart-container">
              {apiData.map((item, index) => (
                <div key={index} className="chart-item">
                  <div
                    className="chart-bar"
                    style={{
                      height: `${(item.value / maxValue) * 200}px`,
                      minHeight: '20px'
                    }}
                    title={item.fact}
                  >
                    <div className="chart-value">{item.value}</div>
                  </div>
                  <div className="chart-label">{item.day}</div>
                </div>
              ))}
            </div>

            <button
              onClick={fetchRandomData}
              disabled={loading}
              className="btn chart-update-btn"
            >
              {loading ? '⏳ Cargando...' : '🔄 Actualizar Datos'}
            </button>
          </div>
        </div>

        {/* Gráfica de historial del contador */}
        <div className="contador-history-chart">
          <h3 className="history-title"> Historial del Contador</h3>
          <div className="history-container">
            {state.history.slice(-20).map((entry, index) => (
              <div
                key={index}
                className="history-bar"
                style={{
                  height: `${Math.max((entry.value / Math.max(...state.history.map(h => h.value), 1)) * 80, 4)}px`,
                  width: '8px'
                }}
                title={`Valor: ${entry.value}`}
              />
            ))}
          </div>
          <div className="history-info">
            Últimos 20 cambios • Total: {state.history.length}
          </div>
        </div>

        {/* Footer con información técnica */}
        <div className="contador-footer">
          <p> Uuw una false api| useReducer, useRef, useCallback | Numbers API</p>
          <p>Estado persistente simulado | CSS puro para gráficas</p>
        </div>
      </div>
    </div>
  );
}