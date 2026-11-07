# LossFunction

## Two-Tier Transaction Fraud Risk Scorer with Cost-Optimized Decisioning & Multi-Rail Indian BFSI Telemetry

[![Razorpay Buildathon](https://img.shields.io/badge/Razorpay%20Buildathon-Project%20Submission-blue.svg)](#1-project-overview--problem-statement)
[![Defense-Only Security Boundary](https://img.shields.io/badge/Security-Strictly%20Defense--Only-emerald.svg)](#2-strict-defense-only-security-boundary)
[![Latency SLA](https://img.shields.io/badge/Tier%201%20Latency-%3C%2020ms-blue.svg)](#3-two-tier-production-architecture--flow)
[![Kaggle Verified](https://img.shields.io/badge/Kaggle%20Ground%20Truth-ROC--AUC%200.9850-gold.svg)](#7-evaluation-metrics--ground-truth-benchmarks)
[![Expected Loss Minimization](https://img.shields.io/badge/Economics-Cost--Optimal%20p*-purple.svg)](#6-dynamic-merchant-risk-profiles-cost-matrix-engine)

---

> 📖 **Deep Dive**: For an exhaustive architectural breakdown, formal mathematical derivations, feature schemas, REST API documentation, and system limitations, see [PROJECT_DETAILS.md](./PROJECT_DETAILS.md).

---

## 1. Project Overview & Problem Statement

Built for the **Razorpay Buildathon**, **LossFunction** is a production-oriented transaction fraud risk scoring and triage system. It tackles three fundamental shortcomings in modern payment gateway fraud mitigation:

1. **The Cost Asymmetry Blindspot**: Standard machine learning deployments default to a rigid static threshold (typically $p > 0.50$ or high-percentile cutoffs). This ignores the reality of merchant economics: **a false positive (blocking a loyal customer, destroying recurring Lifetime Value) and a false negative (permitting fraud, losing inventory plus chargeback fees) carry drastically unequal financial costs** across different business models.
2. **Synchronous Latency Bottlenecks**: Modern payment gateways operate under strict latency budgets (often `< 20ms` for synchronous card authorization). Running high-depth tree ensembles, feature aggregations, and SHAP explainability pipelines within this sub-20ms window causes authorization timeouts and gateway drop-offs.
3. **The "Comfortable 1.0000 AUC" Synthetic Trap**: Fraud models frequently achieve artificial `1.0000` test ROC-AUC scores on synthetically generated datasets that feature non-overlapping feature bounds or rely on anonymized PCA shortcuts. When exposed to noisy production traffic, uncalibrated minority-class multipliers produce severely distorted probabilities that break Bayes-optimal decisioning.

### The LossFunction Solution

LossFunction solves these challenges through:
- **Two-Tier Latency-Budgeted Architecture**: Tier 1 executes ultra-fast tabular LightGBM triage (`< 0.002 ms` benchmark vs. `< 20ms` SLA) to instantly clear low-risk transactions or fast-track obvious attacks. Tier 2 routes borderline "gray area" transactions to an asynchronous deep queue (`45.2 ms` benchmark vs. `< 500ms` SLA) powered by calibrated XGBoost and local SHAP explainability.
- **Cost-Optimal Decisioning Engine ($p^*$)**: Replaces arbitrary cutoffs with a closed-form dynamic threshold ($p^* = \frac{C_{\text{FP}}}{C_{\text{FN}} + C_{\text{FP}} - C_{\text{review}}}$) tailored to specific merchant personas (Digital SaaS, High-Value Electronics, Quick Commerce, Gaming & Digital Assets).
- **Multi-Rail Indian BFSI Telemetry**: Models authentic Indian payment ecosystems across **Cards** (regional rural/co-operative BINs, 60s retries), **UPI** (VPA handle age, 60s attempt velocity), and **Net-Banking** (IFSC routing, session anomaly telemetry, hashed accounts).
- **Dual Validation Benchmarks**: Evaluated on both unaltered **Kaggle ground truth (284,807 transactions)** and a **50,000-transaction Indian BFSI stress-testing suite** with realistic overlapping class distributions.

---

## 2. Strict Defense-Only Security Boundary

> ### Security & Compliance Declaration
> **LossFunction is strictly a Read-Only Advisory Scoring & Decision Support System:**
> - **Zero Offensive Capabilities**: The system contains **zero egress API routes** capable of autonomously triggering payment blocks, account freezes, card network blacklisting, or merchant fund holds.
> - **Human-in-the-Loop Review Trail**: Every risk recommendation culminates in a structured advisory queue where human risk ops analysts retain final decision authority.
> - **No Autonomous Financial Interception**: Model outputs ($p$, $p^*$, reason codes) serve purely as decision intelligence for operations analysts and gateway policy rule engines.
> - **Defense-Only Validation Suite**: All synthetic data generation modules are framed strictly as stress-testing suites to benchmark model robustness against class imbalance.

---

## 3. Two-Tier Production Architecture & Flow

To honor payment gateway service-level agreements (SLAs), LossFunction partitions transaction evaluation into two distinct tiers:

```
                    Incoming Multi-Rail Payment Payload
                    (Card / UPI / Net-Banking / Merchant)
                                      │
                                      ▼
           ┌─────────────────────────────────────────────────────┐
           │   Tier 1: Instant Low-Latency Engine (<20ms SLA)    │
           │   (LightGBM on operational features — < 0.002 ms)   │
           └──────────────────────────┬──────────────────────────┘
                                      │ Fast Score (p_t1)
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
             p_t1 < 0.20      0.20 <= p_t1 < 0.85    p_t1 >= 0.85
           ┌──────────────┐   ┌─────────────────┐   ┌──────────────┐
           │  Fast-Path   │   │   Deep Queue    │   │  Fast-Path   │
           │     Pass     │   │   (Gray Area)   │   │     Flag     │
           │ (Auto-Clear) │   │ (Asynchronous)  │   │(Priority Hold│
           └──────────────┘   └────────┬────────┘   └───────┬──────┘
                                       │                    │
                                       ▼                    ▼
           ┌─────────────────────────────────────────────────────┐
           │ Tier 2: Deep Analysis & Explainability (<500ms SLA) │
           │  - Full Behavioral Signals (UPI age, Pincode risk)  │
           │  - Calibrated XGBoost Classifier (45.2 ms queue)    │
           │  - Local SHAP TreeExplainer for Top-3 Reason Codes  │
           │  - Dynamic Merchant Persona Cost Matrix Engine (p*) │
           └──────────────────────────┬──────────────────────────┘
                                      │
                                      ▼
           ┌─────────────────────────────────────────────────────┐
           │   Human-in-the-Loop Risk Ops Review Dashboard       │
           │  (Analyst Overrides, Reason Codes & Unit Economics) │
           └──────────────────────────┬──────────────────────────┘
                                      │
              ┌───────────────────────┴───────────────────────┐
              ▼                                               ▼
         [ALLOW]                                           [HOLD]
    Genuine Cleared safely                         Fraud Blocked early
    (Friction & Churn Avoided)                     (Chargeback & Fees Saved)
```

### Two-Tier Latency & SLA Specifications

| Tier | Target SLA | Measured Benchmark | Processing Mode | Model & Signals |
|---|:---:|:---:|---|---|
| **Tier 1 (Instant Filter)** | `< 20 ms` | **`0.0003 – 0.002 ms`** | Synchronous (Authorization Window) | Lightweight LightGBM (60 trees, max depth 4) on fast tabular features (`amount_scaled`, `mcc_fraud_rate`, `hour_ist`, `velocity_1h`, `card_testing_velocity_60s`, `upi_velocity_60s`, `bin_regional_risk`, `payment_method_risk`). |
| **Tier 2 (Deep Queue)** | `< 500 ms` | **`45.2 ms`** | Asynchronous (Review Queue) | High-capacity XGBoost (100 trees, max depth 5) + `shap.TreeExplainer` on full Indian BFSI signals + Dynamic Merchant Unit Economics ($p^*$). |

---

## 4. Multi-Rail Indian BFSI Feature Engineering

LossFunction is built around the specific structural patterns and risk indicators of the Indian digital payments landscape:

### 1. Card Rails (Credit & Debit)
- **BIN Regional Risk Profiling**: Bank Identification Number (first 6 digits) risk categorization across Metro Tier 1 (HDFC Infinia, ICICI Sapphiro), National PSU (SBI Global, PNB RuPay), and Regional Rural / Urban Co-operative Banks (Aryavart Gramin, Saraswat Co-op). Flags high-ticket luxury purchases routed through rural co-operative BINs.
- **Card-Testing Velocity (60s Retries)**: Detects automated bot-driven card-testing attacks by counting authentication failures within the preceding 60-second window.

### 2. Unified Payments Interface (UPI)
- **VPA Account Age**: Tracks the age of the Virtual Payment Address (`vpa_age_days`). Identifies newly minted disposable VPAs (< 30 days) versus established customer handles.
- **Rapid-Fire UPI Velocity**: Monitors payment attempts initiated within 60 seconds across UPI handles (`@okhdfc`, `@oksbi`, `@okicici`, `@paytm`, `@ybl`). Detects account takeover velocity bursts.

### 3. Net-Banking (Direct Account Debit)
- **IFSC Routing Prefix**: Tracks bank routing codes (`HDFC0*`, `SBIN0*`, `ICIC0*`, `UTIB0*`, `PUNB0*`) paired with SHA-256 hashed customer bank accounts.
- **Session Anomaly Score (`netbanking_session_risk`)**: Measures session telemetry irregularities, credential stuffing indicators, and abnormal authentication paths.

### 4. Logistics, Geolocation & Behavioral Friction
- **Pincode Logistics Mismatch Risk**: Quantifies physical delivery risk between the cardholder billing pincode (e.g., Metro `400001` Mumbai) and the shipping destination pincode (e.g., Border/Remote `795001` Imphal). Flags drop-shipping and synthetic identity fraud.
- **CGNAT IP & Device Mismatch**: Accounts for Indian cellular dynamic IP reassignment (14% benign mismatch rate) versus anomalous interstate logins and unrecognized hardware fingerprints.
- **Time-of-Day vs. Category Anomaly**: Detects high-ticket digital assets or liquid voucher purchases occurring in high-risk overnight windows (2:00 AM – 5:00 AM IST).
- **Amount vs. 90-Day Baseline Ratio**: Flags transactions deviating significantly (e.g., $> 3\times$) from a customer's historical average ticket size.

---

## 5. Engineering Rigor: Resolving the "AUC 1.0000" Trap

During initial development, stress-testing models frequently posted test **ROC-AUC scores of `1.0000`** and **PR-AUC scores of `0.9996`**. In production ML, an AUC of 1.0000 almost universally indicates synthetic leakage or non-overlapping distributions. We conducted a root-cause investigation and applied rigorous fixes:

### 1. Root Cause Breakdown
1. **Artificial Synthetic Separability**: Early synthetic generators established rigid, non-overlapping bounds (e.g., genuine VPA age strictly $> 180$ days vs. fraud strictly $< 60$ days; genuine session risk $\le 0.15$ vs. fraud $\ge 0.60$).
2. **Kaggle PCA Feature Shortcuts**: XGBoost models trained on downsampled Kaggle sets exploited mathematical PCA components (`V14`, `V12`) to perfectly isolate fraud with zero false alarms.
3. **Probability Distortion from Re-weighting**: Aggressive `scale_pos_weight` multipliers artificially inflated raw probability outputs, rendering dynamic thresholding ($p^*$) inaccurate on real-world transaction flows.

### 2. Production-Grade Resolutions
* **Realistic Overlapping BFSI Distributions**:
  - **15% of genuine users** create fresh VPAs or have young accounts; **30% of fraudsters** use aged, compromised, or sleeper handles.
  - **18% of legitimate net-banking users** exhibit elevated session risk (`0.35–0.60`) due to corporate VPNs or public Wi-Fi; **22% of fraudsters** operate stealth residential proxies.
  - **15% of genuine e-commerce shoppers** trigger pincode mismatches due to gifting, travel, or workplace delivery.
* **Domain Feature Isolation**: Tier 2 models were retrained exclusively on authentic Indian BFSI domain features rather than Kaggle PCA shortcuts.
* **Unbiased Probability Calibration**: Trained with binary log-loss minimization without extreme minority multipliers so `predict_proba` produces true empirical posteriors $P(\text{Fraud} \mid X)$ matching Bayes decision theory assumptions.
* **Strict Time-Based 80/20 Splitting**: Train and test partitions are strictly chronologically split (earliest 80% train, subsequent 20% test) to prevent temporal look-ahead leakage.

---

## 6. Dynamic Merchant Risk Profiles (Cost Matrix Engine)

A static cutoff ($p > 0.50$) produces sub-optimal unit economics because different business verticals face completely different costs for false alarms versus missed frauds:

### 1. Mathematical Formulation

$$\text{Cost}_{\text{FN}}(A_i, k) = (1 - m_k \cdot \mathbb{I}_{\text{digital}}) \cdot A_i + C_{\text{chargeback\_fee}, k} + C_{\text{penalty}, k}$$
$$\text{Cost}_{\text{FP}}(A_i, k) = C_{\text{friction}, k} + C_{\text{churn}, k} + m_k \cdot A_i$$

Where:
- $A_i$: Transaction amount in ₹ (INR).
- $m_k$: Merchant gross margin percentage.
- $\mathbb{I}_{\text{digital}}$: Indicator (1 for digital goods with zero marginal inventory loss; 0 for physical goods).
- $C_{\text{chargeback\_fee}}$: Payment gateway chargeback processing penalty.
- $C_{\text{penalty}}$: Card network dispute / regulatory penalty.
- $C_{\text{friction}}$: Immediate friction cost (customer support, OTP retry).
- $C_{\text{churn}}$: Customer lifetime value (LTV) lost due to false decline.
- $C_{\text{review}}$: Cost of human analyst review.

The **Cost-Optimal Threshold ($p^*$)** minimizing expected financial loss is given by:

$$p^*(A_i, k) = \frac{\text{Cost}_{\text{FP}}(A_i, k)}{\text{Cost}_{\text{FN}}(A_i, k) + \text{Cost}_{\text{FP}}(A_i, k) - C_{\text{review}, k}}$$

### 2. Merchant Persona Economics Table

| Persona | Ticket Size Range | Gross Margin ($m$) | Churn Loss ($C_{\text{churn}}$) | Average Threshold ($p^*$) | Economic Rationale |
|---|---|---|---|:---:|---|
| **Digital SaaS & Subscriptions** | ₹199 – ₹1,499 | 85% | **₹3,000** | **`69.2%`** | Digital products have near-zero marginal inventory cost. A false decline destroys high recurring LTV; system permits borderline transactions. |
| **High-Value Electronics** | ₹18,000 – ₹75,000 | 8% | **₹800** | **`9.2%`** | 100% physical inventory loss on razor-thin margins. Fraudulent chargeback wipes out margin of 12+ legitimate sales; system holds aggressively. |
| **Quick Commerce & Food** | ₹180 – ₹1,800 | 15% | **₹1,500** | **`45.9%`** | High competitor switching risk (Swiggy, Zepto). Balances immediate inventory loss against user churn. |
| **Gaming & Digital Assets** | ₹1,200 – ₹28,000 | 70% | **₹600** | **`38.9%`** | High instant liquidity cash-out risk with substantial network dispute penalties (₹2,400 total). |

---

## 7. Evaluation Metrics & Ground-Truth Benchmarks

All models are evaluated on strictly **time-split held-out test sets** (first 80% train, subsequent 20% test):

### Benchmark A: Ground-Truth Kaggle Dataset (`mlg-ulb/creditcardfraud`)
- **Source**: Ingested via `kagglehub` (or local verified fallback) comprising **284,807 transactions** (492 real frauds, 0.173% prevalence).
- **Split**: 227,845 train txns (417 frauds) | 56,962 held-out test txns (75 frauds).
- **Zero synthetic overlays**: Evaluated on pure ground-truth PCA and transaction amounts.

| Metric | Measured Value | Industry Benchmark | Status |
|---|:---:|:---:|:---:|
| **PR-AUC (Precision-Recall AUC)** | **`0.7779`** | `≥ 0.7000` | Exceeded |
| **ROC-AUC** | **`0.9850`** | `≥ 0.9500` | Exceeded |
| **Tier 1 Inference Latency** | **`0.0003 ms`** | `< 20.0 ms` | Exceeded |

#### Financial Unit Economics on Kaggle Ground Truth:
| Policy | Decision Rule | False Alarms (FP) | Missed Frauds (FN) | Total Expected Cost | Net Dollar Savings |
|---|---|:---:|:---:|:---:|:---:|
| **Policy A** | **Allow All** (No detection) | 0 | 75 | **\$9,229.26** | Baseline (\$0) |
| **Policy B** | **Static ML Cutoff** ($p > 0.50$) | 7 | 22 | **\$4,176.90** | Saved \$5,052.36 |
| **Policy C** | **Cost-Optimal Dynamic ($p^*$)** | 27 | 17 | **\$4,066.88** | **Saved \$5,162.38** |

> 💡 **Takeaway**: Dynamic thresholding caught **5 additional fraudulent transactions** ($53 \to 58$), delivering **an additional \$110.02 in net margin lift over standard ML**.

---

### Benchmark B: Indian BFSI Multi-Rail Stress-Testing Suite
- **Dataset**: 50,000 transactions with full Card, UPI, and Net-Banking telemetry.
- **Split**: 40,000 train txns | 10,000 held-out test txns (75 frauds).

| Metric | Measured Value | Target SLA | Status |
|---|:---:|:---:|:---:|
| **PR-AUC (Precision-Recall AUC)** | **`0.9811`** | `≥ 0.8500` | Exceeded |
| **ROC-AUC** | **`0.9998`** | `≥ 0.9500` | Exceeded |
| **Tier 1 Single-Tx Latency** | **`0.002 ms`** | `< 20.0 ms` | Exceeded |
| **Tier 2 Queue Latency** | **`45.2 ms`** | `< 500.0 ms` | Exceeded |
| **Realized Savings vs. Allow All** | **`₹25,29,780.90`** | Positive Lift | **+₹25.30 Lakhs** |

#### Realized Savings by Merchant Persona:
- **Digital SaaS & Subscriptions**: ₹24,640 savings vs. Allow All (Avg $p^* = 69.2\%$, avoids false declines on recurring revenue).
- **High-Value Electronics**: ₹20,87,835 savings vs. Allow All (Avg $p^* = 9.2\%$, blocks high-ticket physical inventory drain).
- **Quick Commerce & Food Delivery**: ₹28,054 savings vs. Allow All (Avg $p^* = 45.9\%$, balances churn vs. inventory).
- **Gaming & Digital Assets**: ₹3,89,252 savings vs. Allow All (Avg $p^* = 38.9\%$, shields against voucher cash-outs).

---

## 8. Interactive Risk Ops Review Dashboard

The system includes a production-grade, glassmorphic dark-mode web dashboard built with **React 19**, **TypeScript**, and **Vite**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🛡️ Razorpay buildathon - LossFunction                                       │
│    Cost-Optimized Two-Tier Transaction Fraud Risk Scorer                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ [Persona Selector: All | Digital SaaS | Electronics | Quick Commerce | Gaming]│
├─────────────────────────────────────────────────────────────────────────────┤
│ 📊 KEY RISK & ECONOMICS METRICS                                             │
│    • Realized INR Cost Savings: ₹25.30 Lakhs (-91.5% Cost Reduction)        │
│    • Tier 1 Gatekeeper Latency: < 0.002 ms (SLA < 20ms MET)                 │
│    • Tier 2 Deep Queue Latency: 45.2 ms (SLA < 500ms MET)                   │
│    • Model PR-AUC: 0.9811 | ROC-AUC: 0.9998                                 │
├──────────────────────────────────────┬──────────────────────────────────────┤
│ 📋 INCOMING TRANSACTION QUEUE        │ 🔍 RISK OPS ANALYST SIDEBAR          │
│ • Filter by Action (Allow/Hold/Review│ • Transaction Telemetry & Profiling  │
│ • Filter by Status (Pending/Allowed) │ • Two-Tier Triage Status & Latency   │
│ • Multi-Rail Badges (Card, UPI, NB)  │ • SHAP Waterfall Feature Contribution│
│ • Real-time Search by TXN, VPA, IFSC │ • Top-3 Human-Readable Reason Codes  │
│ • Click-to-inspect individual txns   │ • Expected Financial Loss Breakdown  │
│                                      │ • Action Buttons: [ALLOW] or [HOLD]  │
│                                      │   ↳ Instant Real-time P&L Feedback   │
└──────────────────────────────────────┴──────────────────────────────────────┘
```

### Dashboard Capabilities
1. **Dynamic Persona Switching**: Switch between merchant verticals to observe how optimal threshold ($p^*$), suggested action, and unit economics dynamically adapt to different margin profiles.
2. **Multi-Rail Queue with Instant Search**: Real-time filtering by action (`ALLOW`, `HOLD`, `REVIEW`), review status (`Approved`, `Flagged`, `Pending`), and instant fuzzy search across TXN IDs, Customer IDs, Banks, VPAs, and IFSC codes.
3. **Local SHAP Feature Waterfalls**: Every transaction displays exact feature attribution values ($\phi_i(x)$) computed via `shap.TreeExplainer`, translated into top-3 human-readable domain reason codes (e.g., *"UPI High Velocity: 3 attempts within 60s"*, *"Logistics Distance Anomaly: 400001 -> 795001"*).
4. **Human-in-the-Loop Feedback Loop**: Actioning **Allow** or **Hold** updates the operational status, displays instant unit-economic financial feedback (e.g., *"Fraud Blocked! Prevented chargeback loss of INR 45,500"*), and dynamically recalculates realized merchant savings.
5. **Interactive About & Glossary Modal**: Built-in dialog explaining architecture tiers, signal glossaries, and mathematical loss equations.
6. **Collapsible Workspace Sections**: Toggle minimization on individual dashboard panels to optimize screen space during heavy triage sessions.

---

## 9. REST API Specification

The FastAPI backend exposes 5 primary endpoints:

| Endpoint | Method | Purpose | Key Parameters / Body |
|---|:---:|---|---|
| `/api/transactions` | `GET` | Fetches filtered, scored transaction queue with multi-rail telemetry. | Query: `persona` (str), `triage` (str), `limit` (int, default 150) |
| `/api/metrics` | `GET` | Returns PR-AUC, ROC-AUC, latency SLAs, unit economics matrix, and active HITL realized savings. | Query: `persona` (optional) |
| `/api/explain/{tx_id}` | `GET` | Generates SHAP waterfall data, top-3 reason codes, and expected loss trade-offs for a transaction. | Path: `tx_id`, Query: `persona` (optional) |
| `/api/action` | `POST` | Records human analyst verdict (`Allow` or `Hold`), recalculating realized INR savings and feedback. | JSON: `{"tx_id": "TXN_IN_00001", "action": "Hold", "reviewer": "Analyst_01"}` |
| `/api/score_live` | `POST` | Simulates synchronous Tier 1 live gateway scoring with latency SLA tracking. | JSON: Multi-rail transaction payload (Amount, BIN, VPA, IFSC, Pincode, Velocity) |

---

## 10. How to Run Locally

### Prerequisites
- **Python 3.10+** (Python 3.11/3.12/3.13 supported)
- **Node.js 18+** and **npm**

### Step 1: Clone & Set Up Python Environment
```bash
# Clone the repository
git clone https://github.com/SakshiVerma-19/Razorpay-LossFunction.git
cd Razorpay-LossFunction

# Create and activate virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Step 2: (Optional) Run the Pure Kaggle Ground-Truth Benchmark
To verify calibrated cost-optimal decisioning on the unaltered 284,807 Kaggle dataset:
```bash
python backend/run_kaggle_benchmark.py
```

### Step 3: Train Two-Tier Models & Generate Artifacts
```bash
# 1. Generate enriched Indian BFSI validation features
python backend/data_pipeline.py

# 2. Train Tier 1 LightGBM + Tier 2 XGBoost & compute SHAP values
python backend/model_pipeline.py
```

### Step 4: Start the FastAPI Backend Server
```bash
# Runs backend on http://127.0.0.1:8000
uvicorn backend.app:app --reload --port 8000
```
API documentation is interactively available at **http://127.0.0.1:8000/docs**.

### Step 5: Start the Frontend Dashboard
In a separate terminal window:
```bash
cd frontend
npm install
npm run dev
```
Open **http://localhost:5173** in your browser to access the live Risk Ops Review Dashboard.

---

## 11. Repository Structure

```
LossFunction/
├── backend/
│   ├── app.py                  # FastAPI Advisory Backend (Endpoints: scoring, triage, SHAP, HITL actions)
│   ├── data_pipeline.py        # Indian BFSI multi-rail signal generator & stress-testing suite
│   ├── model_pipeline.py       # Two-Tier training (Tier 1 LightGBM + Tier 2 XGBoost/SHAP + p* engine)
│   └── run_kaggle_benchmark.py # Pure Kaggle ground-truth benchmark (kagglehub + cost matrix evaluation)
├── frontend/                   # React 19 + TypeScript + Vite Dashboard
│   ├── public/                 # Static assets, SVG icons, and LossFunction logos
│   ├── src/
│   │   ├── components/
│   │   │   ├── AboutModal.tsx        # System glossary, architecture breakdown & p* formula dialog
│   │   │   ├── AnalystSidebar.tsx    # Multi-rail signals, SHAP waterfall, reason codes & HITL actions
│   │   │   ├── MetricsOverview.tsx   # Realized INR savings, latency SLAs, PR-AUC & unit economics matrix
│   │   │   ├── PersonaSelector.tsx   # Dynamic Merchant Persona Switcher (SaaS, Electronics, Q-Commerce, Gaming)
│   │   │   └── TransactionQueue.tsx  # Multi-rail triaged queue with search, filters & status pills
│   │   ├── App.tsx                   # Main state orchestrator & API synchronization
│   │   ├── App.css                   # Layout structure styling
│   │   └── index.css                 # Glassmorphic dark-mode design system & animations
│   ├── package.json            # Node.js dependencies
│   ├── tsconfig.json           # TypeScript configuration
│   └── vite.config.ts          # Vite build config
├── data/                       # Datasets, serialized models & metadata (ignored by git)
│   ├── creditcard.csv          # Base Kaggle dataset
│   ├── processed_transactions.csv # Enriched Indian BFSI validation dataset (50,000 txns)
│   ├── tier1_lightgbm.txt      # Serialized Tier 1 LightGBM model
│   ├── tier2_xgboost.bin       # Serialized Tier 2 XGBoost model
│   ├── shap_explainer.pkl      # Serialized SHAP TreeExplainer
│   ├── test_predictions.csv    # Scored held-out test predictions
│   ├── test_shap_values.npy    # Pre-computed SHAP values for test set
│   ├── model_metadata.json     # Feature definitions, MCC target encoding & persona economics
│   └── metrics_summary.json    # Model evaluation metrics & persona cost matrices
├── requirements.txt            # Python dependencies (fastapi, xgboost, lightgbm, shap, etc.)
├── PROJECT_DETAILS.md          # Comprehensive architectural & mathematical deep dive
└── README.md                   # Project overview and quickstart guide
```

---

## 12. License & Acknowledgments

This project was developed for the **Razorpay Buildathon**. Ground-truth transaction data is derived from the ULB Machine Learning Group (`mlg-ulb/creditcardfraud`). All payment signals and merchant configurations are modeled for defense-only risk advisory.
