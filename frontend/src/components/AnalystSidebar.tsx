import React, { useState, useEffect } from 'react';
import { Transaction } from './TransactionQueue';

interface SidebarProps {
  selectedTx: Transaction | null;
  selectedPersona: string;
  onDecisionMade: (txId: string, action: 'Allow' | 'Hold', feedbackMsg: string) => void;
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
  onDecisionMade
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

  if (!selectedTx) {
    return (
      <div className="sidebar-panel">
        <div className="sidebar-placeholder">
          <div className="placeholder-icon">👁️</div>
          <h3>Select Transaction to Inspect</h3>
          <p style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
            Click any incoming transaction in the queue to inspect Indian BFSI context signals, explore the SHAP feature waterfall, and perform human-in-the-loop review.
          </p>
        </div>
      </div>
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

  return (
    <div className="sidebar-panel">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Inspection: {selectedTx.tx_id}</h2>
          <span style={{ fontSize: '0.75rem', color: '#818cf8' }}>
            {explanation ? explanation.persona_name : selectedTx.merchant_name}
          </span>
        </div>
        <span className={`status-label ${selectedTx.status.toLowerCase()}`}>{selectedTx.status}</span>
      </div>

      {loading ? (
        <div style={{ padding: '3rem 0', textAlign: 'center', color: '#9ca3af', fontSize: '0.85rem' }}>
          Computing Tier 2 SHAP explanation values & merchant unit economics...
        </div>
      ) : (
        <>
          {/* Section: Indian BFSI Context Signals */}
          <div>
            <h3 className="section-title">Indian BFSI Context Signals</h3>
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
                <span className="detail-lbl">Card Retries in 60s</span>
                <span className="detail-val" style={{ color: selectedTx.card_testing_velocity_60s > 1 ? '#f87171' : '#10b981' }}>
                  {selectedTx.card_testing_velocity_60s} attempts
                </span>
              </div>
            </div>
          </div>

          {/* Section: Reason Codes */}
          {explanation && (
            <div>
              <h3 className="section-title">Top Risk Reason Codes</h3>
              <div className="reasons-list">
                {explanation.reason_codes.map((reason, i) => (
                  <div key={i} className="reason-item">
                    <span className="reason-bullet">⚡</span>
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: Dynamic Merchant Unit Economics & Cost Matrix */}
          {explanation && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="section-title" style={{ marginBottom: 0 }}>Unit Economics &amp; Expected Loss</h3>
                <span style={{ fontSize: '0.7rem', color: '#a855f7', fontWeight: 'bold' }}>
                  p* = {(explanation.threshold * 100).toFixed(1)}%
                </span>
              </div>
              <div className="cost-compare-box" style={{ marginTop: '0.6rem' }}>
                <div className={`cost-card allow ${explanation.cost_analysis.expected_loss_allow >= explanation.cost_analysis.expected_loss_block ? '' : 'better'}`}>
                  <div className="cost-card-title allow">If Allowed (Pass)</div>
                  <div className="cost-card-val">
                    ₹{explanation.cost_analysis.expected_loss_allow.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
                  </div>
                  <div className="cost-card-subtext">
                    Fraud Risk: p &times; ₹{explanation.cost_analysis.chargeback_risk_cost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </div>
                </div>

                <div className={`cost-card block ${explanation.cost_analysis.expected_loss_block > explanation.cost_analysis.expected_loss_allow ? '' : 'better'}`}>
                  <div className="cost-card-title block">If Held (Review/Block)</div>
                  <div className="cost-card-val">
                    ₹{explanation.cost_analysis.expected_loss_block.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
                  </div>
                  <div className="cost-card-subtext">
                    Friction + Churn: (1-p) &times; ₹{explanation.cost_analysis.friction_churn_cost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#fbbf24', marginTop: '0.5rem', fontStyle: 'italic', textAlign: 'center' }}>
                {explanation.probability > explanation.threshold 
                  ? "👉 Cost-Optimal Decision: HOLD (Expected Loss of Blocking < Allowing)"
                  : "👉 Cost-Optimal Decision: ALLOW (Expected Loss of Allowing < Blocking)"}
              </div>
            </div>
          )}

          {/* Section: SHAP Feature Waterfall */}
          {explanation && (
            <div>
              <h3 className="section-title">SHAP Feature Contribution Waterfall</h3>
              <div className="shap-bar-container">
                {explanation.shap_chart_data
                  .filter(f => Math.abs(f.shap_value) > 0.05)
                  .slice(0, 7)
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
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#6b7280', marginTop: '0.3rem' }}>
                <span>Genuine Signal (-SHAP)</span>
                <span>Fraud Signal (+SHAP)</span>
              </div>
            </div>
          )}

          {/* Action buttons / Outcome feedback */}
          {showFeedback ? (
            <div className={`feedback-panel ${isFeedbackSuccess ? 'success' : 'warning'}`}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                {isFeedbackSuccess ? '✅ Cost-Optimal Review Verdict' : '⚠️ Non-Optimal Review Verdict'}
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
        </>
      )}
    </div>
  );
};
