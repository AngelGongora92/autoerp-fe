import React, { useState } from 'react';

function Home(props) {
  // 1. Declara una nueva variable de estado llamada 'count'
  const [count, setCount] = useState(0);

  // 2. Define una función para manejar el clic del botón
  const handleButtonClick = () => {
    setCount(count + 1);
  };

  return (
    <div>
      <h1>Bienvenido, {props.name}</h1>
      <p>Este es el contenido de tu página principal.</p>
      
      {/* 3. Agrega un botón que actualiza el estado */}
      <p>El contador está en: {count}</p>
      <button onClick={handleButtonClick}>
        Incrementar Contador {count}
      </button>
    </div>
  );
}

export default Home;