import React from 'react';

// Escudo simple (libro + engrane) en SVG, para no depender de un archivo de imagen.
// color: color de trazo; size: tamaño en px.
const EscudoLogo = ({ color = '#ffffff', size = 34 }) => (
  <svg width={size} height={size} viewBox="0 0 48 54" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M24 2 L44 10 V26 C44 38 36 47 24 52 C12 47 4 38 4 26 V10 Z"
      stroke={color}
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    <path
      d="M15 22 H33 M15 22 V34 M33 22 V34 M15 34 H33 M24 22 V34"
      stroke={color}
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <circle cx="24" cy="17" r="4.2" stroke={color} strokeWidth="1.8" />
    <path
      d="M24 13.2 V11.4 M24 20.6 V22.4 M20.9 15.1 L19.4 14.2 M28.6 19.9 L27.1 19 M20.9 18.9 L19.4 19.8 M28.6 14.1 L27.1 15"
      stroke={color}
      strokeWidth="1.3"
      strokeLinecap="round"
    />
  </svg>
);

export default EscudoLogo;
