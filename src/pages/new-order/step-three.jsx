import React, { forwardRef, useImperativeHandle } from 'react';

const StepThree = forwardRef(({ orderData }, ref) => {
  useImperativeHandle(ref, () => ({
    submitStep: async () => {
      // Lógica para el paso 3, si es necesario.
      console.log("Paso 3 completado.");
      return Promise.resolve(orderData);
    }
  }));

  return (
    <div>
      <h3>Paso 3: Inventarios</h3>
      <p>Contenido del paso 3. Aquí se manejarán los inventarios de la orden.</p>
      <p>ID de la Orden: {orderData?.id}</p>
    </div>
  );
});

export default StepThree;