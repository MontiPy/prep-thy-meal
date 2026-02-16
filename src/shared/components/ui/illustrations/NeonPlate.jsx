import React from 'react';

const NeonPlate = ({ size = 120, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="neonPlateGradient" x1="12" y1="12" x2="108" y2="108">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="100%" stopColor="#22d3ee" />
      </linearGradient>
      <filter id="neonPlateGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <circle
      cx="60"
      cy="64"
      r="32"
      stroke="url(#neonPlateGradient)"
      strokeWidth="2.6"
      filter="url(#neonPlateGlow)"
    />
    <circle
      cx="60"
      cy="64"
      r="18"
      stroke="url(#neonPlateGradient)"
      strokeWidth="2"
      opacity="0.7"
    />
    <path
      d="M28 56C28 44 38 34 60 34C82 34 92 44 92 56"
      stroke="#7dd3fc"
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.7"
    />
    <path
      d="M40 82C46 90 52 94 60 94C68 94 74 90 80 82"
      stroke="#22d3ee"
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.7"
    />
  </svg>
);

export default NeonPlate;
