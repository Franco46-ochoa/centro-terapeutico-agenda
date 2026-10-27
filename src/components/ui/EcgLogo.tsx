import React from 'react';

interface EcgLogoProps {
  className?: string;
}

/** Trazo de electrocardiograma dibujado a mano, usado como isotipo del consultorio. */
export const EcgLogo: React.FC<EcgLogoProps> = ({ className = 'w-14 h-8' }) => (
  <svg
    viewBox="0 0 64 32"
    className={className}
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    <path
      d="M1 17.5h13.5l2.2-4.2 2.6 8.6 3.8-19.4 4.1 26.2 3.4-14.6 1.9 3.6H41l2.2-3 2 3H63"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
