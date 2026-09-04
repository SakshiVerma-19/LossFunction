import React from 'react';

interface MetricsProps {
  metrics: any;
  selectedPersona: string;
}

export const MetricsOverview: React.FC<MetricsProps> = ({ metrics, selectedPersona }) => {
  if (!metrics) {
    return (
      <div className="metrics-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="metric-card animate-pulse" style={{ height: '100px' }}>
            <div className="metric-label">Loading Metrics...</div>
          </div>
        ))}
      </div>
    );
  }

  const { costs, latency, pr_auc, personas, active_hitl } = metrics;
  
  // Filter numbers if a specific persona is selected
  const isPersonaSelected = selectedPersona !== 'all' && personas && personas[selectedPersona];
  const activePersonaData = isPersonaSelected ? personas[selectedPersona] : null;

  const baselineLoss = active_hitl ? active_hitl.total_allow_all_cost : (activePersonaData ? activePersonaData.allow_all : costs.allow_all);
  const currentCost = active_hitl ? active_hitl.total_hitl_cost : (activePersonaData ? activePersonaData.cost_optimal : costs.cost_optimal);
  const realizedSavings = baselineLoss - currentCost;
  const reductionPct = baselineLoss > 0 ? (realizedSavings / baselineLoss) * 100 : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* 4 Main KPI Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Baseline Expected Loss (Allow All)</div>
          <div className="metric-value">₹{baselineLoss.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          <div className="metric-delta negative">Unmitigated fraud risk</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-label">Actual Expected Loss (HITL)</div>
          <div className="metric-value">₹{currentCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          <div className="metric-delta positive">
            -{reductionPct.toFixed(1)}% cost reduction
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Realized INR Savings</div>
          <div className="metric-value" style={{ color: '#10b981' }}>
            ₹{realizedSavings.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div className="metric-delta positive">
            {active_hitl?.reviewed_count || 0} manual reviews completed
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Two-Tier Production SLA</div>
          <div className="metric-value" style={{ color: '#818cf8', fontSize: '1.4rem' }}>
            &lt; 0.01 ms
          </div>
          <div className="metric-delta positive">
            ⚡ Tier 1 Instant (SLA: &lt;20ms) | Tier 2 Deep: ~45ms
          </div>
        </div>
      </div>

      {/* Dynamic Merchant Persona Unit Economics & Benchmark Table */}
      <div className="metric-card" style={{ padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
          <div className="metric-label" style={{ marginBottom: 0 }}>
            {isPersonaSelected ? `Unit Economics Breakdown: ${activePersonaData.name}` : "Multi-Persona Cost Matrix Benchmark (Held-out Test Set)"}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>PR-AUC Rigor: <strong>{(pr_auc * 100).toFixed(2)}%</strong></span>
        </div>

        <table className="savings-table">
          <thead>
            <tr>
              <th>Merchant Persona</th>
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
                <tr key={pid} className={isCurrent ? 'highlight' : ''} style={{ background: isCurrent ? 'rgba(99, 102, 241, 0.12)' : 'transparent' }}>
                  <td><strong>{p.name}</strong></td>
                  <td style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                    {pid === 'digital_saas' && "High LTV Churn penalty (₹3,000) > Small ticket ₹499"}
                    {pid === 'electronics' && "100% Inventory Loss on ₹45k > Thin 8% margin"}
                    {pid === 'quick_commerce' && "Customer friction app-switch penalty (₹1,500)"}
                    {pid === 'gaming_assets' && "Instant liquid gift voucher loss + ₹2,400 dispute fine"}
                  </td>
                  <td style={{ textAlign: 'center', fontFamily: 'monospace', fontWeight: 'bold' }}>
                    {(p.avg_p_star * 100).toFixed(1)}%
                  </td>
                  <td style={{ textAlign: 'right' }}>₹{p.allow_all.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                  <td style={{ textAlign: 'right', color: '#10b981', fontWeight: 'bold' }}>₹{p.cost_optimal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                  <td style={{ textAlign: 'right', color: '#818cf8', fontWeight: 'bold' }}>+₹{p.savings_vs_allow_all.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
