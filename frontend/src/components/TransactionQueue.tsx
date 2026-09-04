import React, { useState } from 'react';

export interface Transaction {
  tx_id: string;
  time_elapsed: number;
  amount: number;
  customer_id: string;
  merchant_persona: string;
  merchant_name: string;
  mcc: string;
  mcc_name: string;
  card_bank: string;
  card_bin: string;
  bin_regional_tier: string;
  billing_pincode: string;
  shipping_pincode: string;
  pincode_distance_risk: number;
  card_testing_velocity_60s: number;
  state: string;
  device_mismatch: number;
  ip_mismatch: number;
  velocity_1h: number;
  hour_ist: number;
  time_mcc_anomaly: number;
  amount_vs_historical_ratio: number;
  tier1_score: number;
  tier1_triage: string;
  fraud_probability: number;
  cost_optimal_threshold: number;
  suggested_action: string;
  status: string;
  true_class: number;
}

interface QueueProps {
  transactions: Transaction[];
  selectedTxId: string | null;
  onSelectTx: (tx: Transaction) => void;
}

export const TransactionQueue: React.FC<QueueProps> = ({
  transactions,
  selectedTxId,
  onSelectTx
}) => {
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [filterTriage, setFilterTriage] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredTransactions = transactions.filter((tx) => {
    const matchesAction =
      filterAction === 'ALL' || tx.suggested_action.toUpperCase() === filterAction;
    const matchesTriage =
      filterTriage === 'ALL' ||
      (filterTriage === 'FAST_PASS' && tx.tier1_triage.includes('Fast-Path Pass')) ||
      (filterTriage === 'DEEP_QUEUE' && tx.tier1_triage.includes('Deep Queue')) ||
      (filterTriage === 'FAST_FLAG' && tx.tier1_triage.includes('Fast-Path Flag'));
    const matchesSearch =
      tx.tx_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.customer_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.card_bank.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.merchant_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesAction && matchesTriage && matchesSearch;
  });

  return (
    <div className="queue-panel">
      <div className="panel-header">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <div className="panel-title">🛡️ Live CNP Transaction Stream (Advisory Review Queue)</div>
          <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
            Triaged via Two-Tier Engine: <strong>{filteredTransactions.length}</strong> transactions in active view
          </span>
        </div>
        
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search TXN, Bank, Pincode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              padding: '0.35rem 0.6rem',
              color: 'white',
              fontSize: '0.8rem',
              outline: 'none',
              width: '180px'
            }}
          />
          
          <select
            value={filterTriage}
            onChange={(e) => setFilterTriage(e.target.value)}
            style={{
              background: '#111827',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              padding: '0.35rem 0.5rem',
              color: 'white',
              fontSize: '0.8rem',
              outline: 'none'
            }}
          >
            <option value="ALL">All Triage Paths</option>
            <option value="DEEP_QUEUE">Tier 2 Deep Queue</option>
            <option value="FAST_FLAG">Tier 1 Fast Flag</option>
            <option value="FAST_PASS">Tier 1 Fast Pass</option>
          </select>

          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            style={{
              background: '#111827',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              padding: '0.35rem 0.5rem',
              color: 'white',
              fontSize: '0.8rem',
              outline: 'none'
            }}
          >
            <option value="ALL">All Suggestions</option>
            <option value="HOLD">Hold (p &gt; p*)</option>
            <option value="REVIEW">Review (p ≈ p*)</option>
            <option value="ALLOW">Allow (Safe)</option>
          </select>
        </div>
      </div>
      
      <div className="table-container">
        <table className="transaction-table">
          <thead>
            <tr>
              <th>TX ID & Triage</th>
              <th>Customer & Route</th>
              <th>Card / Regional BIN</th>
              <th>Amount (INR)</th>
              <th style={{ textAlign: 'right' }}>Fraud Prob</th>
              <th style={{ textAlign: 'right' }}>Threshold (p*)</th>
              <th style={{ textAlign: 'center' }}>Cost Suggested</th>
              <th style={{ textAlign: 'center' }}>Review Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                  No transactions match current filters.
                </td>
              </tr>
            ) : (
              filteredTransactions.map((tx) => {
                const isSelected = selectedTxId === tx.tx_id;
                const isRural = tx.bin_regional_tier === 'rural_regional' || tx.bin_regional_tier === 'coop_urban';
                const hasCardTesting = tx.card_testing_velocity_60s > 1;
                const isPincodeMismatch = tx.billing_pincode !== tx.shipping_pincode;

                return (
                  <tr
                    key={tx.tx_id}
                    className={isSelected ? 'selected' : ''}
                    onClick={() => onSelectTx(tx)}
                  >
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <span style={{ fontWeight: '600', color: isSelected ? '#a855f7' : '#f3f4f6' }}>{tx.tx_id}</span>
                        <span className={`triage-badge ${
                          tx.tier1_triage.includes('Fast-Path Pass') ? 'pass' :
                          tx.tier1_triage.includes('Fast-Path Flag') ? 'flag' : 'queue'
                        }`}>
                          {tx.tier1_triage.includes('Fast-Path Pass') ? '⚡ Fast-Pass (<20ms)' :
                           tx.tier1_triage.includes('Fast-Path Flag') ? '🚨 Fast-Flag' : '📥 Deep Queue'}
                        </span>
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                        <span>{tx.customer_id}</span>
                        <span style={{ fontSize: '0.7rem', color: isPincodeMismatch ? '#f59e0b' : '#9ca3af' }}>
                          PIN: {tx.billing_pincode} → {tx.shipping_pincode} {isPincodeMismatch && '⚠️'}
                        </span>
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                        <span>{tx.card_bank}</span>
                        <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>BIN: {tx.card_bin}</span>
                          {isRural && (
                            <span style={{ fontSize: '0.65rem', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '0.1rem 0.3rem', borderRadius: '3px' }}>
                              Regional/Co-op
                            </span>
                          )}
                          {hasCardTesting && (
                            <span style={{ fontSize: '0.65rem', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', padding: '0.1rem 0.3rem', borderRadius: '3px' }}>
                              ⚡ {tx.card_testing_velocity_60s} retries/60s
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td style={{ fontWeight: '600' }}>
                      ₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    <td style={{ textAlign: 'right', fontWeight: 'bold', fontFamily: 'monospace' }}>
                      {(tx.fraud_probability * 100).toFixed(1)}%
                    </td>

                    <td style={{ textAlign: 'right', color: '#9ca3af', fontFamily: 'monospace' }}>
                      {(tx.cost_optimal_threshold * 100).toFixed(1)}%
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge ${tx.suggested_action.toLowerCase()}`}>
                        {tx.suggested_action}
                      </span>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <span className={`status-label ${tx.status.toLowerCase()}`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
