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
  // Payment method fields
  payment_method: 'card' | 'upi' | 'netbanking';
  vpa: string | null;
  upi_velocity_60s: number;
  vpa_age_days: number;
  ifsc_code: string | null;
  bank_account_hash: string | null;
  netbanking_session_risk: number;
  payment_method_risk: number;
  // Scoring
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
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

export const TransactionQueue: React.FC<QueueProps> = ({
  transactions,
  selectedTxId,
  onSelectTx,
  isMinimized = false,
  onToggleMinimize
}) => {
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  if (isMinimized) return null;

  const filteredTransactions = transactions.filter((tx) => {
    const matchesAction =
      filterAction === 'ALL' || tx.suggested_action.toUpperCase() === filterAction;
    const matchesStatus =
      filterStatus === 'ALL' ||
      (filterStatus === 'ALLOWED' && (tx.status === 'Allowed' || tx.status === 'Allow')) ||
      (filterStatus === 'HELD' && (tx.status === 'Held' || tx.status === 'Hold')) ||
      (filterStatus === 'PENDING' && tx.status === 'Pending');
    const matchesSearch =
      tx.tx_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.customer_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.card_bank.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.merchant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.vpa ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.ifsc_code ?? '').toLowerCase().includes(searchTerm.toLowerCase());

    return matchesAction && matchesStatus && matchesSearch;
  });

  const getProfileType = (tx: Transaction) => {
    if (tx.fraud_probability > 0.7) return 'Suspicious';
    if (tx.payment_method === 'upi' && tx.upi_velocity_60s > 1) return 'UPI Velocity';
    if (tx.card_testing_velocity_60s > 1) return 'Card Testing';
    if (tx.amount > 40000) return 'Premium';
    return 'Standard';
  };

  const getPaymentMethodBadge = (tx: Transaction) => {
    switch (tx.payment_method) {
      case 'upi':
        return {
          label: 'UPI',
          color: '#7c3aed',
          bg: 'rgba(124,58,237,0.12)',
          border: 'rgba(124,58,237,0.35)',
          sub: tx.vpa ? (tx.vpa.length > 22 ? tx.vpa.slice(0, 20) + '…' : tx.vpa) : null,
        };
      case 'netbanking':
        return {
          label: 'Net-Banking',
          color: '#0d7a55',
          bg: 'rgba(13,122,85,0.10)',
          border: 'rgba(13,122,85,0.30)',
          sub: tx.ifsc_code ?? null,
        };
      default:
        return {
          label: 'Card',
          color: '#21779b',
          bg: 'rgba(33,119,155,0.10)',
          border: 'rgba(33,119,155,0.25)',
          sub: tx.card_bank,
        };
    }
  };

  const getCostString = (tx: Transaction) => {
    const costVal = (tx.amount * tx.fraud_probability * 0.05).toFixed(2);
    const tier = tx.fraud_probability > 0.6 ? 'high' : tx.fraud_probability > 0.3 ? 'med' : 'low';
    return `₹${costVal} / ${tier}`;
  };

  return (
    <div className="panel">
      {/* QUEUE HEADER */}
      <div className="queue-header">
        <div className="queue-title">
          <h2>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#21779b" strokeWidth="2.2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Incoming Transaction Queue
          </h2>
          <p>Showing {filteredTransactions.length} of {transactions.length} real-time transactions</p>
        </div>

        <div className="filters">
          <div className="search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search TXN, Customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
          >
            <option value="ALL">All Actions</option>
            <option value="ALLOW">Allow (Pass)</option>
            <option value="HOLD">Hold (Flag)</option>
            <option value="REVIEW">Review (Gray)</option>
          </select>

          <select
            className="filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="ALLOWED">Approved</option>
            <option value="HELD">Flagged</option>
            <option value="PENDING">Pending</option>
          </select>

          {onToggleMinimize && (
            <button className="minimize-btn" onClick={onToggleMinimize} title="Minimize Queue tab to top">
              <span>—</span>
              <span>Minimize</span>
            </button>
          )}
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>CUSTOMER</th>
              <th>MERCHANT (MCC)</th>
              <th>PAYMENT</th>
              <th>AMOUNT (INR)</th>
              <th>FISCAL PROFILE</th>
              <th>THRESHOLD %</th>
              <th>COST SUGGESTED</th>
              <th>REVIEW STATUS</th>
            </tr>
          </thead>

          <tbody>
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '3rem 1rem', color: '#687386' }}>
                  No incoming transactions match current filters.
                </td>
              </tr>
            ) : (
              filteredTransactions.map((tx) => {
                const isSelected = selectedTxId === tx.tx_id;
                const isApproved = tx.status === 'Allowed' || tx.status === 'Allow';
                const isHeld = tx.status === 'Held' || tx.status === 'Hold';

                const statusClass = isApproved ? 'approved' : isHeld ? 'flagged' : 'pending';
                const statusLabel = isApproved ? 'Approved' : isHeld ? 'Flagged' : 'Pending';

                const isPincodeMismatch = tx.billing_pincode !== tx.shipping_pincode;

                return (
                  <tr
                    key={tx.tx_id}
                    className={isSelected ? 'selected' : ''}
                    onClick={() => onSelectTx(tx)}
                  >
                    <td className="transaction-id">
                      {tx.tx_id}
                    </td>

                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span>{tx.customer_id}</span>
                        <span style={{ fontSize: '11px', color: '#687386', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          {isPincodeMismatch && (
                            <span title="Pincode Mismatch" style={{ color: '#d88900', display: 'inline-flex' }}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                              </svg>
                              Pincode mismatch
                            </span>
                          )}
                        </span>
                      </div>
                    </td>

                    <td className="merchant">
                      {tx.merchant_name} ({tx.mcc})
                    </td>

                    {/* PAYMENT METHOD COLUMN */}
                    <td>
                      {(() => {
                        const pm = getPaymentMethodBadge(tx);
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: '999px',
                              fontSize: '11px',
                              fontWeight: 700,
                              color: pm.color,
                              background: pm.bg,
                              border: `1px solid ${pm.border}`,
                              letterSpacing: '0.3px',
                            }}>
                              {pm.label}
                            </span>
                            {pm.sub && (
                              <span style={{ fontSize: '10px', color: '#687386', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {pm.sub}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </td>

                    <td className="amount">
                      ₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="profile-type">
                      {getProfileType(tx)}
                    </td>

                    <td className="threshold">
                      {(tx.cost_optimal_threshold * 100).toFixed(1)}%
                    </td>

                    <td className="cost">
                      {getCostString(tx)}
                    </td>

                    <td>
                      <span className={`badge ${statusClass}`}>
                        {statusLabel}
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
