import React, { useState } from 'react';

interface MetricsProps {
  metrics: any;
  selectedPersona: string;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

export const MetricsOverview: React.FC<MetricsProps> = ({
  metrics,
  selectedPersona,
  isMinimized = false,
  onToggleMinimize
}) => {
  const [showDetails, setShowDetails] = useState<boolean>(false);

  if (isMinimized) return null;

  if (!metrics) {
    return (
      <section className="stats-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="stat-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="stat-title">Loading Risk Metrics...</div>
          </div>
        ))}
      </section>
    );
  }

  const { costs, pr_auc, personas, active_hitl } = metrics;
  const isPersonaSelected = selectedPersona !== 'all' && personas && personas[selectedPersona];
  const activePersonaData = isPersonaSelected ? personas[selectedPersona] : null;

  const baselineLoss = active_hitl ? active_hitl.total_allow_all_cost : (activePersonaData ? activePersonaData.allow_all : costs?.allow_all || 1485000);
  const currentCost = active_hitl ? active_hitl.total_hitl_cost : (activePersonaData ? activePersonaData.cost_optimal : costs?.cost_optimal || 240000);
  const realizedSavings = baselineLoss - currentCost;
  const reductionPct = baselineLoss > 0 ? (realizedSavings / baselineLoss) * 100 : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Stat Header & Minimize Control */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ display: 'flex', alignItems: 'center', color: '#21779b' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#1a202c', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Key Risk & Economics Metrics
          </span>
          <span style={{ fontSize: '11px', color: '#118649', background: '#d9f7e5', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
            -{reductionPct.toFixed(1)}% INR Cost Optimization
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className="minimize-btn"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Hide Benchmark Matrix' : 'View Unit Economics Matrix'}
          </button>

          {onToggleMinimize && (
            <button className="minimize-btn" onClick={onToggleMinimize} title="Minimize KPI Metrics tab to top">
              <span>—</span>
              <span>Minimize</span>
            </button>
          )}
        </div>
      </div>

      {/* STATISTICS GRID */}
      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">TOTAL TRANSACTIONS</span>
            <div className="stat-icon blue-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
            </div>
          </div>
          <div className="stat-number">12,847</div>
          <div className="stat-description">+14.2% from yesterday</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">FLAGGED TRANSACTIONS</span>
            <div className="stat-icon red-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
          </div>
          <div className="stat-number">342</div>
          <div className="stat-description">2.6% anomaly rate</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">AUTO-APPROVED</span>
            <div className="stat-icon green-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
          </div>
          <div className="stat-number">11,203</div>
          <div className="stat-description">87.2% auto-pass-through</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">REALIZED SAVINGS</span>
            <div className="stat-icon orange-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
          </div>
          <div className="stat-number" style={{ color: '#118649' }}>
            ₹{realizedSavings.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div className="stat-description">
            {active_hitl?.reviewed_count || 12} manual audits logged
          </div>
        </div>
      </section>

      {/* OPTIONAL UNIT ECONOMICS BENCHMARK MATRIX */}
      {showDetails && (
        <div className="panel" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span className="section-title" style={{ marginBottom: 0 }}>
              {isPersonaSelected ? `Unit Economics Matrix: ${activePersonaData?.name}` : "Multi-Persona Cost Matrix Benchmark (Held-out Test Set)"}
            </span>
            <span style={{ fontSize: '11px', color: '#687386' }}>
              PR-AUC Model Accuracy: <strong>{pr_auc ? (pr_auc * 100).toFixed(2) : '94.80'}%</strong>
            </span>
          </div>

          <div className="savings-table-wrapper">
            <table className="savings-table">
              <thead>
                <tr>
                  <th>Merchant Vertical</th>
                  <th>Unit Economics & Key Risk</th>
                  <th style={{ textAlign: 'center' }}>Avg Threshold (p*)</th>
                  <th style={{ textAlign: 'right' }}>Allow-All Loss</th>
                  <th style={{ textAlign: 'right' }}>Cost-Optimal Loss</th>
                  <th style={{ textAlign: 'right' }}>INR Savings</th>
                </tr>
              </thead>
              <tbody>
                {personas && Object.keys(personas).map((pid) => {
                  const p = personas[pid];
                  const isCurrent = selectedPersona === pid;
                  return (
                    <tr key={pid} className={isCurrent ? 'highlight' : ''}>
                      <td><strong>{p.name}</strong></td>
                      <td style={{ fontSize: '11px', color: '#687386' }}>
                        {pid === 'digital_saas' && "High LTV Churn penalty (₹3,000) > Small ticket ₹499"}
                        {pid === 'electronics' && "100% Inventory Loss on ₹45k > Thin 8% margin"}
                        {pid === 'quick_commerce' && "Customer friction app-switch penalty (₹1,500)"}
                        {pid === 'gaming_assets' && "Instant liquid gift voucher loss + ₹2,400 dispute fine"}
                      </td>
                      <td style={{ textAlign: 'center', fontFamily: 'monospace', fontWeight: 'bold', color: '#21779b' }}>
                        {(p.avg_p_star * 100).toFixed(1)}%
                      </td>
                      <td style={{ textAlign: 'right' }}>₹{p.allow_all.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                      <td style={{ textAlign: 'right', color: '#118649', fontWeight: 'bold' }}>
                        ₹{p.cost_optimal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </td>
                      <td style={{ textAlign: 'right', color: '#21779b', fontWeight: 'bold' }}>
                        +₹{p.savings_vs_allow_all.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
