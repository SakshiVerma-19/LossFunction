import React from 'react';

export interface PersonaInfo {
  id: string;
  name: string;
  icon: React.ReactNode;
  ticketRange: string;
  margin: string;
  keyRisk: string;
  avgThreshold: string;
}

interface PersonaSelectorProps {
  selectedPersona: string;
  onSelectPersona: (personaId: string) => void;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

export const PERSONAS: PersonaInfo[] = [
  {
    id: 'all',
    name: 'All Merchant Verticals',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
    ticketRange: '₹150 – ₹85,000',
    margin: 'Blended',
    keyRisk: 'Multi-vertical Gateway Overview',
    avgThreshold: 'Dynamic p*'
  },
  {
    id: 'digital_saas',
    name: 'Digital SaaS & Subscriptions',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="2" y1="20" x2="22" y2="20" />
      </svg>
    ),
    ticketRange: '₹199 – ₹1,499',
    margin: '85% Margin',
    keyRisk: 'High Recurring LTV Churn (₹3,000)',
    avgThreshold: 'p* ≈ 69.3%'
  },
  {
    id: 'electronics',
    name: 'High-Value Electronics Retail',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
        <line x1="12" y1="18" x2="12.01" y2="18" />
      </svg>
    ),
    ticketRange: '₹18,000 – ₹75,000',
    margin: '8% Margin',
    keyRisk: '100% Physical Inventory Loss',
    avgThreshold: 'p* ≈ 9.2%'
  },
  {
    id: 'quick_commerce',
    name: 'Quick Commerce & Food',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    ticketRange: '₹180 – ₹1,800',
    margin: '15% Margin',
    keyRisk: 'Competitor Switch Friction',
    avgThreshold: 'p* ≈ 45.7%'
  },
  {
    id: 'gaming_assets',
    name: 'Gaming & Digital Assets',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="6" y1="12" x2="10" y2="12" />
        <line x1="8" y1="10" x2="8" y2="14" />
        <circle cx="15" cy="13" r="1" />
        <circle cx="18" cy="11" r="1" />
        <path d="M17.2 4H6.8C4.1 4 2 6.1 2 8.8v6.4C2 17.9 4.1 20 6.8 20h10.4c2.7 0 4.8-2.1 4.8-4.8V8.8C22 6.1 19.9 4 17.2 4z" />
      </svg>
    ),
    ticketRange: '₹1,200 – ₹28,000',
    margin: '70% Margin',
    keyRisk: 'Instant Liquid Cash-Out Risk',
    avgThreshold: 'p* ≈ 39.1%'
  }
];

export const PersonaSelector: React.FC<PersonaSelectorProps> = ({
  selectedPersona,
  onSelectPersona,
  isMinimized = false,
  onToggleMinimize
}) => {
  if (isMinimized) return null;

  return (
    <div className="panel persona-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ display: 'flex', alignItems: 'center', color: '#21779b' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </span>
          <div>
            <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#1a202c' }}>
              Merchant Risk Persona (Unit Economics Calibration)
            </h2>
            <p style={{ fontSize: '11px', color: '#687386', marginTop: '1px' }}>
              Select a profile to observe how cost-optimal decision threshold (p*) automatically shifts
            </p>
          </div>
        </div>

        {onToggleMinimize && (
          <button className="minimize-btn" onClick={onToggleMinimize} title="Minimize Merchant Persona tab to top">
            <span>—</span>
            <span>Minimize</span>
          </button>
        )}
      </div>

      <div className="persona-pills-grid">
        {PERSONAS.map((p) => {
          const isSelected = selectedPersona === p.id;
          return (
            <button
              key={p.id}
              className={`persona-pill ${isSelected ? 'active' : ''}`}
              onClick={() => onSelectPersona(p.id)}
            >
              <div className="persona-pill-top">
                <span className="persona-icon">{p.icon}</span>
                <span className="persona-name">{p.name}</span>
              </div>
              <div className="persona-pill-meta">
                <span className="persona-badge-ticket">{p.ticketRange}</span>
                <span className="persona-badge-thresh">{p.avgThreshold}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
