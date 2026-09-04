import React, { useState } from 'react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'glossary' | 'economics'>('overview');

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        className="panel"
        style={{
          width: '100%',
          maxWidth: '860px',
          maxHeight: '85vh',
          background: 'rgba(255, 255, 255, 0.96)',
          borderRadius: '20px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.9)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#ffffff'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/lossfunctionlogo.svg" alt="LossFunction" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Razorpay buildathon- Lossfunction
              </h2>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>
                Cost-Optimized Two-Tier Transaction Fraud Risk Scorer with Indian BFSI Signal Context
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#475569',
              transition: 'all 0.2s ease'
            }}
            title="Close modal"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* MODAL NAVIGATION TABS */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            padding: '12px 24px',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0'
          }}
        >
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'overview' ? '#21779b' : 'transparent',
              color: activeTab === 'overview' ? '#ffffff' : '#64748b',
              transition: 'all 0.2s ease'
            }}
          >
            Architecture Overview
          </button>

          <button
            onClick={() => setActiveTab('glossary')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'glossary' ? '#21779b' : 'transparent',
              color: activeTab === 'glossary' ? '#ffffff' : '#64748b',
              transition: 'all 0.2s ease'
            }}
          >
            Signal Identifiers Glossary
          </button>

          <button
            onClick={() => setActiveTab('economics')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'economics' ? '#21779b' : 'transparent',
              color: activeTab === 'economics' ? '#ffffff' : '#64748b',
              transition: 'all 0.2s ease'
            }}
          >
            Merchant Unit Economics & p*
          </button>
        </div>

        {/* MODAL BODY CONTENT */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, fontSize: '13px', color: '#334155', lineHeight: 1.6 }}>
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: '#f0f9ff', padding: '16px', borderRadius: '12px', border: '1px solid #bae6fd' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0369a1', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="6" />
                    <circle cx="12" cy="12" r="2" />
                  </svg>
                  Mission: Minimizing Total Expected INR Loss
                </h3>
                <p>
                  Traditional fraud models optimize for raw Accuracy or F1-Score, ignoring merchant unit economics.
                  <strong> Razorpay buildathon- Lossfunction</strong> calibrates decision thresholds (p*) directly against merchant cost parameters
                  (inventory loss, chargeback fines, customer friction, and lifetime churn penalty).
                </p>
              </div>

              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#21779b" strokeWidth="2.5">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                  Two-Tier Production Architecture
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ background: '#ffffff', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 700, color: '#21779b', marginBottom: '4px' }}>
                      Tier 1: Instant Filter (&lt; 20ms SLA)
                    </div>
                    <p style={{ fontSize: '12px', color: '#64748b' }}>
                      Ultra-fast gatekeeper that fast-passes 85%+ safe transactions and fast-flags obvious fraud before reaching heavy ML models.
                    </p>
                  </div>

                  <div style={{ background: '#ffffff', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 700, color: '#7c3aed', marginBottom: '4px' }}>
                      Tier 2: Deep Queue & SHAP (~45ms)
                    </div>
                    <p style={{ fontSize: '12px', color: '#64748b' }}>
                      Evaluates gray-area transactions, generates SHAP waterfall reason codes, and calculates cost-optimal verdict for Human-in-the-Loop review.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#118649" strokeWidth="2.5">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  Human-in-the-Loop (HITL) Workflow
                </h4>
                <p>
                  Risk analysts can review flagged transactions in real-time. Actioning <em>Allow</em> or <em>Hold</em> updates ground-truth feedback,
                  re-computes realized INR savings, and continuously improves merchant protection.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'glossary' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: '#ffffff', padding: '14px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#d88900" strokeWidth="2.5">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                  60s Retries (<code style={{ color: '#0284c7' }}>card_testing_velocity_60s</code>)
                </div>
                <p style={{ marginTop: '4px', color: '#475569', fontSize: '12px' }}>
                  Tracks rapid authentication retries or payment attempt failures on a card within 60 seconds.
                  Multiple retries (e.g. &gt;2 retries) strongly indicate automated bot card-testing or BIN attacks.
                </p>
              </div>

              <div style={{ background: '#ffffff', padding: '14px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#21779b" strokeWidth="2.5">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                  Card / Regional BIN (<code style={{ color: '#0284c7' }}>bin_regional_tier</code>)
                </div>
                <p style={{ marginTop: '4px', color: '#475569', fontSize: '12px' }}>
                  Bank Identification Number (first 6 digits of card). Identifies whether card originates from a rural, co-operative, or tier-3 regional bank.
                  High-ticket purchases on regional BINs often signal compromised card details.
                </p>
              </div>

              <div style={{ background: '#ffffff', padding: '14px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#118649" strokeWidth="2.5">
                    <rect x="1" y="3" width="15" height="13" />
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                    <circle cx="5.5" cy="18.5" r="2.5" />
                    <circle cx="18.5" cy="18.5" r="2.5" />
                  </svg>
                  Logistics Route & Pincode Risk (<code style={{ color: '#0284c7' }}>pincode_distance_risk</code>)
                </div>
                <p style={{ marginTop: '4px', color: '#475569', fontSize: '12px' }}>
                  Measures geographical discrepancy between customer billing pincode and shipping destination pincode.
                  Substantial distance mismatches (e.g. Metro billing address shipping to remote location) indicate drop-shipping fraud or account takeover.
                </p>
              </div>

              <div style={{ background: '#ffffff', padding: '14px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#21779b" strokeWidth="2.5">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                    <polyline points="17 6 23 6 23 12" />
                  </svg>
                  Amount vs 90-Day Baseline (<code style={{ color: '#0284c7' }}>amount_vs_historical_ratio</code>)
                </div>
                <p style={{ marginTop: '4px', color: '#475569', fontSize: '12px' }}>
                  Compares the transaction amount against the customer's average historical purchase ticket over 90 days.
                  Spikes of 3x or 5x baseline signal stolen credential abuse.
                </p>
              </div>

              <div style={{ background: '#ffffff', padding: '14px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  SHAP Feature Waterfall & Reason Codes
                </div>
                <p style={{ marginTop: '4px', color: '#475569', fontSize: '12px' }}>
                  SHAP (SHapley Additive exPlanations) values quantify exact feature contribution to the fraud probability score, providing top-3 human-readable reason codes per transaction.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'economics' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#21779b" strokeWidth="2.5">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                  Mathematical Formulation for Optimal Threshold p*
                </h4>
                <div style={{ background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontFamily: 'monospace', fontSize: '12px', textAlign: 'center', color: '#0369a1' }}>
                  p* = (Friction + Churn + Margin × Amount) / (Chargeback + Penalty + Inventory Loss + Friction + Churn + Margin × Amount)
                </div>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
                  If estimated fraud probability <em>p &gt; p*</em>, expected loss of blocking &lt; expected loss of allowing, so optimal decision is <strong>HOLD</strong>.
                </p>
              </div>

              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#21779b" strokeWidth="2.5">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                  Vertical Unit Economics Comparison
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ background: '#ffffff', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 700, color: '#0284c7' }}>Digital SaaS & Subscriptions</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                      Ticket: ₹499 | Margin: 85% | Churn Fine: ₹3,000<br />
                      <strong>p* ≈ 69.3%</strong> (High tolerance, avoid customer churn)
                    </div>
                  </div>

                  <div style={{ background: '#ffffff', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 700, color: '#e11d48' }}>High-Value Electronics Retail</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                      Ticket: ₹45,000 | Margin: 8% | 100% Inventory Loss<br />
                      <strong>p* ≈ 9.2%</strong> (Strict threshold, physical goods stolen)
                    </div>
                  </div>

                  <div style={{ background: '#ffffff', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 700, color: '#d97706' }}>Quick Commerce & Food</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                      Ticket: ₹450 | Margin: 15% | App Switch Friction: ₹1,500<br />
                      <strong>p* ≈ 45.7%</strong> (Balanced threshold)
                    </div>
                  </div>

                  <div style={{ background: '#ffffff', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 700, color: '#7c3aed' }}>Gaming & Digital Vouchers</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                      Ticket: ₹5,000 | Margin: 70% | Liquid Voucher Cashout Risk<br />
                      <strong>p* ≈ 39.1%</strong> (Instant liquid asset risk)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#ffffff'
          }}
        >
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Built for Razorpay Buildathon | Defense-Only ML Infrastructure
          </span>

          <button
            onClick={onClose}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              background: '#21779b',
              color: '#ffffff',
              border: 'none',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
