import React, { useMemo } from 'react';

// Patrón visual tipo QR, puramente decorativo (no codifica nada real todavía).
// Cuando se active el ticket digital "de verdad" con tokens, esto se reemplaza
// por un QR real generado a partir del folio del pedido.
const QRDecorativo = ({ size = 110, seed = 1 }) => {
  const celdas = 11;
  const patron = useMemo(() => {
    let s = seed * 9301 + 49297;
    const rand = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
    const grid = [];
    for (let i = 0; i < celdas; i++) {
      const fila = [];
      for (let j = 0; j < celdas; j++) {
        const enEsquina =
          (i < 3 && j < 3) || (i < 3 && j > celdas - 4) || (i > celdas - 4 && j < 3);
        fila.push(enEsquina ? (i === 1 || j === 1 || i === celdas - 2 || j === celdas - 2 ? 1 : (i === 0 || j === 0 ? 1 : 0)) : (rand() > 0.55 ? 1 : 0));
      }
      grid.push(fila);
    }
    return grid;
  }, [seed]);

  const cell = size / celdas;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <rect width={size} height={size} fill="#fff" />
      {patron.map((fila, i) =>
        fila.map((valor, j) =>
          valor ? (
            <rect key={`${i}-${j}`} x={j * cell} y={i * cell} width={cell} height={cell} fill="#1a1a1a" />
          ) : null
        )
      )}
    </svg>
  );
};

export default QRDecorativo;
