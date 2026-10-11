import React from 'react';

/**
 * 「マシマシ打」の看板エンブレム。
 * 文字を画像に焼き込まず SVG のテキストで描くので、表記を間違えない・解像度に依存しない。
 */
export const LogoMark: React.FC<{ className?: string }> = ({ className = 'h-11 w-11' }) => (
  <svg viewBox="0 0 64 64" className={className} role="img" aria-label="マシマシ打">
    <circle cx="32" cy="32" r="31" fill="#0e0e0e" />
    <circle cx="32" cy="32" r="28" fill="#ffe100" />
    <circle cx="32" cy="32" r="25" fill="none" stroke="#0e0e0e" strokeWidth="1.5" strokeDasharray="2 2.5" />
    <text x="32" y="23" textAnchor="middle" textLength="34" lengthAdjust="spacingAndGlyphs" fontFamily='"Dela Gothic One", sans-serif' fontSize="10" fill="#0e0e0e">
      マシマシ
    </text>
    <text x="32" y="50" textAnchor="middle" fontFamily='"Dela Gothic One", sans-serif' fontSize="25" fill="#0e0e0e">
      打
    </text>
  </svg>
);
