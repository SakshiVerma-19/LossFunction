import { useState, useEffect, useCallback } from 'react';
import { PersonaSelector } from './components/PersonaSelector';
import { MetricsOverview } from './components/MetricsOverview';
import { TransactionQueue, type Transaction } from './components/TransactionQueue';
import { AnalystSidebar } from './components/AnalystSidebar';
import { AboutModal } from './components/AboutModal';

function App() {
  const [selectedPersona, setSelectedPersona] = useState<string>('all');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [apiConnected, setApiConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);

  // Track minimized section keys: 'personas' | 'metrics' | 'queue' | 'sidebar'
  const [minimizedSections, setMinimizedSections] = useState<string[]>([]);

  const toggleMinimize = (sectionId: string) => {
    setMinimizedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const restoreSection = (sectionId: string) => {
    setMinimizedSections((prev) => prev.filter((id) => id !== sectionId));
  };

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

  const TAB_LABELS: Record<string, { icon: React.ReactNode; title: string }> = {
    personas: {
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      ),
      title: 'Merchant Risk Personas'
    },
    metrics: {
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
      title: 'KPI Risk & Economics Metrics'
    },
    queue: {
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
      title: 'Incoming Transaction Queue'
    },
    sidebar: {
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      ),
      title: 'Transaction Inspection & SHAP Details'
    }
  };

  const isQueueMinimized = minimizedSections.includes('queue');
  const isSidebarMinimized = minimizedSections.includes('sidebar');
  const isSingleColumnGrid = isQueueMinimized || isSidebarMinimized;

  return (
    <>
      {/* Background Blobs */}
      <div className="green-blob"></div>

      {/* About Project Documentation Modal */}
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />

      {/* NAVBAR */}
      <header className="navbar">
        <div className="brand">
          <div className="brand-icon">
            <img src="/lossfunctionlogo.svg" alt="LossFunction Logo" className="brand-logo-img" />
          </div>

          <div className="brand-info">
            <h1>
              Razorpay buildathon- Lossfunction
              <span className="defense-badge">
                STRICTLY DEFENSE-ONLY
              </span>
            </h1>

            <p>
              Cost-Optimized Transaction Fraud Scorer
            </p>
          </div>
        </div>

        <div className="navbar-right">
          <button className="about-nav-btn" onClick={() => setIsAboutOpen(true)} title="View Project & Signal Details">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            About Project
          </button>

          <div className="api-status">
            <span className={`status-dot ${!apiConnected ? 'offline' : ''}`}></span>
            <span>{apiConnected ? 'API Connected' : 'API Disconnected'}</span>
          </div>

          <div className="profile" title="Risk Analyst">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
        </div>
      </header>

      {/* MAIN DASHBOARD */}
      <main className="dashboard">
        {/* TOP MINIMIZED TABS DOCK */}
        {minimizedSections.length > 0 && (
          <div className="minimized-dock">
            <span className="minimized-dock-label">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="17" x2="12" y2="22" />
                <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a1 1 0 0 0 0-2H8a1 1 0 0 0 0 2h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
              </svg>
              Minimized Tabs (Click to Restore):
            </span>
            {minimizedSections.map((secId) => {
              const info = TAB_LABELS[secId];
              return (
                <button
                  key={secId}
                  className="minimized-tab-pill"
                  onClick={() => restoreSection(secId)}
                  title={`Restore ${info.title}`}
                >
                  <span className="minimized-tab-icon">{info.icon}</span>
                  <span>{info.title}</span>
                  <span className="minimized-tab-expand">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="15 3 21 3 21 9" />
                      <polyline points="9 21 3 21 3 15" />
                      <line x1="21" y1="3" x2="14" y2="10" />
                      <line x1="3" y1="21" x2="10" y2="14" />
                    </svg>
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {loading ? (
          <div style={{ padding: '5rem 0', textAlign: 'center', color: '#687386', fontSize: '14px' }}>
            Initializing Two-Tier ML models, merchant unit economics, and queue stream...
          </div>
        ) : (
          <>
            {/* Merchant Persona Selector Panel */}
            <PersonaSelector
              selectedPersona={selectedPersona}
              onSelectPersona={handlePersonaChange}
              isMinimized={minimizedSections.includes('personas')}
              onToggleMinimize={() => toggleMinimize('personas')}
            />

            {/* KPI Metrics Dashboard */}
            <MetricsOverview
              metrics={metrics}
              selectedPersona={selectedPersona}
              isMinimized={minimizedSections.includes('metrics')}
              onToggleMinimize={() => toggleMinimize('metrics')}
            />

            {/* Split View: Transaction Queue & Inspection Sidebar */}
            {(!isQueueMinimized || !isSidebarMinimized) && (
              <section className={`content-grid ${isSingleColumnGrid ? 'single-column' : ''}`}>
                <TransactionQueue
                  transactions={transactions}
                  selectedTxId={selectedTx ? selectedTx.tx_id : null}
                  onSelectTx={(tx) => setSelectedTx(tx)}
                  isMinimized={isQueueMinimized}
                  onToggleMinimize={() => toggleMinimize('queue')}
                />

                <AnalystSidebar
                  selectedTx={selectedTx}
                  selectedPersona={selectedPersona}
                  onDecisionMade={handleDecisionMade}
                  isMinimized={isSidebarMinimized}
                  onToggleMinimize={() => toggleMinimize('sidebar')}
                />
              </section>
            )}
          </>
        )}
      </main>
    </>
  );
}

export default App;
