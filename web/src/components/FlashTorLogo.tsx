import React from 'react';

export function FlashTorLogo({ subtitle }: { subtitle?: string }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: 24 }}>
      <div
        style={{
          width: 56,
          height: 56,
          margin: '0 auto',
          borderRadius: 18,
          background: '#2563eb',
          color: '#ffffff',
          display: 'grid',
          placeItems: 'center',
          fontWeight: 800,
          fontSize: 20,
        }}
      >
        FT
      </div>
      <h1 style={{ margin: '12px 0 0', color: '#111827' }}>FlashTor</h1>
      {subtitle ? <p style={{ color: '#6b7280', marginTop: 8 }}>{subtitle}</p> : null}
    </div>
  );
}
