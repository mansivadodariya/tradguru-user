'use client';

import React from 'react';

// Helper to parse currency pair string into base and quote currencies
function parsePair(symbol) {
  if (!symbol) return { base: 'USD', quote: '' };
  const raw = String(symbol).trim().toUpperCase();

  // If contains delimiter e.g. "AUD/USD" or "AUD-USD"
  if (raw.includes('/') || raw.includes('-')) {
    const parts = raw.split(/[\/\-]/);
    return { base: parts[0], quote: parts[1] || '' };
  }

  const clean = raw.replace(/[^A-Z0-9]/g, '');

  // 6-character forex/crypto pair e.g. "AUDUSD", "EURUSD", "GBPJPY", "BTCUSD"
  if (clean.length === 6) {
    return { base: clean.slice(0, 3), quote: clean.slice(3, 6) };
  }

  // 7-character pair e.g. "WTIUSD" or "XAGUSD"
  if (clean.length === 7 && clean.endsWith('USD')) {
    return { base: clean.slice(0, 4), quote: 'USD' };
  }

  return { base: clean, quote: '' };
}

// Render individual circle country flag / asset badge centered at (cx, cy) with radius r
function renderBadgeContent(code, cx, cy, r) {
  const c = (code || '').toUpperCase();
  const idPrefix = `${c}-${Math.round(cx)}-${Math.round(cy)}`;

  // 1. Euro / EUR (European Union Flag)
  if (c === 'EUR') {
    return (
      <g key={idPrefix}>
        <circle cx={cx} cy={cy} r={r} fill="#0055A5" />
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => {
          const rad = (deg * Math.PI) / 180;
          const starR = r * 0.62;
          const sx = cx + starR * Math.cos(rad);
          const sy = cy + starR * Math.sin(rad);
          return <circle key={i} cx={sx} cy={sy} r={r * 0.11} fill="#FFCC00" />;
        })}
      </g>
    );
  }

  // 2. US Dollar / USD (USA Flag)
  if (c === 'USD') {
    return (
      <g key={idPrefix}>
        <defs>
          <clipPath id={`us-clip-${idPrefix}`}>
            <circle cx={cx} cy={cy} r={r} />
          </clipPath>
        </defs>
        <g clipPath={`url(#us-clip-${idPrefix})`}>
          <rect x={cx - r} y={cy - r} width={r * 2} height={r * 2} fill="#B22234" />
          <rect x={cx - r} y={cy - r + (r * 2 / 7)} width={r * 2} height={r * 2 / 7} fill="#FFFFFF" />
          <rect x={cx - r} y={cy - r + (r * 6 / 7)} width={r * 2} height={r * 2 / 7} fill="#FFFFFF" />
          <rect x={cx - r} y={cy - r + (r * 10 / 7)} width={r * 2} height={r * 2 / 7} fill="#FFFFFF" />
          <rect x={cx - r} y={cy - r} width={r * 0.95} height={r * 0.9} fill="#3C3B6E" />
          <circle cx={cx - r * 0.6} cy={cy - r * 0.65} r={r * 0.12} fill="#FFFFFF" />
          <circle cx={cx - r * 0.25} cy={cy - r * 0.65} r={r * 0.12} fill="#FFFFFF" />
          <circle cx={cx - r * 0.42} cy={cy - r * 0.3} r={r * 0.12} fill="#FFFFFF" />
        </g>
      </g>
    );
  }

  // 3. British Pound / GBP (United Kingdom Flag)
  if (c === 'GBP') {
    return (
      <g key={idPrefix}>
        <defs>
          <clipPath id={`uk-clip-${idPrefix}`}>
            <circle cx={cx} cy={cy} r={r} />
          </clipPath>
        </defs>
        <g clipPath={`url(#uk-clip-${idPrefix})`}>
          <rect x={cx - r} y={cy - r} width={r * 2} height={r * 2} fill="#00247D" />
          <line x1={cx - r} y1={cy - r} x2={cx + r} y2={cy + r} stroke="#FFFFFF" strokeWidth={r * 0.5} />
          <line x1={cx + r} y1={cy - r} x2={cx - r} y2={cy + r} stroke="#FFFFFF" strokeWidth={r * 0.5} />
          <line x1={cx - r} y1={cy - r} x2={cx + r} y2={cy + r} stroke="#CF142B" strokeWidth={r * 0.25} />
          <line x1={cx + r} y1={cy - r} x2={cx - r} y2={cy + r} stroke="#CF142B" strokeWidth={r * 0.25} />
          <rect x={cx - r * 0.35} y={cy - r} width={r * 0.7} height={r * 2} fill="#FFFFFF" />
          <rect x={cx - r} y={cy - r * 0.35} width={r * 2} height={r * 0.7} fill="#FFFFFF" />
          <rect x={cx - r * 0.2} y={cy - r} width={r * 0.4} height={r * 2} fill="#CF142B" />
          <rect x={cx - r} y={cy - r * 0.2} width={r * 2} height={r * 0.4} fill="#CF142B" />
        </g>
      </g>
    );
  }

  // 4. Japanese Yen / JPY (Japan Flag)
  if (c === 'JPY') {
    return (
      <g key={idPrefix}>
        <circle cx={cx} cy={cy} r={r} fill="#FFFFFF" stroke="#E0E0E0" strokeWidth="0.5" />
        <circle cx={cx} cy={cy} r={r * 0.55} fill="#BC002D" />
      </g>
    );
  }

  // 5. Australian Dollar / AUD (Australia Flag)
  if (c === 'AUD') {
    return (
      <g key={idPrefix}>
        <defs>
          <clipPath id={`au-clip-${idPrefix}`}>
            <circle cx={cx} cy={cy} r={r} />
          </clipPath>
        </defs>
        <g clipPath={`url(#au-clip-${idPrefix})`}>
          <rect x={cx - r} y={cy - r} width={r * 2} height={r * 2} fill="#00008B" />
          <g transform={`translate(${cx - r}, ${cy - r}) scale(0.48)`}>
            <rect width={r * 2} height={r * 2} fill="#00247D" />
            <line x1="0" y1="0" x2={r * 2} y2={r * 2} stroke="#FFFFFF" strokeWidth={r * 0.4} />
            <line x1={r * 2} y1="0" x2="0" y2={r * 2} stroke="#FFFFFF" strokeWidth={r * 0.4} />
            <line x1="0" y1="0" x2={r * 2} y2={r * 2} stroke="#CF142B" strokeWidth={r * 0.2} />
            <line x1={r * 2} y1="0" x2="0" y2={r * 2} stroke="#CF142B" strokeWidth={r * 0.2} />
            <rect x={r * 0.65} y="0" width={r * 0.7} height={r * 2} fill="#FFFFFF" />
            <rect x="0" y={r * 0.65} width={r * 2} height={r * 0.7} fill="#FFFFFF" />
            <rect x={r * 0.8} y="0" width={r * 0.4} height={r * 2} fill="#CF142B" />
            <rect x="0" y={r * 0.8} width={r * 2} height={r * 0.4} fill="#CF142B" />
          </g>
          <circle cx={cx + r * 0.45} cy={cy - r * 0.3} r={r * 0.12} fill="#FFFFFF" />
          <circle cx={cx + r * 0.65} cy={cy + r * 0.2} r={r * 0.12} fill="#FFFFFF" />
          <circle cx={cx + r * 0.25} cy={cy + r * 0.55} r={r * 0.12} fill="#FFFFFF" />
        </g>
      </g>
    );
  }

  // 6. Canadian Dollar / CAD (Canada Flag)
  if (c === 'CAD') {
    return (
      <g key={idPrefix}>
        <defs>
          <clipPath id={`ca-clip-${idPrefix}`}>
            <circle cx={cx} cy={cy} r={r} />
          </clipPath>
        </defs>
        <g clipPath={`url(#ca-clip-${idPrefix})`}>
          <rect x={cx - r} y={cy - r} width={r * 2} height={r * 2} fill="#FF0000" />
          <rect x={cx - r * 0.5} y={cy - r} width={r} height={r * 2} fill="#FFFFFF" />
          <path d={`M${cx} ${cy - r * 0.5}L${cx + r * 0.15} ${cy - r * 0.1}L${cx + r * 0.4} ${cy - r * 0.2}L${cx + r * 0.25} ${cy + r * 0.1}L${cx + r * 0.35} ${cy + r * 0.35}L${cx + r * 0.05} ${cy + r * 0.25}L${cx + r * 0.05} ${cy + r * 0.55}L${cx - r * 0.05} ${cy + r * 0.55}L${cx - r * 0.05} ${cy + r * 0.25}L${cx - r * 0.35} ${cy + r * 0.35}L${cx - r * 0.25} ${cy + r * 0.1}L${cx - r * 0.4} ${cy - r * 0.2}L${cx - r * 0.15} ${cy - r * 0.1}Z`} fill="#FF0000" />
        </g>
      </g>
    );
  }

  // 7. Swiss Franc / CHF (Switzerland Flag)
  if (c === 'CHF') {
    return (
      <g key={idPrefix}>
        <circle cx={cx} cy={cy} r={r} fill="#D52B1E" />
        <rect x={cx - r * 0.2} y={cy - r * 0.55} width={r * 0.4} height={r * 1.1} fill="#FFFFFF" />
        <rect x={cx - r * 0.55} y={cy - r * 0.2} width={r * 1.1} height={r * 0.4} fill="#FFFFFF" />
      </g>
    );
  }

  // 8. New Zealand Dollar / NZD (New Zealand Flag)
  if (c === 'NZD') {
    return (
      <g key={idPrefix}>
        <defs>
          <clipPath id={`nz-clip-${idPrefix}`}>
            <circle cx={cx} cy={cy} r={r} />
          </clipPath>
        </defs>
        <g clipPath={`url(#nz-clip-${idPrefix})`}>
          <rect x={cx - r} y={cy - r} width={r * 2} height={r * 2} fill="#00247D" />
          <g transform={`translate(${cx - r}, ${cy - r}) scale(0.48)`}>
            <rect width={r * 2} height={r * 2} fill="#00247D" />
            <line x1="0" y1="0" x2={r * 2} y2={r * 2} stroke="#FFFFFF" strokeWidth={r * 0.4} />
            <line x1={r * 2} y1="0" x2="0" y2={r * 2} stroke="#FFFFFF" strokeWidth={r * 0.4} />
            <line x1="0" y1="0" x2={r * 2} y2={r * 2} stroke="#CF142B" strokeWidth={r * 0.2} />
            <line x1="0" y1="0" x2={r * 2} y2={r * 2} stroke="#CF142B" strokeWidth={r * 0.2} />
            <rect x={r * 0.65} y="0" width={r * 0.7} height={r * 2} fill="#FFFFFF" />
            <rect x="0" y={r * 0.65} width={r * 2} height={r * 0.7} fill="#FFFFFF" />
            <rect x={r * 0.8} y="0" width={r * 0.4} height={r * 2} fill="#CF142B" />
            <rect x="0" y={r * 0.8} width={r * 2} height={r * 0.4} fill="#CF142B" />
          </g>
          <circle cx={cx + r * 0.45} cy={cy - r * 0.3} r={r * 0.15} fill="#FFFFFF" />
          <circle cx={cx + r * 0.45} cy={cy - r * 0.3} r={r * 0.1} fill="#CC142B" />
          <circle cx={cx + r * 0.6} cy={cy + r * 0.2} r={r * 0.15} fill="#FFFFFF" />
          <circle cx={cx + r * 0.6} cy={cy + r * 0.2} r={r * 0.1} fill="#CC142B" />
        </g>
      </g>
    );
  }

  // 9. Gold / XAU
  if (c === 'XAU' || c === 'GOLD') {
    return (
      <g key={idPrefix}>
        <circle cx={cx} cy={cy} r={r} fill="#E5A900" />
        <path d={`M${cx - 6} ${cy - 2}L${cx} ${cy - 5}L${cx + 6} ${cy - 2}L${cx + 4} ${cy + 3}H${cx - 4}L${cx - 6} ${cy - 2}Z`} fill="#FFFFFF" opacity="0.95" />
        <path d={`M${cx - 4} ${cy + 3}L${cx} ${cy + 1}L${cx + 4} ${cy + 3}L${cx + 2} ${cy + 6}H${cx - 2}L${cx - 4} ${cy + 3}Z`} fill="#FEF08A" />
      </g>
    );
  }

  // 10. Silver / XAG
  if (c === 'XAG' || c === 'SILVER') {
    return (
      <g key={idPrefix}>
        <circle cx={cx} cy={cy} r={r} fill="#78909C" />
        <circle cx={cx} cy={cy} r={r - 2.5} stroke="#CFD8DC" strokeWidth="1.2" fill="none" />
        <text x={cx} y={cy + 3.8} fontSize="9" fontWeight="bold" fill="#FFFFFF" textAnchor="middle" fontFamily="sans-serif">Ag</text>
      </g>
    );
  }

  // 11. Bitcoin / BTC
  if (c === 'BTC') {
    return (
      <g key={idPrefix}>
        <circle cx={cx} cy={cy} r={r} fill="#F7931A" />
        <text x={cx} y={cy + 4.5} fontSize="13" fontWeight="bold" fill="#FFFFFF" textAnchor="middle" fontFamily="sans-serif">₿</text>
      </g>
    );
  }

  // 12. Ethereum / ETH
  if (c === 'ETH') {
    return (
      <g key={idPrefix}>
        <circle cx={cx} cy={cy} r={r} fill="#627EEA" />
        <path d={`M${cx} ${cy - 7}L${cx - 4} ${cy + 1}L${cx} ${cy + 3}L${cx + 4} ${cy + 1}Z`} fill="#FFFFFF" fillOpacity="0.9" />
        <path d={`M${cx} ${cy + 4}L${cx - 4} ${cy + 2}L${cx} ${cy + 8}L${cx + 4} ${cy + 2}Z`} fill="#FFFFFF" fillOpacity="0.7" />
      </g>
    );
  }

  // 13. Solana / SOL
  if (c === 'SOL') {
    return (
      <g key={idPrefix}>
        <circle cx={cx} cy={cy} r={r} fill="#14F195" />
        <text x={cx} y={cy + 3.8} fontSize="8" fontWeight="bold" fill="#000000" textAnchor="middle" fontFamily="sans-serif">SOL</text>
      </g>
    );
  }

  // 14. Ripple / XRP
  if (c === 'XRP') {
    return (
      <g key={idPrefix}>
        <circle cx={cx} cy={cy} r={r} fill="#23292F" />
        <text x={cx} y={cy + 3.8} fontSize="8" fontWeight="bold" fill="#3B82F6" textAnchor="middle" fontFamily="sans-serif">XRP</text>
      </g>
    );
  }

  // 15. Crude Oil / WTI
  if (c === 'WTI') {
    return (
      <g key={idPrefix}>
        <circle cx={cx} cy={cy} r={r} fill="#374151" />
        <text x={cx} y={cy + 3.8} fontSize="8" fontWeight="bold" fill="#F59E0B" textAnchor="middle" fontFamily="sans-serif">OIL</text>
      </g>
    );
  }

  // Generic fallback badge
  return (
    <g key={idPrefix}>
      <circle cx={cx} cy={cy} r={r} fill="#2563EB" />
      <text x={cx} y={cy + 4.5} fontSize="11" fontWeight="bold" fill="#FFFFFF" textAnchor="middle" fontFamily="sans-serif">
        {c.charAt(0) || '$'}
      </text>
    </g>
  );
}

// Dedicated TradingView Country Flag Symbol Badges (Overlapping Flag Circles)
export default function SymbolIcon({ symbol, size = 22, className = '' }) {
  const { base, quote } = parsePair(symbol);

  // Single symbol (e.g. "BTC" or "EUR")
  if (!quote) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 28 28"
        fill="none"
        className={className}
        style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, overflow: 'visible' }}
      >
        {renderBadgeContent(base, 14, 14, 13)}
      </svg>
    );
  }

  // TradingView Overlapping Flag Circle Pair (e.g. EURUSD, GBPUSD, AUDUSD)
  const aspectWidth = Math.round(size * 1.48);

  return (
    <svg
      width={aspectWidth}
      height={size}
      viewBox="0 0 44 32"
      fill="none"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, overflow: 'visible' }}
    >
      {/* 1. Base Currency Flag Circle (e.g. European Flag at bottom-left) */}
      {renderBadgeContent(base, 14, 17.5, 11)}

      {/* 2. Cutout separator ring */}
      <circle cx="29.5" cy="13.5" r="12" fill="none" stroke="rgba(18, 20, 26, 0.95)" strokeWidth="2.2" />

      {/* 3. Quote Currency Flag Circle (e.g. USA Flag at top-right) */}
      {renderBadgeContent(quote, 29.5, 13.5, 11)}
    </svg>
  );
}
