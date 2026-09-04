import { useState, useEffect, useCallback } from 'react';
import { PersonaSelector } from './components/PersonaSelector';
import { MetricsOverview } from './components/MetricsOverview';
import { TransactionQueue, Transaction } from './components/TransactionQueue';
import { AnalystSidebar } from './components/AnalystSidebar';

function App() {
  const [selectedPersona, setSelectedPersona] = useState<string>('all');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [apiConnected, setApiConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchData = useCallback(async (personaId: string) => {
    try {
      const personaQuery = personaId !== 'all' ? `?persona=${personaId}` : '';
      
      // 1. Fetch transactions queue
      const txRes = await fetch(`http://127.0.0.1:8000/api/transactions${personaQuery}`);
      if (!txRes.ok) throw new Error("Failed to load transaction queue");
      const txData = await txRes.json();
      setTransactions(txData);

      // Auto-select first transaction if none is selected
      if (txData.length > 0) {
        setSelectedTx((prev) => {
          if (!prev) return txData[0];
          const matched = txData.find((t: Transaction) => t.tx_id === prev.tx_id);
          return matched || txData[0];
        });
      }

      // 2. Fetch model metrics
      const metricsRes = await fetch(`http://127.0.0.1:8000/api/metrics${personaQuery}`);
      if (!metricsRes.ok) throw new Error("Failed to load metrics");
      const metricsData = await metricsRes.json();
      setMetrics(metricsData);
      
      setApiConnected(true);
    } catch (err) {
      console.error("API Error:", err);
      setApiConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(selectedPersona);
  }, [selectedPersona, fetchData]);

  const handlePersonaChange = (newPersonaId: string) => {
    setSelectedPersona(newPersonaId);
  };

  const handleDecisionMade = (txId: string, action: 'Allow' | 'Hold') => {
    setTransactions((prevTxs) =>
      prevTxs.map((tx) =>
        tx.tx_id === txId
          ? {
              ...tx,
              status: action === 'Allow' ? 'Allowed' : 'Held'
            }
          : tx
      )
    );

    if (selectedTx && selectedTx.tx_id === txId) {
      setSelectedTx((prev) =>
        prev
          ? {
              ...prev,
              status: action === 'Allow' ? 'Allowed' : 'Held'
            }
          : null
      );
    }

    // Refresh metrics to compute active HITL cost savings
    const personaQuery = selectedPersona !== 'all' ? `?persona=${selectedPersona}` : '';
    fetch(`http://127.0.0.1:8000/api/metrics${personaQuery}`)
      .then((res) => res.json())
      .then((data) => setMetrics(data))
      .catch((err) => console.error("Error refreshing metrics:", err));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Top Header */}
      <header className="app-header">
        <div className="brand-title">
          <div className="brand-icon">🛡️</div>
          <div className="brand-text">
            <h1>Razorpay Buildathon — AI Risk Manager</h1>
            <p>Cost-Optimized Two-Tier Fraud Risk Scorer with Dynamic Merchant Personas</p>
          </div>
          <div className="defense-badge">Strictly Defense-Only (Read-Only Scoring)</div>
        </div>
        
        <div className="header-status">
          <div className="status-dot" style={{ backgroundColor: apiConnected ? '#10b981' : '#ef4444', boxShadow: apiConnected ? '0 0 8px #10b981' : '0 0 8px #ef4444' }} />
          <span>{apiConnected ? 'API Live (Port 8000)' : 'API Disconnected'}</span>
        </div>
      </header>

      {loading ? (
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', fontSize: '1rem', color: '#9ca3af' }}>
          Initializing Two-Tier ML models, merchant unit economics, and queue stream...
        </div>
      ) : (
        <div className="dashboard-container">
          {/* Persona Selector Bar */}
          <PersonaSelector
            selectedPersona={selectedPersona}
            onSelectPersona={handlePersonaChange}
          />

          {/* KPI Dashboard */}
          <MetricsOverview
            metrics={metrics}
            selectedPersona={selectedPersona}
          />

          {/* Split View: Transaction Stream & Analyst Details */}
          <div className="main-content-split">
            <TransactionQueue
              transactions={transactions}
              selectedTxId={selectedTx ? selectedTx.tx_id : null}
              onSelectTx={(tx) => setSelectedTx(tx)}
            />
            
            <AnalystSidebar
              selectedTx={selectedTx}
              selectedPersona={selectedPersona}
              onDecisionMade={handleDecisionMade}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
