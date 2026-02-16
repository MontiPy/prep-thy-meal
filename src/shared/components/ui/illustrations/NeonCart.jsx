import React from 'react';

const NeonCart = ({ size = 120, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="neonCartGradient" x1="10" y1="20" x2="110" y2="100">
        <stop offset="0%" stopColor="#22d3ee" />
        <stop offset="100%" stopColor="#38bdf8" />
      </linearGradient>
      <filter id="neonCartGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <path
      d="M26 36H40L48 78H88L96 50H46"
      stroke="url(#neonCartGradient)"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      filter="url(#neonCartGlow)"
    />
    <path
      d="M52 50H92"
      stroke="#7dd3fc"
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.7"
    />
    <circle cx="54" cy="86" r="6" stroke="#38bdf8" strokeWidth="2.4" />
    <circle cx="82" cy="86" r="6" stroke="#22d3ee" strokeWidth="2.4" />
    <path
      d="M34 30H26"
      stroke="#38bdf8"
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.8"
    />
  </svg>
);

export default NeonCart;
