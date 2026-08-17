'use client';

import React from 'react';

// Dedicated TradingView Asset Symbol Badges (No flags, exact symbol icons)
export default function SymbolIcon({ symbol, size = 22, className = '' }) {
  const sym = (symbol || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

  // 1. Gold / XAUUSD
  if (sym.includes('XAU') || sym.includes('GOLD')) {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
        <circle cx="16" cy="16" r="16" fill="#E5A900" />
        <path d="M7 13.5L16 10L25 13.5L22.5 17.5H9.5L7 13.5Z" fill="#FFFFFF" fillOpacity="0.95" />
        <path d="M7 13.5L16 10L25 13.5L22.5 17.5H9.5L7 13.5Z" fill="#FDE68A" />
        <path d="M9 19.5L16 16.5L23 19.5L20.5 23.5H11.5L9 19.5Z" fill="#FEF08A" />
        <path d="M12 15L16 13.5L20 15" stroke="#D97706" strokeWidth="0.8" />
      </svg>
    );
  }

  // 2. Bitcoin / BTC
  if (sym.startsWith('BTC')) {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
        <circle cx="16" cy="16" r="16" fill="#F7931A" />
        <path
          d="M21.8 13.5C22.1 11.5 20.6 10.4 18.5 9.7L19.2 6.9L17.5 6.5L16.8 9.3C16.4 9.2 15.9 9.1 15.4 9L16.1 6.2L14.4 5.8L13.7 8.6C13.3 8.5 13 8.4 12.6 8.3L10.2 7.7L9.7 9.7C9.7 9.7 11 10 11 10C11.7 10.2 11.8 10.7 11.7 11.1L10.7 15.1C10.8 15.1 10.9 15.2 11 15.2L10.8 14.7L9.4 20.3C9.3 20.7 8.9 21.1 8.2 20.9C8.2 20.9 6.9 20.6 6.9 20.6L6.2 22.8L8.5 23.4C8.9 23.5 9.4 23.6 9.8 23.7L9.1 26.5L10.8 26.9L11.5 24.1C12 24.2 12.4 24.3 12.9 24.4L12.2 27.2L13.9 27.6L14.6 24.8C17.5 25.3 19.6 25.1 20.6 22.5C21.4 20.4 20.6 19.2 19.1 18.4C20.2 17.8 21 16.8 21.2 15.1M18 20.7C17.5 22.7 14.1 21.7 12.9 21.4L13.8 17.8C15 18.1 18.5 18.7 18 20.7M18.4 14.2C18 16 15 15.1 14 14.8L14.8 11.6C15.8 11.8 18.9 12.4 18.4 14.2Z"
          fill="white"
        />
      </svg>
    );
  }

  // 3. Ethereum / ETH
  if (sym.startsWith('ETH')) {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
        <circle cx="16" cy="16" r="16" fill="#627EEA" />
        <path d="M16 4L15.7 5L15.7 19.8L16 20.1L22.6 16.2L16 4Z" fill="#FFFFFF" fillOpacity="0.6" />
        <path d="M16 4L9.4 16.2L16 20.1V5V4Z" fill="#FFFFFF" />
        <path d="M16 21.5L15.8 21.7L15.8 27.7L16 28L22.6 18.6L16 21.5Z" fill="#FFFFFF" fillOpacity="0.6" />
        <path d="M16 28V21.5L9.4 18.6L16 28Z" fill="#FFFFFF" />
      </svg>
    );
  }

  // 4. EUR Pairs (Euro symbol €)
  if (sym.startsWith('EUR')) {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
        <circle cx="16" cy="16" r="16" fill="#003399" />
        <text x="16" y="21.5" fontSize="17" fontWeight="bold" fill="#FFCC00" textAnchor="middle" fontFamily="sans-serif">
          €
        </text>
      </svg>
    );
  }

  // 5. GBP Pairs (Pound symbol £)
  if (sym.startsWith('GBP')) {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
        <circle cx="16" cy="16" r="16" fill="#00247D" />
        <text x="16" y="21.5" fontSize="17" fontWeight="bold" fill="#FFFFFF" textAnchor="middle" fontFamily="sans-serif">
          £
        </text>
      </svg>
    );
  }

  // 6. JPY Pairs (Yen symbol ¥)
  if (sym.startsWith('JPY')) {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
        <circle cx="16" cy="16" r="16" fill="#BC002D" />
        <text x="16" y="21.5" fontSize="16" fontWeight="bold" fill="#FFFFFF" textAnchor="middle" fontFamily="sans-serif">
          ¥
        </text>
      </svg>
    );
  }

  // 7. USD Pairs (Dollar symbol $)
  if (sym.startsWith('USD')) {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
        <circle cx="16" cy="16" r="16" fill="#0A2540" />
        <text x="16" y="21.5" fontSize="17" fontWeight="bold" fill="#00D26A" textAnchor="middle" fontFamily="sans-serif">
          $
        </text>
      </svg>
    );
  }

  // 8. AUD Pairs (Australian Dollar A$)
  if (sym.startsWith('AUD')) {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
        <circle cx="16" cy="16" r="16" fill="#00008B" />
        <text x="16" y="20.5" fontSize="12" fontWeight="bold" fill="#FFFFFF" textAnchor="middle" fontFamily="sans-serif">
          A$
        </text>
      </svg>
    );
  }

  // 9. CAD Pairs (Canadian Dollar C$)
  if (sym.startsWith('CAD')) {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
        <circle cx="16" cy="16" r="16" fill="#D32F2F" />
        <text x="16" y="20.5" fontSize="12" fontWeight="bold" fill="#FFFFFF" textAnchor="middle" fontFamily="sans-serif">
          C$
        </text>
      </svg>
    );
  }

  // 10. CHF Pairs (Swiss Franc ₣)
  if (sym.startsWith('CHF')) {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
        <circle cx="16" cy="16" r="16" fill="#D52B1E" />
        <text x="16" y="21" fontSize="15" fontWeight="bold" fill="#FFFFFF" textAnchor="middle" fontFamily="sans-serif">
          ₣
        </text>
      </svg>
    );
  }

  // 11. NZD Pairs (New Zealand Dollar NZ$)
  if (sym.startsWith('NZD')) {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
        <circle cx="16" cy="16" r="16" fill="#00247D" />
        <text x="16" y="20" fontSize="11" fontWeight="bold" fill="#FFFFFF" textAnchor="middle" fontFamily="sans-serif">
          NZ$
        </text>
      </svg>
    );
  }

  // Generic fallback: Clean circle badge with first letter of symbol
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      <circle cx="16" cy="16" r="16" fill="#2563EB" />
      <text x="16" y="21" fontSize="14" fontWeight="bold" fill="#FFFFFF" textAnchor="middle" fontFamily="sans-serif">
        {sym.charAt(0) || '$'}
      </text>
    </svg>
  );
}
