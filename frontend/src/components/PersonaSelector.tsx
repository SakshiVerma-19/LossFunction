import React from 'react';

export interface PersonaInfo {
  id: string;
  name: string;
  icon: string;
  ticketRange: string;
  margin: string;
  keyRisk: string;
  avgThreshold: string;
}

interface PersonaSelectorProps {
  selectedPersona: string;
  onSelectPersona: (personaId: string) => void;
}

export const PERSONAS: PersonaInfo[] = [
  {
    id: 'all',
    name: 'All Merchant Verticals',
    icon: '🏢',
    ticketRange: '₹150 – ₹85,000',
    margin: 'Blended',
    keyRisk: 'Multi-vertical Gateway Overview',
    avgThreshold: 'Dynamic p*'
  },
  {
    id: 'digital_saas',
    name: 'Digital SaaS & Subscriptions',
    icon: '💻',
    ticketRange: '₹199 – ₹1,499',
    margin: '85% Margin',
    keyRisk: 'High Recurring LTV Churn (₹3,000)',
    avgThreshold: 'p* ≈ 69.3%'
  },
  {
    id: 'electronics',
    name: 'High-Value Electronics Retail',
    icon: '📱',
    ticketRange: '₹18,000 – ₹75,000',
    margin: '8% Margin',
    keyRisk: '100% Physical Inventory Loss',
    avgThreshold: 'p* ≈ 9.2%'
  },
  {
    id: 'quick_commerce',
    name: 'Quick Commerce & Food',
    icon: '⚡',
    ticketRange: '₹180 – ₹1,800',
    margin: '15% Margin',
    keyRisk: 'Competitor Switch Friction',
    avgThreshold: 'p* ≈ 45.7%'
  },
  {
    id: 'gaming_assets',
    name: 'Gaming & Digital Assets',
    icon: '🎮',
    ticketRange: '₹1,200 – ₹28,000',
    margin: '70% Margin',
    keyRisk: 'Instant Liquid Cash-Out Risk',
    avgThreshold: 'p* ≈ 39.1%'
  }
];

export const PersonaSelector: React.FC<PersonaSelectorProps> = ({
  selectedPersona,
  onSelectPersona
}) => {
  return (
    <div className="persona-bar-container">
      <div className="persona-bar-header">
        <span className="persona-bar-title">🏢 Merchant Risk Persona (Unit Economics Calibration)</span>
        <span className="persona-bar-hint">Select a merchant profile to observe how the cost-optimal decision threshold p* automatically shifts</span>
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
