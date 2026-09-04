import React, { useState, useEffect } from 'react';
import { type Transaction } from './TransactionQueue';

interface SidebarProps {
  selectedTx: Transaction | null;
  selectedPersona: string;
  onDecisionMade: (txId: string, action: 'Allow' | 'Hold', feedbackMsg: string) => void;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

interface ExplanationData {
  tx_id: string;
  merchant_persona: string;
  persona_name: string;
  probability: number;
  tier1_score: number;
  tier1_triage: string;
  threshold: number;
  reason_codes: string[];
  shap_chart_data: {
    feature: string;
    value: number;
    shap_value: number;
  }[];
  cost_analysis: {
    amount: number;
    margin: number;
    is_digital: boolean;
    expected_loss_allow: number;
    expected_loss_block: number;
    chargeback_risk_cost: number;
    friction_churn_cost: number;
    review_cost: number;
  };
}

export const AnalystSidebar: React.FC<SidebarProps> = ({
  selectedTx,
  selectedPersona,
  onDecisionMade,
  isMinimized = false,
  onToggleMinimize
}) => {
  const [explanation, setExplanation] = useState<ExplanationData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [actionFeedback, setActionFeedback] = useState<{
    status: string;
    feedback_message: string;
    true_class: number;
  } | null>(null);

  useEffect(() => {
    if (!selectedTx) {
      setExplanation(null);
      setActionFeedback(null);
      return;
    }

    setLoading(true);
    setActionFeedback(null);

    const personaQuery = selectedPersona !== 'all' ? `?persona=${selectedPersona}` : '';
    fetch(`http://127.0.0.1:8000/api/explain/${selectedTx.tx_id}${personaQuery}`)
      .then((res) => {
        if (!res.ok) throw new Error("Explanation API failed");
        return res.json();
      })
      .then((data: ExplanationData) => {
        setExplanation(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [selectedTx, selectedPersona]);

  const handleAction = async (action: 'Allow' | 'Hold') => {
    if (!selectedTx) return;
    setSubmitting(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tx_id: selectedTx.tx_id, action })
      });

      if (!response.ok) throw new Error("Action API failed");
      const data = await response.json();

      setActionFeedback({
        status: data.status,
        feedback_message: data.feedback_message,
        true_class: data.true_class
      });

      onDecisionMade(selectedTx.tx_id, action, data.feedback_message);
    } catch (err) {
      console.error(err);
      alert("Failed to submit action. Is the FastAPI server running?");
    } finally {
      setSubmitting(false);
    }
  };

  if (isMinimized) return null;

  const renderHeader = (title: string, subtitle?: string) => (
    <div className="inspection-header">
      <div>
        <h3>{title}</h3>
        {subtitle && <p>{subtitle}</p>}
      </div>

      {onToggleMinimize && (
        <button className="minimize-btn" onClick={onToggleMinimize} title="Minimize Inspection tab to top">
          <span>—</span>
          <span>Minimize</span>
        </button>
      )}
    </div>
  );

  if (!selectedTx) {
    return (
      <aside className="panel inspection-panel">
        {renderHeader("Inspection Details", "Analyst Audit Panel")}

        <div className="empty-state">
          <div className="empty-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
              <line x1="13" y1="13" x2="19" y2="19" />
            </svg>
          </div>
          <h3>Select Transaction</h3>
          <p>
            Click any incoming transaction in the queue list to inspect security explanations, view deep feature contributions, and take manual risk review decisions.
          </p>
        </div>
      </aside>
    );
  }

  const getReadableFeatureName = (name: string) => {
    const maps: { [key: string]: string } = {
      'card_testing_velocity_60s': 'Card Testing Retries (60s)',
      'pincode_distance_risk': 'Pincode Logistics Mismatch Risk',
      'bin_regional_risk': 'Rural/Co-op BIN Anomaly',
      'time_mcc_anomaly': 'Night Window MCC Anomaly',
      'amount_vs_historical_ratio': 'Amount vs 90-Day Baseline',
      'amount_scaled': 'Transaction Ticket (INR)',
      'device_mismatch': 'New Device Fingerprint',
      'ip_mismatch': 'State Geolocation Mismatch',
      'velocity_1h': '1-Hour Customer Velocity',
      'hour_ist': 'Hour of Day (IST)',
      'mcc_fraud_rate': 'Merchant MCC Risk'
    };
    if (name.startsWith('V')) return `PCA Pattern Signal (${name})`;
    return maps[name] || name;
  };

  const isPending = selectedTx.status === 'Pending';
  const showFeedback = actionFeedback || !isPending;
  const displayFeedbackText = actionFeedback
    ? actionFeedback.feedback_message
    : (selectedTx.true_class === 1
        ? `Ground Truth: Verified Fraud. Analyst action logged: ${selectedTx.status}.`
        : `Ground Truth: Genuine Customer. Analyst action logged: ${selectedTx.status}.`);
  const isFeedbackSuccess = actionFeedback
    ? (selectedTx.status === 'Hold' ? actionFeedback.true_class === 1 : actionFeedback.true_class === 0)
    : (selectedTx.status === 'Held' ? selectedTx.true_class === 1 : selectedTx.true_class === 0);

  // Formulate concise Top-3 SHAP badges for quick explainability
  const getShortReasonTitle = (reasonText: string) => {
    if (reasonText.includes("Card Testing Velocity")) return "Velocity Spike Failure (60s Retries)";
    if (reasonText.includes("Logistics Distance Anomaly")) return "Pincode Logistics Mismatch";
    if (reasonText.includes("Regional BIN Mismatch")) return "High-risk Regional Bank BIN";
    if (reasonText.includes("Time-Window Anomaly")) return "Night Window Anomaly";
    if (reasonText.includes("Amount Velocity Spike")) return "Amount Velocity Baseline Spike";
    if (reasonText.includes("Device Fingerprint")) return "Unrecognized Device Fingerprint";
    if (reasonText.includes("Geolocation Mismatch")) return "State Geolocation Mismatch";
    if (reasonText.includes("ticket size")) return "Elevated Ticket Size";
    return reasonText;
  };

  return (
    <aside className="panel inspection-panel">
      {renderHeader(
        `Inspection: ${selectedTx.tx_id}`,
        explanation ? explanation.persona_name : selectedTx.merchant_name
      )}

      {loading ? (
        <div style={{ padding: '3rem 0', textAlign: 'center', color: '#687386', fontSize: '13px' }}>
          Computing Tier 2 SHAP explanation values & unit economics...
        </div>
      ) : (
        <div className="inspection-content" style={{ marginTop: '12px' }}>
          {/* TOP 3 SHAP REASON CODES - PROMINENT EXPLAINABILITY CARD */}
          {explanation && (
            <div style={{ background: 'rgba(255, 241, 218, 0.6)', padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(216, 137, 0, 0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  Top-3 SHAP Reason Codes (Explainability)
                </span>
                <span style={{ fontSize: '10px', color: '#b45309', fontWeight: 700 }}>
                  p = {(selectedTx.fraud_probability * 100).toFixed(1)}%
                </span>
              </div>

              <div className="reasons-list">
                {explanation.reason_codes.slice(0, 3).map((reason, i) => (
                  <div key={i} className="reason-item" style={{ background: '#ffffff', borderLeft: '3px solid #d88900' }}>
                    <span className="reason-bullet">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#d88900" strokeWidth="2.5">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                      </svg>
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 700, color: '#1a202c', fontSize: '12px' }}>
                        {getShortReasonTitle(reason)}
                      </span>
                      <span style={{ fontSize: '11px', color: '#64748b', marginTop: '1px' }}>
                        {reason}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BFSI CONTEXT SIGNALS */}
          <div>
            <h4 className="section-title">Indian BFSI Context Signals</h4>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-lbl">Customer ID</span>
                <span className="detail-val">{selectedTx.customer_id}</span>
              </div>
              <div className="detail-item">
                <span className="detail-lbl">Card / Regional BIN</span>
                <span className="detail-val">{selectedTx.card_bank} ({selectedTx.card_bin})</span>
              </div>
              <div className="detail-item">
                <span className="detail-lbl">Logistics Route</span>
                <span className="detail-val">
                  {selectedTx.billing_pincode} → {selectedTx.shipping_pincode}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-lbl">60s Retries</span>
                <span className="detail-val" style={{ color: selectedTx.card_testing_velocity_60s > 1 ? '#e13737' : '#118649' }}>
                  {selectedTx.card_testing_velocity_60s} attempts
                </span>
              </div>
            </div>
          </div>

          {/* UNIT ECONOMICS & COST MATRIX */}
          {explanation && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 className="section-title" style={{ marginBottom: 0 }}>Unit Economics & Expected Loss</h4>
                <span style={{ fontSize: '11px', color: '#21779b', fontWeight: 700 }}>
                  p* = {(explanation.threshold * 100).toFixed(1)}%
                </span>
              </div>

              <div className="cost-compare-box" style={{ marginTop: '8px' }}>
                <div className="cost-card allow">
                  <div className="cost-card-title allow">If Allowed (Pass)</div>
                  <div className="cost-card-val">
                    ₹{explanation.cost_analysis.expected_loss_allow.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
                  </div>
                  <div className="cost-card-subtext">
                    Risk: p × ₹{explanation.cost_analysis.chargeback_risk_cost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </div>
                </div>

                <div className="cost-card block">
                  <div className="cost-card-title block">If Held (Block)</div>
                  <div className="cost-card-val">
                    ₹{explanation.cost_analysis.expected_loss_block.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
                  </div>
                  <div className="cost-card-subtext">
                    Churn: (1-p) × ₹{explanation.cost_analysis.friction_churn_cost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SHAP WATERFALL */}
          {explanation && (
            <div>
              <h4 className="section-title">SHAP Feature Contribution Waterfall</h4>
              <div className="shap-bar-container">
                {explanation.shap_chart_data
                  .filter(f => Math.abs(f.shap_value) > 0.05)
                  .slice(0, 6)
                  .map((item) => {
                    const maxVal = 2.0;
                    const widthPercent = Math.min(Math.abs(item.shap_value) / maxVal * 50, 50);
                    const isPositive = item.shap_value > 0;

                    return (
                      <div key={item.feature} className="shap-row">
                        <div className="shap-feat-name" title={getReadableFeatureName(item.feature)}>
                          {getReadableFeatureName(item.feature)}
                        </div>
                        <div className="shap-bar-wrapper">
                          <div className="shap-bar-bg">
                            <div
                              className={`shap-bar-fill ${isPositive ? 'positive' : 'negative'}`}
                              style={{
                                width: `${widthPercent}%`,
                                [isPositive ? 'left' : 'right']: '50%'
                              }}
                            />
                          </div>
                          <span className={`shap-val-txt ${isPositive ? 'positive' : 'negative'}`}>
                            {isPositive ? '+' : ''}{item.shap_value.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* DECISION ACTION / FEEDBACK */}
          {showFeedback ? (
            <div className={`feedback-panel ${isFeedbackSuccess ? 'success' : 'warning'}`}>
              <div style={{ fontWeight: 700, marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {isFeedbackSuccess ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                )}
                {isFeedbackSuccess ? 'Cost-Optimal Review Verdict' : 'Non-Optimal Review Verdict'}
              </div>
              <div>{displayFeedbackText}</div>
            </div>
          ) : (
            <div className="action-box">
              <button
                className="btn btn-allow"
                disabled={submitting}
                onClick={() => handleAction('Allow')}
              >
                Allow Transaction
              </button>
              <button
                className="btn btn-hold"
                disabled={submitting}
                onClick={() => handleAction('Hold')}
              >
                Hold (Review)
              </button>
            </div>
          )}
        </div>
      )}
    </aside>
  );
};
